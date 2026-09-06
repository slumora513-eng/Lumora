/* ==========================================================================
   blueprint/compilador/aws.mjs — passo 3 da §50.5
   §50.2: destino AWS → "Terraform plan (RDS, ECS, S3, CloudFront, SQS)",
   banco "RDS Postgres gerenciado", observação "Destino principal de produção".

   A saída é **Terraform em sintaxe JSON** (`main.tf.json`), que é Terraform
   nativo — `terraform plan` lê `.tf.json` do mesmo jeito que lê `.tf`. A
   escolha não é preguiça de escrever HCL: JSON sai determinístico por
   construção, sem decisão de formatação, e é conferível campo a campo por um
   teste. A §50.3 exige que aplicar o mesmo Blueprint duas vezes não crie nada
   duplicado; isso começa em a saída ser byte a byte a mesma.

   O QUE ESTE EMISSOR NÃO ESCOLHE — porque o fundador já escolheu, no bloco
   "Status de projeto", decisões de segurança de 01/09/2026:

     região        sa-east-1 (São Paulo), "dados de clientes permanecem no
                   Brasil (LGPD)"                              — decisão 3
     borda         CloudFront + AWS WAF com regras gerenciadas
                   + Shield Standard no dia 1                  — decisão 1
     segredos      Secrets Manager, rotação de 90 dias para chave de API e
                   30 dias para credencial de banco, acesso por IAM role, e
                   "NENHUM SEGREDO EM VARIÁVEL DE AMBIENTE NA PRODUÇÃO"
                                                               — decisão 2
     backup        diário retido 7 dias + semanal retido 30, imutável
                   anti-ransomware, RPO ≤ 24h / RTO ≤ 4h       — decisão 6

   A última linha da decisão 2 é a que mais muda o código emitido: no ECS, o
   que é segredo entra em `secrets` (valueFrom → ARN do Secrets Manager) e
   NUNCA em `environment`. São dois campos diferentes na mesma definição de
   contêiner, e a diferença é auditável — o teste confere.
   ========================================================================== */

'use strict';

import { prefixo } from './plano.mjs';
import {
  REGIAO_DE_PRODUCAO, WAF_REGRAS_GERENCIADAS, BACKUP, ROTACAO_DIAS,
  RETENCAO_ANTES_DE_APAGAR_DIAS, COMANDO_MIGRATIONS,
  imagemDaAplicacao, aplicavel, IMAGEM_SENTINELA,
} from './plataforma.mjs';

/* (AGENTE — a §50.1 fixa `db.t4g.medium` e `cache.t4g.micro` para o
   business-p2; a escala das outras faixas é deste agente.) */
const RDS = { pequeno: 'db.t4g.small', medio: 'db.t4g.medium', grande: 'db.t4g.large', extra: 'db.r7g.xlarge' };
const CACHE = { pequeno: 'cache.t4g.micro', medio: 'cache.t4g.micro', grande: 'cache.t4g.small', extra: 'cache.t4g.medium' };
const CPU = { pequeno: 512, medio: 1024, grande: 2048, extra: 4096 };
const MEM = { pequeno: 1024, medio: 2048, grande: 4096, extra: 8192 };

const ehSegredoDeBanco = (nome) => nome.startsWith('banco/');

/** `pagamentos/asaas` → `PAGAMENTOS_ASAAS`, para variável e para nome curto. */
const chaveDoSegredo = (n) => n.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
const idDoSegredo = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '_');

/**
 * @param {object} plano  saída de `resolver()`
 * @param {object} [opcoes]
 * @returns {{arquivos: Record<string,string>, avisos: object[], recursos: string[]}}
 */
export function compilar(plano, opcoes = {}) {
  const avisos = [];
  const nome = prefixo(plano);
  const imagem = imagemDaAplicacao(opcoes);
  const tamanho = plano.stack.tamanho;
  const regiao = plano.stack.regiao || REGIAO_DE_PRODUCAO;

  if (regiao !== REGIAO_DE_PRODUCAO) {
    avisos.push({
      codigo: 'regiao-fora-do-brasil',
      mensagem: `região "${regiao}" contraria a decisão de 01/09/2026: produção em ${REGIAO_DE_PRODUCAO} `
        + '(São Paulo), com os dados de clientes permanecendo no Brasil (LGPD).',
      secao: 'Status de projeto 01/09/2026 · §26',
    });
  }
  if (!aplicavel(imagem)) {
    avisos.push({
      codigo: 'aplicacao-nao-definida',
      mensagem: `o artefato da aplicação Lumora não existe ainda; a saída carrega ${IMAGEM_SENTINELA} `
        + 'e é um plano, não algo aplicável. Informe com --imagem <ref> ou LUMORA_IMAGEM.',
      secao: '§50.5',
    });
  }
  avisos.push({
    codigo: 'rotacao-precisa-de-lambda',
    mensagem: 'a rotação programada de segredos (90 dias para chave de API, 30 para credencial de banco) '
      + 'exige uma função de rotação; passe o ARN em `var.rotacao_lambda_arn`, senão os recursos de '
      + 'rotação ficam com count = 0 e a decisão 2 fica só no papel.',
    secao: 'Status de projeto 01/09/2026, decisão 2',
  });

  /* ---------------------------------------------------------- segredos --- */
  const segredos = {};
  const rotacoes = {};
  const refsDeSegredo = [];
  for (const s of plano.segredos) {
    const id = idDoSegredo(s);
    const dias = ehSegredoDeBanco(s) ? ROTACAO_DIAS.banco : ROTACAO_DIAS.api;
    segredos[id] = {
      name: `${nome}/${s}`,
      description: `Segredo referenciado pelo Blueprint por nome, nunca por valor (§50.3)`,
      // §50.3: destruição protegida — 30 dias de janela antes de sumir.
      recovery_window_in_days: RETENCAO_ANTES_DE_APAGAR_DIAS,
      tags: etiquetas(plano),
    };
    rotacoes[id] = {
      count: '${var.rotacao_lambda_arn == "" ? 0 : 1}',
      secret_id: `\${aws_secretsmanager_secret.${id}.id}`,
      rotation_lambda_arn: '${var.rotacao_lambda_arn}',
      rotation_rules: { automatically_after_days: dias },
    };
    refsDeSegredo.push({
      name: chaveDoSegredo(s),
      valueFrom: `\${aws_secretsmanager_secret.${id}.arn}`,
    });
  }

  /* ------------------------------------------------ definição do contêiner -
     `environment` = configuração. `secrets` = referência ao Secrets Manager.
     A decisão 2 proíbe segredo em variável de ambiente na produção, e é esta
     separação que cumpre a proibição.                                       */
  const ambiente = [
    { name: 'LUMORA_TENANT', value: plano.tenant.id },
    { name: 'LUMORA_PLANO', value: plano.plano.id },
    { name: 'LUMORA_SISTEMAS', value: plano.plano.sistemas.join(',') },
    { name: 'LUMORA_AMBIENTE', value: plano.stack.ambiente },
    { name: 'LUMORA_MOEDA', value: plano.tenant.moeda },
    { name: 'LUMORA_IDIOMA', value: plano.tenant.idioma },
    { name: 'LUMORA_COMUNIDADE', value: plano.tenant.comunidade ? 'true' : 'false' },
    { name: 'LUMORA_SCHEMAS_LOGICOS', value: String(plano.derivado.schemas_logicos) },
    { name: 'LUMORA_BUCKET', value: `\${aws_s3_bucket.arquivos.bucket}` },
    { name: 'LUMORA_FILA', value: `\${aws_sqs_queue.principal.url}` },
    { name: 'REDIS_HOST', value: `\${aws_elasticache_replication_group.cache.primary_endpoint_address}` },
    { name: 'POSTGRES_HOST', value: `\${aws_db_instance.principal.address}` },
  ];

  const logs = (fluxo) => ({
    logDriver: 'awslogs',
    options: {
      'awslogs-group': `\${aws_cloudwatch_log_group.aplicacao.name}`,
      'awslogs-region': regiao,
      'awslogs-stream-prefix': fluxo,
    },
  });

  const conteiner = (nomeC, papel, comando) => ({
    name: nomeC,
    image: imagem,
    essential: true,
    ...(comando ? { command: comando } : {}),
    environment: [...ambiente, { name: 'LUMORA_PAPEL', value: papel }],
    secrets: refsDeSegredo,
    logConfiguration: logs(nomeC),
  });

  const tarefa = (nomeT, papel, comando) => ({
    family: `${nome}-${nomeT}`,
    requires_compatibilities: ['FARGATE'],
    network_mode: 'awsvpc',
    cpu: String(CPU[tamanho]),
    memory: String(MEM[tamanho]),
    execution_role_arn: '${aws_iam_role.execucao.arn}',
    task_role_arn: '${aws_iam_role.tarefa.arn}',
    container_definitions: JSON.stringify([conteiner(nomeT, papel, comando)]),
    tags: etiquetas(plano),
  });

  const servico = (nomeS, contagem) => ({
    name: `${nome}-${nomeS}`,
    cluster: '${aws_ecs_cluster.principal.id}',
    task_definition: `\${aws_ecs_task_definition.${nomeS}.arn}`,
    desired_count: contagem,
    launch_type: 'FARGATE',
    network_configuration: {
      subnets: '${data.aws_subnets.padrao.ids}',
      security_groups: ['${aws_security_group.servico.id}'],
      assign_public_ip: true,
    },
    tags: etiquetas(plano),
  });

  const tf = {
    terraform: {
      required_version: '>= 1.5.0',
      required_providers: { aws: { source: 'hashicorp/aws', version: '~> 5.0' } },
    },
    provider: [
      { aws: { region: regiao } },
      // WAF de escopo CLOUDFRONT e certificado ACM só existem em us-east-1.
      { aws: { alias: 'us_east_1', region: 'us-east-1' } },
    ],
    variable: {
      rotacao_lambda_arn: {
        type: 'string',
        default: '',
        description: 'ARN da função de rotação do Secrets Manager (decisão 2, 01/09/2026)',
      },
    },
    data: {
      aws_vpc: { padrao: { default: true } },
      aws_subnets: { padrao: { filter: { name: 'vpc-id', values: ['${data.aws_vpc.padrao.id}'] } } },
    },
    resource: {
      /* ---- RDS Postgres gerenciado (§50.2) ---- */
      aws_db_instance: {
        principal: {
          identifier: `${nome}-postgres`,
          engine: 'postgres',
          engine_version: '16',
          instance_class: plano.recursos.postgres.tier || RDS[tamanho],
          allocated_storage: plano.recursos.postgres.storage_gb,
          db_name: 'lumora',
          username: 'lumora',
          manage_master_user_password: true,     // a senha nasce no Secrets Manager
          // §37 — nasce ligada, nunca opcional:
          storage_encrypted: plano.seguranca.criptografia_repouso,
          // decisão 6: diário com retenção de 7 dias, RPO ≤ 24h
          backup_retention_period: plano.seguranca.retencao_diaria_dias,
          backup_window: '06:00-07:00',
          copy_tags_to_snapshot: true,
          // §50.3, destruição protegida:
          deletion_protection: true,
          skip_final_snapshot: false,
          final_snapshot_identifier: `${nome}-postgres-final`,
          multi_az: tamanho === 'grande' || tamanho === 'extra',
          performance_insights_enabled: true,
          vpc_security_group_ids: ['${aws_security_group.banco.id}'],
          lifecycle: { prevent_destroy: true },
          tags: etiquetas(plano),
        },
      },
      /* ---- Redis ---- */
      aws_elasticache_replication_group: {
        cache: {
          replication_group_id: `${nome}-cache`,
          description: `Cache do tenant ${plano.tenant.id}`,
          engine: 'redis',
          node_type: plano.recursos.redis.tier || CACHE[tamanho],
          num_cache_clusters: 1,
          at_rest_encryption_enabled: plano.seguranca.criptografia_repouso,
          transit_encryption_enabled: true,
          security_group_ids: ['${aws_security_group.banco.id}'],
          tags: etiquetas(plano),
        },
      },
      /* ---- ECS (§50.2) ---- */
      aws_ecs_cluster: {
        principal: {
          name: `${nome}-cluster`,
          setting: { name: 'containerInsights', value: 'enabled' },
          tags: etiquetas(plano),
        },
      },
      aws_ecs_task_definition: {
        app: tarefa('app', 'web'),
        worker: tarefa('worker', 'worker'),
        // §50.3: as migrations viajam DENTRO do Blueprint e o schema nasce
        // aplicado na primeira subida. Aqui elas são uma tarefa avulsa.
        migrations: tarefa('migrations', 'migrations', COMANDO_MIGRATIONS.split(' ')),
      },
      aws_ecs_service: {
        app: servico('app', plano.recursos.app_replicas),
        worker: servico('worker', plano.recursos.workers_assistente),
      },
      /* ---- S3 (§50.2) ---- */
      aws_s3_bucket: {
        arquivos: {
          bucket: `${nome}-arquivos`,
          lifecycle: { prevent_destroy: true },
          tags: etiquetas(plano),
        },
      },
      aws_s3_bucket_versioning: {
        arquivos: {
          bucket: '${aws_s3_bucket.arquivos.id}',
          versioning_configuration: { status: 'Enabled' },
        },
      },
      aws_s3_bucket_server_side_encryption_configuration: {
        arquivos: {
          bucket: '${aws_s3_bucket.arquivos.id}',
          rule: { apply_server_side_encryption_by_default: { sse_algorithm: 'AES256' } },
        },
      },
      aws_s3_bucket_public_access_block: {
        arquivos: {
          bucket: '${aws_s3_bucket.arquivos.id}',
          block_public_acls: true,
          block_public_policy: true,
          ignore_public_acls: true,
          restrict_public_buckets: true,
        },
      },
      /* ---- SQS (§50.2) ---- */
      aws_sqs_queue: {
        morta: {
          name: `${nome}-dlq`,
          message_retention_seconds: 1209600,
          sqs_managed_sse_enabled: true,
          tags: etiquetas(plano),
        },
        principal: {
          name: `${nome}-fila`,
          visibility_timeout_seconds: 300,
          sqs_managed_sse_enabled: true,
          redrive_policy: '${jsonencode({ deadLetterTargetArn = aws_sqs_queue.morta.arn, maxReceiveCount = 5 })}',
          tags: etiquetas(plano),
        },
      },
      /* ---- WAF + CloudFront (decisão 1) ---- */
      aws_wafv2_web_acl: {
        borda: {
          provider: 'aws.us_east_1',
          name: `${nome}-waf`,
          scope: 'CLOUDFRONT',
          default_action: { allow: {} },
          rule: WAF_REGRAS_GERENCIADAS.map((regra, i) => ({
            name: regra,
            priority: i + 1,
            override_action: { none: {} },
            statement: {
              managed_rule_group_statement: { name: regra, vendor_name: 'AWS' },
            },
            visibility_config: {
              cloudwatch_metrics_enabled: true,
              metric_name: regra,
              sampled_requests_enabled: true,
            },
          })),
          visibility_config: {
            cloudwatch_metrics_enabled: true,
            metric_name: `${nome}-waf`,
            sampled_requests_enabled: true,
          },
          tags: etiquetas(plano),
        },
      },
      aws_cloudfront_distribution: {
        borda: {
          enabled: true,
          comment: `Borda do tenant ${plano.tenant.id}`,
          // Shield Standard vem ligado e sem custo em toda distribuição —
          // por isso não é recurso aqui (decisão 1).
          web_acl_id: '${aws_wafv2_web_acl.borda.arn}',
          origin: {
            domain_name: '${aws_lb.app.dns_name}',
            origin_id: 'app',
            custom_origin_config: {
              http_port: 80,
              https_port: 443,
              origin_protocol_policy: 'https-only',
              origin_ssl_protocols: ['TLSv1.2'],
            },
          },
          default_cache_behavior: {
            target_origin_id: 'app',
            viewer_protocol_policy: 'redirect-to-https',
            allowed_methods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
            cached_methods: ['GET', 'HEAD'],
            cache_policy_id: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad',   // CachingDisabled
          },
          restrictions: { geo_restriction: { restriction_type: 'none' } },
          viewer_certificate: { cloudfront_default_certificate: true },
          tags: etiquetas(plano),
        },
      },
      aws_lb: {
        app: {
          name: `${nome}-alb`,
          load_balancer_type: 'application',
          subnets: '${data.aws_subnets.padrao.ids}',
          security_groups: ['${aws_security_group.servico.id}'],
          drop_invalid_header_fields: true,
          tags: etiquetas(plano),
        },
      },
      /* ---- redes ---- */
      aws_security_group: {
        servico: {
          name: `${nome}-servico`,
          vpc_id: '${data.aws_vpc.padrao.id}',
          ingress: { from_port: 443, to_port: 443, protocol: 'tcp', cidr_blocks: ['0.0.0.0/0'] },
          egress: { from_port: 0, to_port: 0, protocol: '-1', cidr_blocks: ['0.0.0.0/0'] },
          tags: etiquetas(plano),
        },
        banco: {
          name: `${nome}-banco`,
          vpc_id: '${data.aws_vpc.padrao.id}',
          ingress: {
            from_port: 0, to_port: 65535, protocol: 'tcp',
            security_groups: ['${aws_security_group.servico.id}'],
          },
          tags: etiquetas(plano),
        },
      },
      /* ---- segredos (decisão 2) ---- */
      aws_secretsmanager_secret: segredos,
      aws_secretsmanager_secret_rotation: rotacoes,
      /* ---- auditoria append-only (§37) ---- */
      aws_cloudwatch_log_group: {
        aplicacao: {
          name: `/lumora/${plano.tenant.id}/aplicacao`,
          retention_in_days: 90,
          tags: etiquetas(plano),
        },
        auditoria: {
          name: `/lumora/${plano.tenant.id}/auditoria`,
          // A trilha de auditoria é append-only por natureza no CloudWatch e
          // guarda mais tempo que o log comum (§37).
          retention_in_days: 365,
          tags: etiquetas(plano),
        },
      },
      /* ---- backup imutável (decisão 6) ---- */
      aws_backup_vault: {
        cofre: { name: `${nome}-cofre`, tags: etiquetas(plano) },
      },
      aws_backup_vault_lock_configuration: {
        cofre: {
          backup_vault_name: '${aws_backup_vault.cofre.name}',
          // É isto que faz o backup ser IMUTÁVEL: depois de travado, nem quem
          // tem permissão apaga antes do prazo. Anti-ransomware, decisão 6.
          min_retention_days: BACKUP.semanalRetencaoDias,
          max_retention_days: 365,
          changeable_for_days: 3,
        },
      },
      aws_backup_plan: {
        plano: {
          name: `${nome}-backup`,
          rule: [
            {
              rule_name: 'diario',
              target_vault_name: '${aws_backup_vault.cofre.name}',
              schedule: 'cron(0 6 * * ? *)',
              lifecycle: { delete_after: BACKUP.diarioRetencaoDias },
            },
            {
              rule_name: 'semanal',
              target_vault_name: '${aws_backup_vault.cofre.name}',
              schedule: 'cron(0 6 ? * SUN *)',
              lifecycle: { delete_after: BACKUP.semanalRetencaoDias },
            },
          ],
          tags: etiquetas(plano),
        },
      },
      /* ---- IAM: acesso por role, nunca por chave solta (decisão 2) ---- */
      aws_iam_role: {
        execucao: {
          name: `${nome}-execucao`,
          assume_role_policy: JSON.stringify(confiancaEcs()),
          tags: etiquetas(plano),
        },
        tarefa: {
          name: `${nome}-tarefa`,
          assume_role_policy: JSON.stringify(confiancaEcs()),
          tags: etiquetas(plano),
        },
      },
      aws_iam_role_policy: {
        execucao_segredos: {
          name: `${nome}-execucao-segredos`,
          role: '${aws_iam_role.execucao.id}',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [{
              Effect: 'Allow',
              Action: ['secretsmanager:GetSecretValue'],
              Resource: plano.segredos.map((s) => `\${aws_secretsmanager_secret.${idDoSegredo(s)}.arn}`),
            }],
          }),
        },
      },
    },
    output: {
      endereco: { value: '${aws_cloudfront_distribution.borda.domain_name}' },
      banco: { value: '${aws_db_instance.principal.address}', sensitive: true },
      bucket: { value: '${aws_s3_bucket.arquivos.bucket}' },
    },
  };

  const leiaMe = cabecalho(plano, regiao, imagem).join('\n');

  return {
    arquivos: {
      'main.tf.json': `${JSON.stringify(tf, null, 2)}\n`,
      'LEIA-ME.txt': `${leiaMe}\n`,
    },
    avisos,
    recursos: [
      `aws:rds/${nome}-postgres (${plano.recursos.postgres.tier || RDS[tamanho]}, ${plano.recursos.postgres.storage_gb} GB)`,
      `aws:elasticache/${nome}-cache (${plano.recursos.redis.tier || CACHE[tamanho]})`,
      `aws:ecs/${nome}-app (${plano.recursos.app_replicas}x)`,
      `aws:ecs/${nome}-worker (${plano.recursos.workers_assistente}x)`,
      `aws:ecs/${nome}-migrations (tarefa avulsa)`,
      `aws:s3/${nome}-arquivos`,
      `aws:sqs/${nome}-fila + dlq`,
      `aws:cloudfront/${nome} + waf (${WAF_REGRAS_GERENCIADAS.length} regras gerenciadas)`,
      `aws:backup/${nome}-cofre (vault lock, mínimo ${BACKUP.semanalRetencaoDias} dias)`,
      ...plano.segredos.map((s) => `aws:secret/${nome}/${s}`),
    ],
  };
}

function etiquetas(plano) {
  return {
    Projeto: 'Lumora',
    Tenant: plano.tenant.id,
    Plano: plano.plano.id,
    Ambiente: plano.stack.ambiente,
    Origem: 'lumora-blueprint',
  };
}

function confiancaEcs() {
  return {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Principal: { Service: 'ecs-tasks.amazonaws.com' },
      Action: 'sts:AssumeRole',
    }],
  };
}

function cabecalho(plano, regiao, imagem) {
  return [
    'GERADO POR lumora-blueprint — NÃO EDITE À MÃO.',
    'Edite o Blueprint (blueprint.lumora/v1) e compile de novo.',
    '',
    `tenant   ${plano.tenant.id}`,
    `plano    ${plano.plano.id} (${plano.plano.nome})`,
    `destino  aws · ambiente ${plano.stack.ambiente} · região ${regiao}`,
    `imagem   ${imagem}`,
    '',
    'DECISÕES QUE ESTE ARQUIVO CARREGA (Status de projeto, 01/09/2026):',
    `  região ${REGIAO_DE_PRODUCAO} — dados de clientes no Brasil (LGPD)`,
    `  CloudFront + WAF (${WAF_REGRAS_GERENCIADAS.length} regras gerenciadas) + Shield Standard`,
    `  backup diário retido ${BACKUP.diarioRetencaoDias} dias + semanal retido ${BACKUP.semanalRetencaoDias}, com Vault Lock (imutável)`,
    `  rotação de segredos: ${ROTACAO_DIAS.api} dias (API) e ${ROTACAO_DIAS.banco} dias (banco)`,
    '  nenhum segredo em variável de ambiente — tudo por `secrets`/valueFrom',
    `  RPO ≤ ${BACKUP.rpoHoras}h · RTO ≤ ${BACKUP.rtoHoras}h · teste de restauração ${BACKUP.testeDeRestauracao}`,
    '',
    'ANTES DE APLICAR:',
    '  1. terraform init && terraform plan   (§50.3: dry-run é obrigatório)',
    '  2. confira o plano com uma pessoa     (§50.3: a aplicação exige confirmação humana)',
    '  3. var.rotacao_lambda_arn precisa apontar para a função de rotação,',
    '     senão os recursos de rotação ficam com count = 0.',
    '',
    'A rede usa a VPC padrão da conta para que o plano rode numa conta nova.',
    'Em produção de verdade, aponte para uma VPC dedicada.',
  ];
}
