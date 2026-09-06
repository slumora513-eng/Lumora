/* ==========================================================================
   blueprint/compilador/render.mjs — passo 2 da §50.5
   §50.2: destino Render → "render.yaml nativo (services + databases + cron)",
   banco "Render PostgreSQL", observação "Deploy rápido, bom para MVP".

   OS TRÊS BLOCOS QUE A §50.2 NOMEIA ESTÃO AQUI, E CADA UM TEM MOTIVO:
     services  — o web (app_replicas), o worker (workers_assistente) e o
                 Key Value (o `redis` do §50.1);
     databases — Render PostgreSQL, privado (ipAllowList vazia);
     cron      — a verificação diária de backup que a política de 01/09/2026
                 exige ("backup diário automático", RPO ≤ 24h).

   O AVISO QUE ESTE EMISSOR SEMPRE DÁ, E POR QUE ELE NÃO É CHATICE:
   o Render não tem região na América do Sul. A decisão de segurança 3 do
   fundador (01/09/2026) diz "produção em sa-east-1 (São Paulo) — dados de
   clientes permanecem no Brasil (LGPD)". As duas coisas não cabem juntas — e
   é exatamente por isso que o mesmo registro decide "Render = ambiente de
   testes (staging) (...) dados descartáveis, disco efêmero, SEM DADOS DE
   CLIENTE". O emissor repete isso em vez de deixar alguém descobrir depois.
   ========================================================================== */

'use strict';

import { serializar } from '../yaml.mjs';
import { prefixo } from './plano.mjs';
import {
  BACKUP, COMANDO_MIGRATIONS, imagemDaAplicacao, aplicavel, IMAGEM_SENTINELA,
} from './plataforma.mjs';

/** Regiões que o Render oferece. Nenhuma na América do Sul. */
export const REGIOES = ['oregon', 'ohio', 'virginia', 'frankfurt', 'singapore'];
export const REGIAO_PADRAO = 'oregon';

/* (AGENTE — a §50.2 diz "render.yaml nativo" e não mapeia tamanho para plano
   do Render. A escala abaixo é deste agente.) */
const PLANO_WEB = { pequeno: 'starter', medio: 'standard', grande: 'pro', extra: 'pro plus' };
const PLANO_BANCO = { pequeno: 'basic-256mb', medio: 'basic-1gb', grande: 'basic-4gb', extra: 'pro-8gb' };
const PLANO_CHAVE_VALOR = { pequeno: 'starter', medio: 'starter', grande: 'standard', extra: 'pro' };

/** `pagamentos/asaas` → `LUMORA_SECRET_PAGAMENTOS_ASAAS`. Determinístico. */
export function variavelDeSegredo(nome) {
  return `LUMORA_SECRET_${nome.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
}

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

  let regiao = plano.stack.regiao || REGIAO_PADRAO;
  if (!REGIOES.includes(regiao)) {
    avisos.push({
      codigo: 'regiao-fora-do-destino',
      mensagem: `"${regiao}" não é região do Render (${REGIOES.join(', ')}); usando ${REGIAO_PADRAO}`,
      secao: '§50.2',
    });
    regiao = REGIAO_PADRAO;
  }

  // O aviso que vale para todo Blueprint de Render, sempre.
  avisos.push({
    codigo: 'render-e-staging',
    mensagem: 'Render não tem região na América do Sul, então não sustenta a residência de dados '
      + 'em sa-east-1 decidida para produção. O próprio registro de 01/09/2026 reserva o Render a '
      + 'staging: dados descartáveis, disco efêmero, sem dados de cliente.',
    secao: 'Status de projeto 01/09/2026 · §50.2',
  });

  if (!aplicavel(imagem)) {
    avisos.push({
      codigo: 'aplicacao-nao-definida',
      mensagem: `o artefato da aplicação Lumora não existe ainda; a saída carrega ${IMAGEM_SENTINELA} `
        + 'e é um plano, não algo aplicável. Informe com --imagem <ref> ou LUMORA_IMAGEM.',
      secao: '§50.5',
    });
  }

  const bancoNome = `${nome}-postgres`;
  const chaveValorNome = `${nome}-keyvalue`;

  /* Grupo de variáveis: a configuração e os segredos ficam num lugar só, e os
     três serviços apontam para ele. Não é economia de linha — é a garantia de
     que app, worker e cron enxergam EXATAMENTE a mesma configuração. Três
     cópias que precisam concordar são três cópias que um dia discordam. */
  const grupo = `${nome}-config`;
  const doGrupo = [
    { key: 'LUMORA_TENANT', value: plano.tenant.id },
    { key: 'LUMORA_PLANO', value: plano.plano.id },
    { key: 'LUMORA_SISTEMAS', value: plano.plano.sistemas.join(',') },
    { key: 'LUMORA_AMBIENTE', value: plano.stack.ambiente },
    { key: 'LUMORA_MOEDA', value: plano.tenant.moeda },
    { key: 'LUMORA_IDIOMA', value: plano.tenant.idioma },
    { key: 'LUMORA_COMUNIDADE', value: plano.tenant.comunidade ? 'true' : 'false' },
    { key: 'LUMORA_SCHEMAS_LOGICOS', value: String(plano.derivado.schemas_logicos) },
  ];
  for (const s of plano.segredos) {
    // `sync: false` é a forma nativa do Render de dizer "esta variável existe,
    // o valor NÃO está neste arquivo". É a referência por nome que a §50.3 exige.
    doGrupo.push({ key: variavelDeSegredo(s), sync: false });
  }

  // Ligações a outros recursos não cabem num grupo — o Render as resolve por
  // serviço. Por isso estas duas ficam inline, e só estas duas.
  const envVars = [
    { fromGroup: grupo },
    { key: 'DATABASE_URL', fromDatabase: { name: bancoNome, property: 'connectionString' } },
    { key: 'REDIS_URL', fromService: { name: chaveValorNome, type: 'keyvalue', property: 'connectionString' } },
  ];

  const comum = { runtime: 'image', region: regiao, image: { url: imagem } };

  const services = [
    {
      type: 'web',
      name: `${nome}-app`,
      ...comum,
      plan: PLANO_WEB[tamanho],
      numInstances: plano.recursos.app_replicas,
      healthCheckPath: '/saude',
      // §50.3: "migrations versionadas viajam DENTRO do Blueprint; o schema
      // nasce aplicado na primeira subida".
      preDeployCommand: COMANDO_MIGRATIONS,
      envVars,
    },
    {
      type: 'worker',
      name: `${nome}-worker`,
      ...comum,
      plan: PLANO_WEB[tamanho],
      numInstances: plano.recursos.workers_assistente,
      // §0/§50.1: "processamento pesado no backend".
      envVars: [...envVars, { key: 'LUMORA_PAPEL', value: 'worker' }],
    },
    {
      type: 'keyvalue',
      name: chaveValorNome,
      region: regiao,
      plan: PLANO_CHAVE_VALOR[tamanho],
      ipAllowList: [],              // só a rede interna do Render alcança
      maxmemoryPolicy: 'allkeys_lru',
    },
    {
      type: 'cron',
      name: `${nome}-backup-diario`,
      ...comum,
      plan: PLANO_WEB.pequeno,
      // Política de backup de 01/09/2026: diário, RPO ≤ 24h.
      schedule: '0 5 * * *',
      dockerCommand: 'lumora backup executar --retencao-dias '
        + `${BACKUP.diarioRetencaoDias} --semanal-dias ${BACKUP.semanalRetencaoDias}`,
      envVars,
    },
  ];

  const databases = [{
    name: bancoNome,
    databaseName: 'lumora',
    user: 'lumora',
    plan: PLANO_BANCO[tamanho],
    region: regiao,
    postgresMajorVersion: '16',
    diskSizeGB: plano.recursos.postgres.storage_gb,
    ipAllowList: [],                // banco privado: nada de fora entra
  }];

  const cabecalho = [
    'GERADO POR lumora-blueprint — NÃO EDITE À MÃO.',
    'Edite o Blueprint (blueprint.lumora/v1) e compile de novo.',
    '',
    `tenant   ${plano.tenant.id}`,
    `plano    ${plano.plano.id} (${plano.plano.nome})`,
    `destino  render · ambiente ${plano.stack.ambiente} · região ${regiao}`,
    '',
    'AVISO (Status de projeto, 01/09/2026): o Render é a área de TESTES.',
    'Dados descartáveis, disco efêmero, sem dados de cliente. Produção é AWS.',
    '',
    'Nenhum segredo aparece neste arquivo. As variáveis marcadas `sync: false`',
    'existem por nome e recebem valor no painel do Render (§50.3/§37).',
  ];

  const envVarGroups = [{ name: grupo, envVars: doGrupo }];

  return {
    arquivos: { 'render.yaml': serializar({ envVarGroups, services, databases }, { cabecalho }) },
    avisos,
    recursos: [
      `render:envVarGroup/${grupo} (${doGrupo.length} variáveis, ${plano.segredos.length} por referência)`,
      `render:web/${nome}-app (${plano.recursos.app_replicas}x ${PLANO_WEB[tamanho]})`,
      `render:worker/${nome}-worker (${plano.recursos.workers_assistente}x)`,
      `render:keyvalue/${chaveValorNome} (${PLANO_CHAVE_VALOR[tamanho]})`,
      `render:cron/${nome}-backup-diario (0 5 * * *)`,
      `render:postgres/${bancoNome} (${PLANO_BANCO[tamanho]}, ${plano.recursos.postgres.storage_gb} GB)`,
    ],
  };
}
