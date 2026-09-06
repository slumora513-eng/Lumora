#!/usr/bin/env node
/* Compilador do Blueprint (§50.2) — passos 2 e 3 da §50.5.
   Node puro: a saída é arquivo, não interface. */

import { mkdtempSync, rmSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { analisar } from '../../blueprint/yaml.mjs';
import { resolver } from '../../blueprint/compilador/plano.mjs';
import { compilar as compilarRender } from '../../blueprint/compilador/render.mjs';
import { compilar as compilarAws } from '../../blueprint/compilador/aws.mjs';
import { compilar, planejar, emitir, DESTINOS, DESTINOS_PENDENTES } from '../../blueprint/compilador/index.mjs';
import { estadoDesejado, diferenca } from '../../blueprint/compilador/estado.mjs';
import { REGIAO_DE_PRODUCAO, BACKUP, ROTACAO_DIAS, IMAGEM_SENTINELA } from '../../blueprint/compilador/plataforma.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const EX = join(RAIZ, 'blueprint', 'exemplos');

let ok = 0, mau = 0;
const t = (c, m, d = '') => {
  if (c) { ok += 1; console.log(`PASS ${m}`); }
  else { mau += 1; console.log(`FALHA ${m}${d ? ` — ${d}` : ''}`); }
};
const lerEx = (n) => readFileSync(join(EX, n), 'utf8');
const temp = () => mkdtempSync(join(tmpdir(), 'lum-bp-'));
const cods = (lista) => (lista || []).map((x) => x.codigo);

const BASE = `apiVersion: blueprint.lumora/v1
metadata:
  nome: "T"
  tenant_id: "t_abc123"
  plano: business-p2
  comunidade: false
stack:
  destino: aws
  regiao: sa-east-1
`;
const RENDER = BASE.replace('  destino: aws\n  regiao: sa-east-1', '  destino: render\n  regiao: oregon');

/* ============================================ plano: a tradução da §50.3 == */

{
  const p = resolver(lerEx('padaria-do-ze.yaml'));
  // A §50.1 publica estes números para o business-p2. Se a tabela de tradução
  // se afastar deles, o único ponto de referência do Guia foi perdido.
  t(p.recursos.app_replicas === 2 && p.recursos.workers_assistente === 2
    && p.recursos.postgres.storage_gb === 50 && p.recursos.postgres.tier === 'db.t4g.medium'
    && p.recursos.redis.tier === 'cache.t4g.micro',
    '§50.1: o exemplo de referência resolve exatamente nos números que a seção publica',
    JSON.stringify(p.recursos));
  t(p.recursos.storage_gb === 20 + 0, '§50.1: storage base do business-p2 é 20 GB');
  t(p.plano.sistemas.join(',') === 'business', '§27: business-p2 liga só o Business');
  t(p.stack.ambiente === 'producao', 'Status de projeto: destino aws é ambiente de produção');
  t(p.limites.veiculos === 2 && p.limites.usuarios === 3,
    '§47: add-on de operação vira limite, não infraestrutura');
  t(p.segredos.includes('banco/t_9f3ac1') && p.segredos.includes('pagamentos/asaas'),
    '§50.3: cada provedor ativo vira um segredo REFERENCIADO por nome');
  t(!p.segredos.some((s) => s.startsWith('open-finance')),
    '§25: open-finance pendente não vira segredo — só ativa com mTLS/ICP-Brasil');
  t(p.segredos.join(',') === p.segredos.slice().sort().join(','),
    '§50.3: a lista de segredos sai ordenada, para a saída não depender da ordem do YAML');
}

{
  const p = resolver(lerEx('ecossistema-selfhost.yaml'));
  t(p.plano.sistemas.join(',') === 'rotacerta,business',
    '§27: o Ecossistema é RotaCerta + Business — nunca o Hub');
  // §50.3: "armazenamento extra → +10 GB por bloco"; §50.1 repete "+10 por add-on".
  // A base aqui é a DECLARADA no Blueprint (50), não a da tabela: o add-on soma
  // por cima do que o arquivo pede, que é como a §50.1 escreve o comentário.
  t(p.recursos.storage_gb === 50 + 30,
    `§50.3: 3 blocos de armazenamento extra somam +30 GB sobre os 50 declarados (${p.recursos.storage_gb})`);
  // §50.3: "filial extra → schema lógico adicional"
  t(p.derivado.schemas_logicos === 5, `§50.3: 4 filiais extras viram 4 schemas além do próprio (${p.derivado.schemas_logicos})`);
  // §50.3: "recarga Aurora → cota de tokens"
  t(p.derivado.cota_aurora === 1, '§50.3: a recarga Aurora vira cota');
  t(p.seguranca.mfa === true && p.seguranca.criptografia_repouso === true
    && p.seguranca.backup_imutavel === true,
    '§37: a segurança do plano resolvido nasce ligada');
}

{
  const semSeguranca = resolver(lerEx('rota-mvp-render.yaml'));
  t(semSeguranca.seguranca.mfa === true && semSeguranca.seguranca.logs_auditoria === 'append-only',
    '§37: bloco de segurança ausente NÃO significa desligado — significa ligado');
  t(semSeguranca.seguranca.retencao_diaria_dias === BACKUP.diarioRetencaoDias
    && semSeguranca.seguranca.retencao_semanal_dias === BACKUP.semanalRetencaoDias
    && semSeguranca.seguranca.rpo_horas === 24 && semSeguranca.seguranca.rto_horas === 4,
    'Status de projeto 01/09/2026: a política de backup entra no plano sem ninguém pedir');
}

{
  // A ordem das chaves do YAML não pode mudar o resultado (§50.3).
  const a = resolver(BASE.replace('  comunidade: false',
    '  addons:\n    usuario_extra: 2\n    veiculo_extra: 1\n  comunidade: false'));
  const b = resolver(BASE.replace('  comunidade: false',
    '  addons:\n    veiculo_extra: 1\n    usuario_extra: 2\n  comunidade: false'));
  t(JSON.stringify(a) === JSON.stringify(b),
    '§50.3: trocar a ordem dos add-ons no YAML não muda o plano resolvido');
}

{
  const comTier = resolver(BASE + 'recursos:\n  postgres: { tier: "db.r7g.2xlarge", storage_gb: 900 }\n');
  t(comTier.recursos.postgres.tier === 'db.r7g.2xlarge' && comTier.recursos.postgres.storage_gb === 900,
    '§47: tier declarado no Blueprint vence a tabela — ela é editável, não imposta');
}

/* ======================================== Render — passo 2 da §50.5 ======= */

{
  const p = resolver(RENDER);
  const s = compilarRender(p);
  const y = s.arquivos['render.yaml'];
  const arv = analisar(y).valor;

  t(!!arv.services && !!arv.databases,
    '§50.2: a saída do Render tem services e databases');
  const tipos = arv.services.map((x) => x.type);
  t(tipos.includes('web') && tipos.includes('worker') && tipos.includes('cron') && tipos.includes('keyvalue'),
    `§50.2: "services + databases + cron" — os quatro estão lá (${tipos.join(', ')})`);
  t(arv.databases[0].postgresMajorVersion === '16' && arv.databases[0].ipAllowList.length === 0,
    '§50.2: Render PostgreSQL, e privado — ipAllowList vazia');

  const web = arv.services.find((x) => x.type === 'web');
  t(web.preDeployCommand === 'lumora migrate deploy',
    '§50.3: as migrations viajam no Blueprint e rodam antes do deploy');
  t(web.numInstances === p.recursos.app_replicas, 'as réplicas vêm do plano resolvido');

  const grupo = arv.envVarGroups[0];
  const segredos = grupo.envVars.filter((v) => v.key.startsWith('LUMORA_SECRET_'));
  t(segredos.length === p.segredos.length && segredos.every((v) => v.sync === false && !('value' in v)),
    '§50.3: todo segredo entra por referência (`sync: false`) e nenhum tem valor no arquivo');
  t(!/LUMORA_SECRET_[A-Z0-9_]+\n\s+value:/.test(y),
    'nenhum segredo aparece com valor no render.yaml');

  t(s.avisos.some((a) => a.codigo === 'render-e-staging'),
    'Status de projeto: todo Blueprint de Render avisa que Render é staging, sem dados de cliente');

  const fora = compilarRender(resolver(RENDER.replace('regiao: oregon', 'regiao: sa-east-1')));
  t(fora.avisos.some((a) => a.codigo === 'regiao-fora-do-destino'),
    '§50.2: o Render não tem região na América do Sul, e o emissor diz isso em vez de emitir errado');

  const dupla = compilarRender(p).arquivos['render.yaml'];
  t(dupla === y, '§50.3: compilar duas vezes o mesmo Blueprint dá bytes idênticos');
}

/* ========================================== AWS — passo 3 da §50.5 ======== */

{
  const p = resolver(lerEx('padaria-do-ze.yaml'));
  const s = compilarAws(p);
  const tf = JSON.parse(s.arquivos['main.tf.json']);
  const r = tf.resource;

  t(tf.provider[0].aws.region === REGIAO_DE_PRODUCAO,
    `decisão 3 (01/09/2026): produção em ${REGIAO_DE_PRODUCAO}, dados no Brasil`);
  t(tf.provider[1].aws.alias === 'us_east_1',
    'WAF de escopo CLOUDFRONT só existe em us-east-1 — o provider alias está lá');

  // §50.2 nomeia cinco famílias de recurso para a AWS.
  for (const [chave, rotulo] of [
    ['aws_db_instance', 'RDS'], ['aws_ecs_service', 'ECS'], ['aws_s3_bucket', 'S3'],
    ['aws_cloudfront_distribution', 'CloudFront'], ['aws_sqs_queue', 'SQS'],
  ]) t(!!r[chave], `§50.2: a saída AWS traz ${rotulo}`);

  const db = r.aws_db_instance.principal;
  t(db.storage_encrypted === true, '§37: banco cifrado em repouso');
  t(db.backup_retention_period === BACKUP.diarioRetencaoDias,
    `decisão 6: retenção diária de ${BACKUP.diarioRetencaoDias} dias`);
  t(db.deletion_protection === true && db.lifecycle.prevent_destroy === true && db.skip_final_snapshot === false,
    '§50.3: destruição protegida — deletion_protection, prevent_destroy e snapshot final');
  t(r.aws_s3_bucket.arquivos.lifecycle.prevent_destroy === true
    && r.aws_s3_bucket_public_access_block.arquivos.block_public_policy === true,
    'S3 privado e protegido contra destruição');

  const trava = r.aws_backup_vault_lock_configuration.cofre;
  t(trava.min_retention_days === BACKUP.semanalRetencaoDias,
    `decisão 6: backup IMUTÁVEL — Vault Lock com mínimo de ${BACKUP.semanalRetencaoDias} dias`);
  t(r.aws_backup_plan.plano.rule.length === 2,
    'decisão 6: duas regras de backup — diária e semanal');

  const waf = r.aws_wafv2_web_acl.borda;
  t(waf.scope === 'CLOUDFRONT' && waf.provider === 'aws.us_east_1' && waf.rule.length === 4
    && r.aws_cloudfront_distribution.borda.web_acl_id.includes('aws_wafv2_web_acl.borda'),
    'decisão 1: CloudFront + WAF com regras gerenciadas, ligado à distribuição');

  const rot = r.aws_secretsmanager_secret_rotation;
  const banco = Object.entries(rot).find(([k]) => k.startsWith('banco_'))[1];
  const api = Object.entries(rot).find(([k]) => !k.startsWith('banco_'))[1];
  t(banco.rotation_rules.automatically_after_days === ROTACAO_DIAS.banco
    && api.rotation_rules.automatically_after_days === ROTACAO_DIAS.api,
    `decisão 2: rotação de ${ROTACAO_DIAS.banco} dias no banco e ${ROTACAO_DIAS.api} nas chaves de API`);
  t(Object.values(r.aws_secretsmanager_secret).every((x) => x.recovery_window_in_days === 30),
    '§50.3: janela de 30 dias antes de um segredo sumir de vez');

  // A decisão 2 é literal: NENHUM segredo em variável de ambiente.
  const app = JSON.parse(r.aws_ecs_task_definition.app.container_definitions)[0];
  t(app.secrets.length === p.segredos.length && app.secrets.every((x) => x.valueFrom.includes('aws_secretsmanager_secret')),
    'decisão 2: o contêiner lê segredo por valueFrom, do Secrets Manager');
  t(!app.environment.some((e) => /SECRET|SENHA|PASSWORD|TOKEN|KEY|CREDENC/i.test(e.name)),
    'decisão 2: nenhum segredo em variável de ambiente');
  t(app.environment.some((e) => e.name === 'LUMORA_TENANT'),
    'a configuração — essa sim — entra por environment');

  const mig = JSON.parse(r.aws_ecs_task_definition.migrations.container_definitions)[0];
  t(mig.command.join(' ') === 'lumora migrate deploy',
    '§50.3: as migrations viajam dentro do Blueprint, como tarefa própria');

  t(!/"(secret_string|password|senha)"/.test(s.arquivos['main.tf.json']),
    'nenhum valor de segredo aparece no Terraform');

  const forcado = compilarAws(resolver(BASE.replace('regiao: sa-east-1', 'regiao: us-east-1')));
  t(forcado.avisos.some((a) => a.codigo === 'regiao-fora-do-brasil'),
    'decisão 3: sair do Brasil dispara aviso citando LGPD');

  t(JSON.stringify(JSON.parse(compilarAws(p).arquivos['main.tf.json'])) === JSON.stringify(tf),
    '§50.3: compilar duas vezes dá o mesmo Terraform');
}

/* ================================== idempotência, dry-run e destruição ==== */

{
  const dir = temp();
  try {
    const texto = lerEx('padaria-do-ze.yaml');
    const p1 = planejar(texto, { saida: dir });
    t(p1.primeiraVez && p1.delta.criar.length > 10 && !p1.delta.destruir.length,
      '§50.3: sem estado anterior, o plano é todo criação');
    t(p1.bloqueios.some((b) => b.includes('artefato da aplicação')),
      `§50.5: o plano bloqueia enquanto o artefato da aplicação não existir (${IMAGEM_SENTINELA})`);
    t(!existsSync(join(dir, 'main.tf.json')), '§50.3: plan não escreve nada — é dry-run');

    const e1 = emitir(texto, { saida: dir });
    t(e1.escritos.length === 2 && existsSync(join(dir, 'main.tf.json')), 'build escreve os artefatos');

    const p2 = planejar(texto, { saida: dir });
    t(p2.delta.semMudanca === true,
      '§50.3, idempotência total: compilar de novo não cria nada duplicado');

    const conteudo = readFileSync(join(dir, 'main.tf.json'), 'utf8');
    emitir(texto, { saida: dir });
    t(readFileSync(join(dir, 'main.tf.json'), 'utf8') === conteudo,
      '§50.3: a segunda emissão produz bytes idênticos');

    // Subir de plano: recursos mudam de tamanho, e o plano mostra isso.
    const maior = texto.replace('plano: business-p2', 'plano: business-p3')
      .replace('postgres: { tier: "db.t4g.medium", storage_gb: 50 }', 'postgres: { storage_gb: 200 }');
    const p3 = planejar(maior, { saida: dir });
    t(p3.delta.alterar.some((x) => x.includes('rds') && x.includes('50 GB') && x.includes('200 GB')),
      '§50.3: mudar de plano aparece como ALTERAR, com o antes e o depois',
      p3.delta.alterar.join(' | '));
    t(!p3.delta.alterar.some((x) => x.includes('ecs')),
      'e o que o Blueprint declarou à mão (app_replicas) NÃO muda junto — declaração vence tabela');

    // Tirar um provedor destrói o segredo dele — e destruir exige confirmação.
    const menos = texto.replace(/^\s*tts:.*\n/m, '');
    const p4 = planejar(menos, { saida: dir });
    t(p4.delta.destruir.some((x) => x.includes('tts')),
      '§50.3: tirar um provedor aparece como DESTRUIR', p4.delta.destruir.join(' | '));
    const recusa = emitir(menos, { saida: dir });
    t(!!recusa.recusado && !recusa.escritos.length,
      '§50.3: destruir recurso exige confirmação humana — sem --confirmar, recusa');
    const aceito = emitir(menos, { saida: dir, confirmar: true });
    t(aceito.escritos.length === 2 && !aceito.recusado,
      '§50.3: com a confirmação explícita, a emissão acontece');
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

{
  const d = diferenca(null, estadoDesejado(compilar(lerEx('rota-mvp-render.yaml'), {})));
  t(d.criar.length && !d.alterar.length && !d.destruir.length && d.semMudanca === false,
    'diferenca() sem estado anterior é criação pura');
}

/* ======================================= destinos ainda sem emissor ======= */

{
  t(Object.keys(DESTINOS).sort().join(',') === 'aws,render',
    '§50.5: os emissores construídos são exatamente Render (passo 2) e AWS (passo 3)');
  const r = compilar(lerEx('ecossistema-selfhost.yaml'), {});
  t(!r.ok && cods(r.erros).includes('destino-sem-emissor')
    && r.erros[0].mensagem.includes('passo 4'),
    '§50.5: docker é o passo 4 e recusa com o motivo, em vez de emitir qualquer coisa');
  t(Object.keys(DESTINOS_PENDENTES).sort().join(',') === 'digitalocean,docker,gcp',
    '§50.2/§50.5: os três destinos restantes estão declarados como pendentes');
}

{
  const invalido = readFileSync(join(EX, 'invalidos', 'hub-como-plano.yaml'), 'utf8');
  const r = compilar(invalido, {});
  t(!r.ok && cods(r.erros).includes('hub-nao-e-produto'),
    'validar → resolver → emitir: Blueprint inválido não chega ao emissor');
}

/* ------------------------------------------------------------------ CLI -- */

const cli = (args) => {
  try {
    return { codigo: 0, saida: execFileSync(process.execPath,
      [join(RAIZ, 'blueprint', 'lumora-blueprint.mjs'), ...args],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (e) { return { codigo: e.status, saida: `${e.stdout || ''}${e.stderr || ''}` }; }
};

{
  const dir = temp();
  try {
    const arq = join(dir, 'bp.yaml');
    writeFileSync(arq, lerEx('rota-mvp-render.yaml'));
    const alvo = join(dir, 'saida');

    const p = cli(['plan', arq, '--saida', alvo]);
    t(p.codigo === 0 && /a criar,/.test(p.saida) && /Dry-run/.test(p.saida),
      'CLI: plan sai com 0 e diz que nada foi escrito');
    t(!existsSync(join(alvo, 'render.yaml')), 'CLI: plan mesmo não escreve arquivo');

    const b = cli(['build', arq, '--saida', alvo, '--imagem', 'registry/lumora:1.0.0']);
    t(b.codigo === 0 && existsSync(join(alvo, 'render.yaml')), 'CLI: build escreve o render.yaml');
    t(readFileSync(join(alvo, 'render.yaml'), 'utf8').includes('registry/lumora:1.0.0'),
      'CLI: --imagem entra no lugar do sentinela');
    t(!b.saida.includes('é um PLANO, não algo aplicável'),
      'CLI: com a imagem informada, o bloqueio some');

    for (const c of ['apply', 'destroy']) {
      const r = cli([c, arq]);
      t(r.codigo === 3 && /não foi construído/.test(r.saida),
        `CLI: "${c}" continua recusado com o motivo, e sai com 3`);
    }
    const esq = cli(['esquema']).saida;
    t(/emissor construído/.test(esq) && /emissor pendente/.test(esq),
      'CLI: o esquema diz quais destinos têm emissor e quais não têm');
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

console.log(`${ok} PASS, ${mau} FALHA`);
process.exit(mau ? 1 : 0);
