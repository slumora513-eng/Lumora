/* ==========================================================================
   blueprint/compilador/plano.mjs
   Blueprint declarativo → PLANO DE RECURSOS resolvido.

   §50.3: "Recursos derivados de plano e add-ons: plano define o tier base;
   cada add-on do §47 soma recursos (ex.: filial extra → schema lógico
   adicional; recarga Aurora → cota de tokens; armazenamento extra → +10 GB
   por bloco). A tabela de tradução plano→recursos fica editável no Hub
   (§47), sem novo deploy."

   Este arquivo É essa tabela de tradução. Ele existe separado dos emissores
   por causa da frase que a §50.2 usa: "mesma entrada, saídas equivalentes".
   Se cada emissor derivasse os próprios recursos, "equivalentes" viraria
   coincidência. Aqui a derivação acontece UMA vez, e Render e AWS recebem o
   mesmo plano resolvido — cada um só traduz para o próprio vocabulário.

   O plano resolvido é determinístico: mesma entrada, mesmo objeto, sempre.
   Nada de data, hora, aleatório ou ordem de iteração instável — é isso que
   sustenta a idempotência total exigida pela §50.3.
   ========================================================================== */

'use strict';

import { analisar } from '../yaml.mjs';
import { PLANOS } from '../esquema.mjs';
import {
  AMBIENTE_POR_DESTINO, REGIAO_DE_PRODUCAO, BACKUP, ROTACAO_DIAS,
  RETENCAO_ANTES_DE_APAGAR_DIAS,
} from './plataforma.mjs';

/* ------------------------------------------------------- tamanhos ---------
   Escala abstrata. Cada emissor traduz para o próprio vocabulário — é o que
   permite "mesma entrada, saídas equivalentes" sem que o formato precise
   conhecer nomes de instância de nuvem nenhuma.                            */
export const TAMANHOS = ['pequeno', 'medio', 'grande', 'extra'];

/* (AGENTE — a §50.1 publica UM ponto de referência: business-p2 com
   app_replicas 2, postgres db.t4g.medium/50 GB, redis cache.t4g.micro,
   storage 20 GB e workers 2. A linha `business-p2` abaixo é esse ponto,
   verbatim. As outras oito são extrapolação deste agente, ancoradas nos
   limites de usuários e veículos que a §27 registra por plano.

   Esta tabela é exatamente a que a §47 manda manter editável no Hub "sem novo
   deploy" — está num arquivo só, e trocá-la não toca em emissor nenhum.)   */
export const RECURSOS_POR_PLANO = {
  'rotacerta-p1':   { tamanho: 'pequeno', app_replicas: 1, postgres_gb: 20,  storage_gb: 10,  workers: 1 },
  'rotacerta-p2':   { tamanho: 'medio',   app_replicas: 2, postgres_gb: 50,  storage_gb: 20,  workers: 2 },
  'rotacerta-p3':   { tamanho: 'grande',  app_replicas: 4, postgres_gb: 200, storage_gb: 50,  workers: 4 },
  'business-p1':    { tamanho: 'pequeno', app_replicas: 1, postgres_gb: 20,  storage_gb: 10,  workers: 1 },
  'business-p2':    { tamanho: 'medio',   app_replicas: 2, postgres_gb: 50,  storage_gb: 20,  workers: 2 },  // §50.1, verbatim
  'business-p3':    { tamanho: 'grande',  app_replicas: 4, postgres_gb: 200, storage_gb: 50,  workers: 4 },
  'ecossistema-p1': { tamanho: 'medio',   app_replicas: 2, postgres_gb: 50,  storage_gb: 20,  workers: 2 },
  'ecossistema-p2': { tamanho: 'grande',  app_replicas: 4, postgres_gb: 200, storage_gb: 50,  workers: 4 },
  'ecossistema-p3': { tamanho: 'extra',   app_replicas: 6, postgres_gb: 500, storage_gb: 100, workers: 8 },
  'empresas':       { tamanho: 'extra',   app_replicas: 6, postgres_gb: 500, storage_gb: 100, workers: 8 },
};

/** Quais sistemas o plano liga. O Ecossistema é RotaCerta + Business (§27). */
export const SISTEMAS_DO_PLANO = {
  rotacerta:   ['rotacerta'],
  business:    ['business'],
  ecossistema: ['rotacerta', 'business'],
  empresas:    ['rotacerta', 'business'],
};

/* --------------------------------------------------------- add-ons -------
   §50.3 nomeia três efeitos, e são os três que estão aqui:
     "filial extra → schema lógico adicional"
     "recarga Aurora → cota de tokens"
     "armazenamento extra → +10 GB por bloco"
   §50.1 repete o terceiro em comentário: "+ 10 por add-on 'armazenamento
   extra'". Os add-ons de operação (veículo, entregador, usuário) somam
   assento, não infraestrutura — por isso entram em `limites`, não em
   `recursos`: eles mudam o que o plano permite, não o que a nuvem provisiona.
   (AGENTE — o passo por unidade de cada limite; a §47 não os publica.)     */
export const EFEITO_DO_ADDON = {
  armazenamento_extra: { alvo: 'recursos.storage_gb', por_unidade: 10 },   // GUIA §50.3/§50.1
  filial_extra:        { alvo: 'derivado.schemas_logicos', por_unidade: 1 }, // GUIA §50.3
  recarga_aurora:      { alvo: 'derivado.cota_aurora', por_unidade: 1 },     // GUIA §50.3
  veiculo_extra:       { alvo: 'limites.veiculos', por_unidade: 1 },
  entregador_extra:    { alvo: 'limites.entregadores', por_unidade: 1 },
  operador_extra:      { alvo: 'limites.operadores', por_unidade: 1 },
  usuario_extra:       { alvo: 'limites.usuarios', por_unidade: 1 },
  pdv_extra:           { alvo: 'limites.pdv', por_unidade: 1 },
  tef_pix_extra:       { alvo: 'limites.tef', por_unidade: 1 },
  integracao_marketplace_extra: { alvo: 'limites.integracoes', por_unidade: 1 },
  roteamento_ia_extra: { alvo: 'derivado.cota_roteamento', por_unidade: 1 },
  conector_generico_avancado:   { alvo: 'limites.conectores', por_unidade: 1 },
};

/** Um degrau acima/abaixo na escala, sem sair dela. */
function deslocarTamanho(base, alvo) {
  if (!alvo) return base;
  const mapa = { small: 'pequeno', medium: 'medio', large: 'grande' };
  const pedido = mapa[alvo] || alvo;
  return TAMANHOS.includes(pedido) ? pedido : base;
}

function somar(destino, caminho, quanto) {
  const partes = caminho.split('.');
  const folha = partes.pop();
  const alvo = partes.reduce((o, k) => (o[k] = o[k] || {}), destino);
  alvo[folha] = (alvo[folha] || 0) + quanto;
}

/**
 * Resolve um Blueprint em plano de recursos.
 *
 * @param {string|object} entrada  texto YAML ou árvore já analisada
 * @returns {object} plano resolvido, determinístico
 */
export function resolver(entrada) {
  const bp = typeof entrada === 'string' ? analisar(entrada).valor : entrada;

  const meta = bp.metadata || {};
  const stack = bp.stack || {};
  const destino = String(stack.destino || '').toLowerCase();
  const idPlano = String(meta.plano || '').toLowerCase();
  const base = RECURSOS_POR_PLANO[idPlano];
  if (!base) throw new RangeError(`plano sem tradução para recursos: ${meta.plano}`);

  const familia = idPlano.split('-')[0];
  const declarados = bp.recursos || {};
  const seg = bp.seguranca || {};

  const plano = {
    formato: 'lumora.plano/v1',
    tenant: {
      id: meta.tenant_id,
      nome: meta.nome,
      moeda: meta.moeda || 'BRL',
      idioma: meta.idioma || 'pt-BR',
      comunidade: meta.comunidade === true,          // §16, opt-in
    },
    plano: {
      id: idPlano,
      sistema: PLANOS[idPlano]?.sistema || null,
      nome: PLANOS[idPlano]?.nome || null,
      sistemas: SISTEMAS_DO_PLANO[familia] || [familia],
    },
    stack: {
      destino,
      ambiente: AMBIENTE_POR_DESTINO[destino] || 'desconhecido',
      regiao: stack.regiao || (destino === 'aws' ? REGIAO_DE_PRODUCAO : null),
      tamanho: deslocarTamanho(base.tamanho, stack.tamanho),
    },
    recursos: {
      app_replicas: declarados.app_replicas ?? base.app_replicas,
      workers_assistente: declarados.workers_assistente ?? base.workers,
      storage_gb: declarados.storage_gb ?? base.storage_gb,
      postgres: {
        storage_gb: declarados.postgres?.storage_gb ?? base.postgres_gb,
        // Tier declarado no Blueprint vence: §47 manda deixar editável.
        tier: declarados.postgres?.tier || null,
      },
      redis: { tier: declarados.redis?.tier || null },
    },
    limites: {},
    derivado: { schemas_logicos: 1 },                // o tenant já nasce com um
    seguranca: {
      // §37/§50.1: nasce ligada. Ausente significa ligada, nunca desligada.
      mfa: seg.mfa !== false,
      criptografia_repouso: seg.criptografia_repouso !== false,
      backup_imutavel: seg.backup_imutavel !== false,
      logs_auditoria: seg.logs_auditoria || 'append-only',
      retencao_diaria_dias: BACKUP.diarioRetencaoDias,
      retencao_semanal_dias: BACKUP.semanalRetencaoDias,
      rpo_horas: BACKUP.rpoHoras,
      rto_horas: BACKUP.rtoHoras,
      retencao_antes_de_apagar_dias: RETENCAO_ANTES_DE_APAGAR_DIAS,
      rotacao_dias: { ...ROTACAO_DIAS },
    },
    provedores: {},
    segredos: [],
  };

  // Add-ons (§47/§50.3). Ordem alfabética para que o resultado não dependa da
  // ordem em que as chaves foram escritas no YAML — idempotência (§50.3).
  const addons = meta.addons || {};
  plano.addons = {};
  for (const chave of Object.keys(addons).sort()) {
    const q = addons[chave];
    if (!Number.isInteger(q) || q < 1) continue;
    plano.addons[chave] = q;
    const efeito = EFEITO_DO_ADDON[chave];
    if (efeito) somar(plano, efeito.alvo, efeito.por_unidade * q);
  }

  // Provedores e os segredos que cada um exige. §50.3: o Blueprint referencia
  // segredos POR NOME (`secret: payments/asaas`), nunca por valor — então o
  // que o compilador emite é sempre um nome, e o valor mora no Vault/KMS.
  const prov = bp.provedores || {};
  for (const familiaProv of Object.keys(prov).sort()) {
    const escolha = prov[familiaProv];
    plano.provedores[familiaProv] = escolha;
    if (escolha === 'pendente' || escolha == null) continue;   // §25: não ativa
    const nomes = Array.isArray(escolha) ? escolha : [escolha];
    for (const n of nomes) plano.segredos.push(`${familiaProv}/${n}`);
  }
  // O banco tem credencial própria, com rotação de 30 dias (decisão 2).
  plano.segredos.push(`banco/${plano.tenant.id}`);
  plano.segredos.sort();

  return plano;
}

/** Nome-base dos recursos na nuvem. Curto, estável e sem dado pessoal. */
export function prefixo(plano) {
  return `lumora-${plano.tenant.id}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}
