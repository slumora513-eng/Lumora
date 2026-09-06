/* ==========================================================================
   blueprint/esquema.mjs — o que o blueprint.lumora/v1 aceita, e de onde vem
   Cada catálogo aqui é citado do Guia. Onde o Guia não enumera, está marcado
   AGENTE — e nesses casos o valor desconhecido vira AVISO, nunca erro, porque
   §47 diz que essas tabelas são editáveis no Hub "sem novo deploy": um
   validador que reprovasse por elas transformaria edição de catálogo em
   release de código.
   ========================================================================== */

'use strict';

export const API_VERSION = 'blueprint.lumora/v1';        // §50.1

/* ---------------------------------------------------------------- planos --
   §27, nomenclatura Opção C aprovada pelo Fundador em 01/09/2026.
   "Plano 1/2/3" permanece como identificador técnico interno — que é
   exatamente a forma usada no exemplo da §50.1 (`plano: business-p2`).      */
export const PLANOS = {
  'rotacerta-p1':   { sistema: 'RotaCerta',          nome: 'Bússola' },
  'rotacerta-p2':   { sistema: 'RotaCerta',          nome: 'Horizonte' },
  'rotacerta-p3':   { sistema: 'RotaCerta',          nome: 'Atlas' },
  'business-p1':    { sistema: 'Lumora Business',    nome: 'Núcleo' },
  'business-p2':    { sistema: 'Lumora Business',    nome: 'Fatura' },
  'business-p3':    { sistema: 'Lumora Business',    nome: 'Império' },
  'ecossistema-p1': { sistema: 'Lumora Ecossistema', nome: 'Orquestra' },
  'ecossistema-p2': { sistema: 'Lumora Ecossistema', nome: 'Galáxia' },
  'ecossistema-p3': { sistema: 'Lumora Ecossistema', nome: 'Supernova' },
  'empresas':       { sistema: 'Lumora Empresas',    nome: 'sob consulta' },
};

/* O Hub não é plano, não é destino e não é produto do catálogo (§17, §34).
   Um Blueprint provisiona a pilha de um CLIENTE; o Hub é da equipe Lumora. */
export const NAO_E_PRODUTO = ['hub', 'lumora-hub', 'hub-p1', 'hub-p2', 'hub-p3'];

/* ------------------------------------------------------------- destinos --
   §50.2, os cinco da v1, na ordem do roadmap da §50.5.                     */
export const DESTINOS = {
  aws:          { terraform: true,  obs: 'destino principal de produção' },
  render:       { terraform: false, obs: 'render.yaml nativo — deploy rápido, bom para MVP' },
  docker:       { terraform: false, obs: 'self-host: docker-compose.yml + .env.example + migrations' },
  digitalocean: { terraform: false, obs: 'App Platform spec (app.yaml)' },
  gcp:          { terraform: true,  obs: 'Fase 2, depois de AWS e Render (§50.2)' },
};

/** Destinos que rodam no servidor do próprio cliente: sem região de nuvem. */
export const DESTINOS_SEM_REGIAO = ['docker'];

/* (AGENTE — a §50.1 exemplifica `tamanho: medium` e não enumera a escala.) */
export const TAMANHOS = ['small', 'medium', 'large'];

/* -------------------------------------------------------------- add-ons --
   §47, catálogo de referência. A própria §47 diz que o catálogo e os preços
   são editáveis no Hub — por isso chave fora desta lista é AVISO.           */
export const ADDONS = [
  'veiculo_extra', 'entregador_extra', 'operador_extra', 'integracao_marketplace_extra',
  'roteamento_ia_extra', 'usuario_extra', 'filial_extra', 'pdv_extra', 'tef_pix_extra',
  'armazenamento_extra', 'recarga_aurora', 'conector_generico_avancado',
];

/* ------------------------------------------------------------ provedores --
   §46 + as seis famílias nomeadas verbatim no exemplo da §50.1. A tabela viva
   é a do Hub (§46), então família fora desta lista também é só AVISO.       */
export const PROVEDORES = [
  'ia-assistente', 'tts', 'pagamentos', 'fiscal', 'boleto-pix', 'open-finance',
];

/** §25/§50.4: Open Finance só ativa depois das credenciais mTLS/ICP-Brasil. */
export const PENDENTE = 'pendente';

/* ----------------------------------------------------------- segurança --
   §37 + §50.1: "nasce ligada, nunca opcional". Estas quatro não são opções
   do cliente; desligar qualquer uma é erro, não preferência.                */
export const SEGURANCA_OBRIGATORIA = {
  mfa: true,
  criptografia_repouso: true,
  backup_imutavel: true,
};
export const LOGS_AUDITORIA = 'append-only';

/* ---------------------------------------------------------- segredos --
   §50.3: "Segredos nunca no YAML (...) o Blueprint referencia segredos por
   nome (secret: payments/asaas), nunca por valor."                          */
export const CHAVES_DE_SEGREDO = /(senha|password|secret[_-]?(?:key|value)?|token|api[_-]?key|chave|credencial|credentials|certificado|cert|pfx|p12|private[_-]?key)$/i;

/** Formas de valor que denunciam segredo literal, mesmo sob chave inocente. */
export const VALOR_PARECE_SEGREDO = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'chave privada em texto'],
  [/-----BEGIN CERTIFICATE-----/, 'certificado em texto'],
  [/^(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{8,}$/, 'chave de API de gateway'],
  [/^gh[pousr]_[A-Za-z0-9]{20,}$/, 'token do GitHub'],
  [/^AKIA[0-9A-Z]{16}$/, 'chave de acesso AWS'],
  [/^ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./, 'JWT'],
  [/^[A-Fa-f0-9]{40,}$/, 'segredo hexadecimal'],
  [/^[A-Za-z0-9+/]{40,}={0,2}$/, 'segredo em base64'],
];

/** A única forma aceita de citar um segredo: `secret: familia/nome`. */
export const REFERENCIA_DE_SEGREDO = /^secret:\s*[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)+$/;

/* ------------------------------------------------------------- estrutura --
   Blocos de primeiro nível. `obrigatorio` só onde a §50.1 não oferece
   derivação: recursos vêm do plano e provedores vêm da tabela do Hub (§50.3),
   então os dois podem faltar — o compilador preenche.                       */
export const BLOCOS = {
  apiVersion: { obrigatorio: true,  tipo: 'string' },
  metadata:   { obrigatorio: true,  tipo: 'mapa' },
  stack:      { obrigatorio: true,  tipo: 'mapa' },
  provedores: { obrigatorio: false, tipo: 'mapa', derivavel: 'tabela de provedores ativos do Hub (§46/§50.3)' },
  recursos:   { obrigatorio: false, tipo: 'mapa', derivavel: 'plano + add-ons (§27/§47/§50.3)' },
  seguranca:  { obrigatorio: false, tipo: 'mapa', derivavel: 'padrão ligado da §37 — ausente significa tudo ligado' },
};

export const CAMPOS = {
  'metadata.nome':        { obrigatorio: true,  tipo: 'string' },
  'metadata.tenant_id':   { obrigatorio: true,  tipo: 'string', formato: /^t_[a-z0-9]{6,}$/ },
  'metadata.plano':       { obrigatorio: true,  tipo: 'string' },
  'metadata.addons':      { obrigatorio: false, tipo: 'mapa' },
  'metadata.moeda':       { obrigatorio: false, tipo: 'string', formato: /^[A-Z]{3}$/ },
  'metadata.idioma':      { obrigatorio: false, tipo: 'string', formato: /^[a-z]{2}(?:-[A-Z]{2})?$/ },
  'metadata.comunidade':  { obrigatorio: false, tipo: 'booleano' },
  'stack.destino':        { obrigatorio: true,  tipo: 'string' },
  'stack.regiao':         { obrigatorio: false, tipo: 'string' },
  'stack.tamanho':        { obrigatorio: false, tipo: 'string' },
  'recursos.app_replicas':      { obrigatorio: false, tipo: 'inteiro', minimo: 1 },
  'recursos.storage_gb':        { obrigatorio: false, tipo: 'inteiro', minimo: 1 },
  'recursos.workers_assistente':{ obrigatorio: false, tipo: 'inteiro', minimo: 0 },
  'recursos.postgres':          { obrigatorio: false, tipo: 'mapa' },
  'recursos.redis':             { obrigatorio: false, tipo: 'mapa' },
  'seguranca.mfa':                  { obrigatorio: false, tipo: 'booleano' },
  'seguranca.criptografia_repouso': { obrigatorio: false, tipo: 'booleano' },
  'seguranca.backup_imutavel':      { obrigatorio: false, tipo: 'booleano' },
  'seguranca.logs_auditoria':       { obrigatorio: false, tipo: 'string' },
};
