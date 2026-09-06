/* ==========================================================================
   blueprint/validador.mjs — passo 1 da §50.5
   "Especificação e parser do formato v1 + validador de schema (com exemplos
    de teste)."

   Todo achado carrega a seção do Guia que o sustenta. Erro reprova; aviso não
   reprova — a divisão segue uma regra só: **o Guia decide, o Hub edita.**
   O que o Guia fixa (apiVersion, destinos, segurança ligada, segredo fora do
   YAML) é erro. O que a §46/§47 mandam manter editável no Hub "sem novo
   deploy" (catálogo de add-ons, tabela de provedores) é aviso — reprovar ali
   transformaria edição de catálogo em release de código.
   ========================================================================== */

'use strict';

import { analisar, ErroDeSintaxe } from './yaml.mjs';
import {
  API_VERSION, PLANOS, NAO_E_PRODUTO, DESTINOS, DESTINOS_SEM_REGIAO, TAMANHOS,
  ADDONS, PROVEDORES, PENDENTE, SEGURANCA_OBRIGATORIA, LOGS_AUDITORIA,
  CHAVES_DE_SEGREDO, VALOR_PARECE_SEGREDO, REFERENCIA_DE_SEGREDO, BLOCOS, CAMPOS,
} from './esquema.mjs';

const tipoDe = (v) => {
  if (v === null) return 'nulo';
  if (Array.isArray(v)) return 'lista';
  if (typeof v === 'object') return 'mapa';
  if (typeof v === 'boolean') return 'booleano';
  if (typeof v === 'number') return Number.isInteger(v) ? 'inteiro' : 'numero';
  return 'string';
};

const pegar = (raiz, caminho) =>
  caminho.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), raiz);

class Relatorio {
  constructor(linhas) { this.linhas = linhas; this.erros = []; this.avisos = []; }
  _add(lista, codigo, caminho, mensagem, secao) {
    lista.push({ codigo, caminho, linha: this.linhas.get(caminho) ?? null, mensagem, secao });
  }
  erro(codigo, caminho, mensagem, secao) { this._add(this.erros, codigo, caminho, mensagem, secao); }
  aviso(codigo, caminho, mensagem, secao) { this._add(this.avisos, codigo, caminho, mensagem, secao); }
}

/* ---------------------------------------------------------------- tipos -- */

function conferirCampo(rel, raiz, caminho, regra) {
  const v = pegar(raiz, caminho);
  if (v === undefined || v === null) {
    if (regra.obrigatorio) {
      rel.erro('campo-obrigatorio', caminho, `"${caminho}" é obrigatório`, '§50.1');
    }
    return;
  }
  const t = tipoDe(v);
  const esperado = regra.tipo;
  const compativel = esperado === t || (esperado === 'inteiro' && t === 'inteiro');
  if (!compativel) {
    rel.erro('tipo', caminho, `"${caminho}" deveria ser ${esperado} e é ${t}`, '§50.1');
    return;
  }
  if (regra.formato && !regra.formato.test(String(v))) {
    rel.erro('formato', caminho, `"${caminho}" não está no formato esperado (${regra.formato.source})`, '§50.1');
  }
  if (regra.minimo !== undefined && v < regra.minimo) {
    rel.erro('faixa', caminho, `"${caminho}" precisa ser ≥ ${regra.minimo}`, '§50.3');
  }
}

/* ------------------------------------------------------------- segredos -- */

/** §50.3 — nenhum segredo por valor; só `secret: familia/nome`. */
function caçarSegredos(rel, valor, caminho) {
  if (valor === null || valor === undefined) return;
  if (Array.isArray(valor)) {
    valor.forEach((v, i) => caçarSegredos(rel, v, `${caminho}.${i}`));
    return;
  }
  if (typeof valor === 'object') {
    for (const k of Object.keys(valor)) caçarSegredos(rel, valor[k], caminho ? `${caminho}.${k}` : k);
    return;
  }
  if (typeof valor !== 'string') return;

  const folha = caminho.split('.').pop();
  const s = valor.trim();
  if (REFERENCIA_DE_SEGREDO.test(s)) return;                 // a forma permitida

  if (CHAVES_DE_SEGREDO.test(folha) && s !== '' && s !== PENDENTE) {
    rel.erro('segredo-no-yaml', caminho,
      `"${caminho}" carrega um segredo por valor. Use a referência por nome: secret: familia/nome`,
      '§50.3/§37');
    return;
  }
  for (const [re, oque] of VALOR_PARECE_SEGREDO) {
    if (re.test(s)) {
      rel.erro('segredo-no-yaml', caminho,
        `"${caminho}" parece conter ${oque} em texto. Segredos vivem no Vault/KMS e entram por referência: secret: familia/nome`,
        '§50.3/§37');
      return;
    }
  }
}

/* ------------------------------------------------------------ validação -- */

/**
 * @param {string} texto  conteúdo do arquivo .yaml
 * @returns {{ok: boolean, erros: object[], avisos: object[]}}
 */
export function validar(texto) {
  let arvore;
  try {
    arvore = analisar(texto);
  } catch (e) {
    if (e instanceof ErroDeSintaxe) {
      return { ok: false, avisos: [], erros: [{ codigo: 'sintaxe', caminho: '', linha: e.linha, mensagem: e.message.replace(/^linha \d+: /, ''), secao: '§50.1' }] };
    }
    throw e;
  }

  const bp = arvore.valor;
  const rel = new Relatorio(arvore.linhas);

  if (tipoDe(bp) !== 'mapa') {
    rel.erro('raiz', '', 'a raiz do Blueprint precisa ser um mapa de blocos', '§50.1');
    return { ok: false, erros: rel.erros, avisos: rel.avisos };
  }

  /* -- blocos de primeiro nível ------------------------------------------ */
  for (const [nome, regra] of Object.entries(BLOCOS)) {
    const v = bp[nome];
    if (v === undefined) {
      if (regra.obrigatorio) rel.erro('bloco-obrigatorio', nome, `bloco "${nome}" é obrigatório`, '§50.1');
      else if (regra.derivavel) rel.aviso('bloco-derivado', nome, `"${nome}" ausente — o compilador deriva de: ${regra.derivavel}`, '§50.3');
      continue;
    }
    if (regra.tipo !== tipoDe(v)) {
      rel.erro('tipo', nome, `bloco "${nome}" deveria ser ${regra.tipo} e é ${tipoDe(v)}`, '§50.1');
    }
  }
  for (const nome of Object.keys(bp)) {
    if (!(nome in BLOCOS)) {
      rel.erro('bloco-desconhecido', nome,
        `"${nome}" não é bloco do ${API_VERSION}. Blocos: ${Object.keys(BLOCOS).join(', ')}`, '§50.1');
    }
  }

  /* -- apiVersion --------------------------------------------------------- */
  if (bp.apiVersion !== undefined && bp.apiVersion !== API_VERSION) {
    rel.erro('api-version', 'apiVersion',
      `apiVersion precisa ser exatamente "${API_VERSION}" (recebido: ${JSON.stringify(bp.apiVersion)})`, '§50.1');
  }

  /* -- campos ------------------------------------------------------------- */
  for (const [caminho, regra] of Object.entries(CAMPOS)) {
    const bloco = caminho.split('.')[0];
    if (bp[bloco] === undefined && !regra.obrigatorio) continue;
    if (bp[bloco] === undefined && regra.obrigatorio) continue;  // já reportado como bloco
    conferirCampo(rel, bp, caminho, regra);
  }

  /* -- plano (§27) e o Hub que não é produto (§17/§34) -------------------- */
  const plano = pegar(bp, 'metadata.plano');
  if (typeof plano === 'string') {
    const chave = plano.trim().toLowerCase();
    if (NAO_E_PRODUTO.includes(chave) || chave.startsWith('hub')) {
      rel.erro('hub-nao-e-produto', 'metadata.plano',
        'o Lumora Hub é interno da equipe e nunca é plano vendido — não existe Blueprint de cliente para ele',
        '§17/§34');
    } else if (!(chave in PLANOS)) {
      rel.erro('plano-desconhecido', 'metadata.plano',
        `plano "${plano}" não está na matriz da §27. Planos: ${Object.keys(PLANOS).join(', ')}`, '§27');
    }
  }

  /* -- add-ons (§47) ------------------------------------------------------ */
  const addons = pegar(bp, 'metadata.addons');
  if (addons !== undefined && addons !== null) {
    if (tipoDe(addons) !== 'mapa') {
      rel.erro('tipo', 'metadata.addons', 'addons é um mapa add-on → quantidade', '§47');
    } else {
      for (const [k, q] of Object.entries(addons)) {
        const c = `metadata.addons.${k}`;
        if (tipoDe(q) !== 'inteiro' || q < 1) {
          rel.erro('addon-quantidade', c, `"${k}" precisa ser inteiro ≥ 1 — add-on é modelo por quantidade`, '§47');
        }
        if (!ADDONS.includes(k)) {
          rel.aviso('addon-fora-do-catalogo', c,
            `"${k}" não está no catálogo de referência da §47 — confirme que existe no catálogo vivo do Hub`, '§47');
        }
      }
    }
  }

  /* -- comunidade é opt-in (§16) ------------------------------------------ */
  if (pegar(bp, 'metadata.comunidade') === undefined && bp.metadata !== undefined) {
    rel.aviso('comunidade-omitida', 'metadata',
      'comunidade ausente — vale false: a Comunidade é opt-in e nunca liga sozinha', '§16');
  }

  /* -- destino e região (§50.2) ------------------------------------------- */
  const destino = pegar(bp, 'stack.destino');
  if (typeof destino === 'string') {
    const d = destino.trim().toLowerCase();
    if (!(d in DESTINOS)) {
      rel.erro('destino-desconhecido', 'stack.destino',
        `destino "${destino}" não é da v1. Destinos: ${Object.keys(DESTINOS).join(', ')}`, '§50.2');
    } else {
      if (d === 'gcp') {
        rel.aviso('destino-fase-2', 'stack.destino',
          'GCP é Fase 2 do compilador, depois de AWS e Render', '§50.2/§50.5');
      }
      const regiao = pegar(bp, 'stack.regiao');
      if (DESTINOS_SEM_REGIAO.includes(d)) {
        if (regiao) {
          rel.erro('regiao-em-self-host', 'stack.regiao',
            `destino "${d}" roda no servidor do cliente e não tem região de nuvem`, '§50.2');
        }
      } else if (!regiao) {
        rel.erro('regiao-obrigatoria', 'stack',
          `destino "${d}" exige stack.regiao`, '§50.2');
      }
    }
  }
  const tamanho = pegar(bp, 'stack.tamanho');
  if (tamanho !== undefined && tamanho !== null && !TAMANHOS.includes(String(tamanho))) {
    rel.aviso('tamanho-fora-da-escala', 'stack.tamanho',
      `"${tamanho}" fora da escala usual (${TAMANHOS.join(', ')}); o tamanho é traduzido do plano + add-ons`, '§50.1');
  }

  /* -- provedores (§46) --------------------------------------------------- */
  const prov = bp.provedores;
  if (prov && tipoDe(prov) === 'mapa') {
    for (const [familia, escolha] of Object.entries(prov)) {
      const c = `provedores.${familia}`;
      if (!PROVEDORES.includes(familia)) {
        rel.aviso('provedor-fora-da-tabela', c,
          `família "${familia}" não está entre as nomeadas na §50.1 — confirme na tabela viva do Hub`, '§46');
      }
      if (familia === 'open-finance' && escolha === PENDENTE) {
        rel.aviso('open-finance-pendente', c,
          'Open Finance só ativa após credenciais mTLS/ICP-Brasil; o Blueprint não as substitui', '§25/§50.4');
      }
      if (familia === 'fiscal') {
        if (tipoDe(escolha) !== 'lista') {
          rel.erro('tipo', c, 'fiscal é uma lista de autorizadores conforme a UF do CNPJ do tenant', '§50.1');
        } else {
          rel.aviso('sefaz-nao-substituida', c,
            'o Blueprint não substitui a homologação SEFAZ; quando ela existir, passa a ser incluída automaticamente', '§22/§50.4');
        }
      }
    }
  }

  /* -- segurança nasce ligada (§37) --------------------------------------- */
  const seg = bp.seguranca;
  if (seg && tipoDe(seg) === 'mapa') {
    for (const [k, exigido] of Object.entries(SEGURANCA_OBRIGATORIA)) {
      if (k in seg && seg[k] !== exigido) {
        rel.erro('seguranca-desligada', `seguranca.${k}`,
          `"${k}" nasce ligada e não é opcional — não existe Blueprint válido com ela desligada`, '§37/§50.1');
      }
    }
    if ('logs_auditoria' in seg && seg.logs_auditoria !== LOGS_AUDITORIA) {
      rel.erro('auditoria-mutavel', 'seguranca.logs_auditoria',
        `logs de auditoria são "${LOGS_AUDITORIA}" — toda execução grava e nada reescreve`, '§37/§50.3');
    }
    for (const k of Object.keys(seg)) {
      if (!(k in SEGURANCA_OBRIGATORIA) && k !== 'logs_auditoria') {
        rel.aviso('seguranca-desconhecida', `seguranca.${k}`,
          `"${k}" não é chave de segurança do formato v1`, '§37');
      }
    }
  }

  /* -- segredos, em qualquer lugar da árvore (§50.3) ---------------------- */
  caçarSegredos(rel, bp, '');

  return { ok: rel.erros.length === 0, erros: rel.erros, avisos: rel.avisos };
}

/** Texto de relatório para terminal. */
export function formatar(resultado, arquivo = '') {
  const linhas = [];
  const marca = (a) => (a.linha ? `${arquivo}:${a.linha}` : arquivo || '-');
  for (const e of resultado.erros) {
    linhas.push(`ERRO   ${marca(e)}  [${e.codigo}] ${e.mensagem}  (${e.secao})`);
  }
  for (const a of resultado.avisos) {
    linhas.push(`aviso  ${marca(a)}  [${a.codigo}] ${a.mensagem}  (${a.secao})`);
  }
  linhas.push(resultado.ok
    ? `OK     ${arquivo || 'blueprint'} — ${resultado.avisos.length} aviso(s)`
    : `FALHOU ${arquivo || 'blueprint'} — ${resultado.erros.length} erro(s), ${resultado.avisos.length} aviso(s)`);
  return linhas.join('\n');
}
