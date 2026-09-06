/* ==========================================================================
   blueprint/yaml.mjs — leitor do subconjunto YAML do blueprint.lumora/v1
   §50.1: "YAML declarativo, versionado, legível por humano."

   NÃO é um parser YAML completo, e isso é decisão, não limitação de esforço:
   YAML inteiro traz âncoras, aliases, chaves de mesclagem, tags e escalares de
   bloco — recursos que deixam o mesmo arquivo produzir árvores diferentes
   conforme o leitor. A §50.3 exige idempotência total e comparação de estado
   desejado × existente; um formato que não lê igual duas vezes não sustenta
   isso. Aqui tudo que sai desse subconjunto é ERRO explícito, com linha, em vez
   de virar comportamento surpresa.

   Zero dependência, como o resto deste repositório.
   ========================================================================== */

'use strict';

export class ErroDeSintaxe extends Error {
  constructor(mensagem, linha) {
    super(`linha ${linha}: ${mensagem}`);
    this.name = 'ErroDeSintaxe';
    this.linha = linha;
  }
}

/** Recursos de YAML deliberadamente fora do subconjunto. */
const PROIBIDOS = [
  [/^---\s*$|^\.\.\.\s*$/, 'documentos múltiplos (--- / ...) não fazem parte do formato: um Blueprint por arquivo'],
  [/(?:^|:\s|-\s)&[A-Za-z0-9_-]+/, 'âncoras (&nome) não fazem parte do formato — quebram a leitura determinística exigida pela §50.3'],
  [/(?:^|:\s|-\s)\*[A-Za-z0-9_-]+/, 'aliases (*nome) não fazem parte do formato — quebram a leitura determinística exigida pela §50.3'],
  [/^\s*<<\s*:/, 'chaves de mesclagem (<<:) não fazem parte do formato'],
  [/(?:^|:\s|-\s)!!?[A-Za-z]/, 'tags (!tipo) não fazem parte do formato'],
  [/:\s*[|>][-+0-9]*\s*$/, 'escalares de bloco (| e >) não fazem parte do formato'],
];

/** Remove o comentário de uma linha, respeitando aspas. */
function semComentario(linha) {
  let aspas = null;
  for (let i = 0; i < linha.length; i += 1) {
    const c = linha[i];
    if (aspas) { if (c === aspas && linha[i - 1] !== '\\') aspas = null; continue; }
    if (c === '"' || c === "'") { aspas = c; continue; }
    if (c === '#' && (i === 0 || /\s/.test(linha[i - 1]))) return linha.slice(0, i);
  }
  return linha;
}

const NUMERO = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

/** Um escalar já sem comentário e sem espaços nas pontas. */
function escalar(bruto, linha) {
  const s = bruto.trim();
  if (s === '' || s === 'null' || s === '~') return null;
  if (s[0] === '"' || s[0] === "'") {
    const aspa = s[0];
    if (s.length < 2 || s[s.length - 1] !== aspa) throw new ErroDeSintaxe('aspas não fechadas', linha);
    return s.slice(1, -1).replace(/\\(.)/g, '$1');
  }
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (NUMERO.test(s)) return Number(s);
  if (s[0] === '[' || s[0] === '{') return fluxo(s, linha);
  return s;
}

/** Coleções em linha: [a, b]  e  { a: 1, b: "x" }. */
function fluxo(texto, linha) {
  const fim = { i: 0 };
  const v = fluxoValor(texto, fim, linha);
  if (texto.slice(fim.i).trim() !== '') throw new ErroDeSintaxe('sobrou texto depois da coleção em linha', linha);
  return v;
}

function pularEspaco(t, p) { while (p.i < t.length && /\s/.test(t[p.i])) p.i += 1; }

function fluxoValor(t, p, linha) {
  pularEspaco(t, p);
  const c = t[p.i];
  if (c === '[') return fluxoLista(t, p, linha);
  if (c === '{') return fluxoMapa(t, p, linha);
  return escalar(fluxoBruto(t, p, linha), linha);
}

/** Lê um escalar de dentro de uma coleção em linha, até , ] } ou fim. */
function fluxoBruto(t, p, linha) {
  const inicio = p.i;
  let aspas = null;
  while (p.i < t.length) {
    const c = t[p.i];
    if (aspas) { if (c === aspas && t[p.i - 1] !== '\\') aspas = null; p.i += 1; continue; }
    if (c === '"' || c === "'") { aspas = c; p.i += 1; continue; }
    if (c === ',' || c === ']' || c === '}') break;
    p.i += 1;
  }
  if (aspas) throw new ErroDeSintaxe('aspas não fechadas', linha);
  return t.slice(inicio, p.i);
}

function fluxoLista(t, p, linha) {
  p.i += 1;                       // '['
  const fora = [];
  pularEspaco(t, p);
  if (t[p.i] === ']') { p.i += 1; return fora; }
  for (;;) {
    fora.push(fluxoValor(t, p, linha));
    pularEspaco(t, p);
    if (t[p.i] === ',') { p.i += 1; continue; }
    if (t[p.i] === ']') { p.i += 1; return fora; }
    throw new ErroDeSintaxe('lista em linha sem fechamento "]"', linha);
  }
}

function fluxoMapa(t, p, linha) {
  p.i += 1;                       // '{'
  const fora = {};
  pularEspaco(t, p);
  if (t[p.i] === '}') { p.i += 1; return fora; }
  for (;;) {
    pularEspaco(t, p);
    const chave = String(escalar(fluxoChave(t, p, linha), linha) ?? '').trim();
    if (!chave) throw new ErroDeSintaxe('chave vazia em mapa em linha', linha);
    if (Object.prototype.hasOwnProperty.call(fora, chave)) {
      throw new ErroDeSintaxe(`chave repetida "${chave}"`, linha);
    }
    fora[chave] = fluxoValor(t, p, linha);
    pularEspaco(t, p);
    if (t[p.i] === ',') { p.i += 1; continue; }
    if (t[p.i] === '}') { p.i += 1; return fora; }
    throw new ErroDeSintaxe('mapa em linha sem fechamento "}"', linha);
  }
}

function fluxoChave(t, p, linha) {
  const inicio = p.i;
  while (p.i < t.length && t[p.i] !== ':' && t[p.i] !== '}' && t[p.i] !== ',') p.i += 1;
  if (t[p.i] !== ':') throw new ErroDeSintaxe('esperava ":" em mapa em linha', linha);
  const k = t.slice(inicio, p.i);
  p.i += 1;
  return k;
}

const CHAVE = /^([A-Za-z_][A-Za-z0-9_.-]*)\s*:(?:\s+(.*))?$/;

/**
 * Lê um Blueprint.
 * @param {string} texto
 * @returns {{ valor: object, linhas: Map<string, number> }}
 *          `linhas` mapeia caminho pontilhado → número da linha (1-based),
 *          para que cada erro do validador consiga apontar o lugar exato.
 */
export function analisar(texto) {
  const cruas = String(texto).split(/\r?\n/);
  const linhas = [];

  cruas.forEach((crua, idx) => {
    const n = idx + 1;
    if (/^[ ]*\t/.test(crua)) throw new ErroDeSintaxe('tabulação na indentação — o formato usa espaços', n);
    const semC = semComentario(crua);
    if (semC.trim() === '') return;
    for (const [re, msg] of PROIBIDOS) if (re.test(semC)) throw new ErroDeSintaxe(msg, n);
    const recuo = semC.length - semC.trimStart().length;
    linhas.push({ recuo, texto: semC.trim(), n });
  });

  if (!linhas.length) return { valor: {}, linhas: new Map() };
  if (linhas[0].recuo !== 0) throw new ErroDeSintaxe('o arquivo começa recuado', linhas[0].n);

  const mapaLinhas = new Map();
  const [valor, resto] = bloco(linhas, 0, linhas[0].recuo, '', mapaLinhas);
  if (resto < linhas.length) throw new ErroDeSintaxe('recuo inconsistente', linhas[resto].n);
  return { valor, linhas: mapaLinhas };
}

/** Lê um bloco inteiro no recuo dado. Devolve [valor, índice da próxima linha]. */
function bloco(linhas, i, recuo, caminho, mapa) {
  if (linhas[i].texto.startsWith('- ') || linhas[i].texto === '-') {
    return sequencia(linhas, i, recuo, caminho, mapa);
  }
  return mapeamento(linhas, i, recuo, caminho, mapa);
}

function mapeamento(linhas, i, recuo, caminho, mapa) {
  const fora = {};
  while (i < linhas.length && linhas[i].recuo === recuo) {
    const { texto, n } = linhas[i];
    if (texto.startsWith('- ') || texto === '-') {
      throw new ErroDeSintaxe('item de lista onde se esperava "chave: valor"', n);
    }
    const m = CHAVE.exec(texto);
    if (!m) throw new ErroDeSintaxe(`não é "chave: valor": ${texto}`, n);
    const [, chave, resto] = m;
    if (Object.prototype.hasOwnProperty.call(fora, chave)) {
      throw new ErroDeSintaxe(`chave repetida "${chave}" — o formato exige leitura determinística (§50.3)`, n);
    }
    const sub = caminho ? `${caminho}.${chave}` : chave;
    mapa.set(sub, n);
    i += 1;

    const proxima = linhas[i];
    const temFilho = proxima && proxima.recuo > recuo;
    // Uma lista pode vir no MESMO recuo da chave — é a forma mais comum de
    // escrever sequência em YAML à mão, e recusá-la seria recusar um arquivo
    // válido que a §50.1 promete "legível por humano".
    const listaRente = proxima && proxima.recuo === recuo
      && (proxima.texto.startsWith('- ') || proxima.texto === '-');

    if (resto !== undefined && resto.trim() !== '') {
      if (temFilho) throw new ErroDeSintaxe(`"${chave}" tem valor na mesma linha e bloco recuado abaixo`, n);
      fora[chave] = escalar(resto, n);
      registrarFilhos(fora[chave], sub, n, mapa);
    } else if (listaRente) {
      const [v, prox] = sequencia(linhas, i, recuo, sub, mapa, true);
      fora[chave] = v;
      i = prox;
    } else if (temFilho) {
      const [v, prox] = bloco(linhas, i, linhas[i].recuo, sub, mapa);
      fora[chave] = v;
      i = prox;
    } else {
      fora[chave] = null;
    }
  }
  if (i < linhas.length && linhas[i].recuo > recuo) {
    throw new ErroDeSintaxe('recuo inconsistente', linhas[i].n);
  }
  return [fora, i];
}

/**
 * @param {boolean} [rente=false]  a lista está no MESMO recuo da chave que a
 *   nomeia. Nesse caso a primeira linha que não é item encerra a lista — é a
 *   próxima chave do mapa de cima. Numa lista recuada, a mesma linha é erro.
 */
function sequencia(linhas, i, recuo, caminho, mapa, rente = false) {
  const fora = [];
  while (i < linhas.length && linhas[i].recuo === recuo) {
    const { texto, n } = linhas[i];
    if (!texto.startsWith('- ') && texto !== '-') {
      if (rente && fora.length) break;
      throw new ErroDeSintaxe('"chave: valor" onde se esperava item de lista', n);
    }
    const conteudo = texto === '-' ? '' : texto.slice(2).trim();
    const sub = `${caminho}.${fora.length}`;
    mapa.set(sub, n);
    i += 1;

    if (conteudo === '') {
      if (i < linhas.length && linhas[i].recuo > recuo) {
        const [v, prox] = bloco(linhas, i, linhas[i].recuo, sub, mapa);
        fora.push(v); i = prox;
      } else fora.push(null);
      continue;
    }
    if (CHAVE.test(conteudo)) {
      // mapa que começa na própria linha do traço
      const interno = [{ recuo: recuo + 2, texto: conteudo, n }];
      let j = i;
      while (j < linhas.length && linhas[j].recuo > recuo) { interno.push(linhas[j]); j += 1; }
      const [v] = mapeamento(interno, 0, recuo + 2, sub, mapa);
      fora.push(v); i = j;
      continue;
    }
    fora.push(escalar(conteudo, n));
    registrarFilhos(fora[fora.length - 1], sub, n, mapa);
  }
  return [fora, i];
}

/* ==========================================================================
   ESCRITA — o caminho de volta, para o compilador da §50.2 emitir
   `render.yaml` nativo.

   Determinístico por construção: a ordem das chaves é a ordem em que elas
   estão no objeto, nada é reordenado por acaso, e não existe data, hora nem
   aleatório na saída. É isso que faz "aplicar o mesmo Blueprint duas vezes"
   produzir bytes idênticos, como a §50.3 exige.

   Escreve o mesmo subconjunto que `analisar` lê — e é por isso que dá para
   conferir a ida e a volta num teste: emitir, reler e comparar as árvores.
   ========================================================================== */

const CHAVE_SIMPLES = /^[A-Za-z_][A-Za-z0-9_.-]*$/;
const PRECISA_ASPAS = /^$|^[\s]|[\s]$|^[-?:,[\]{}#&*!|>'"%@`]|[*&]|:\s|\s#|^(?:true|false|null|~)$|^-?\d+(?:\.\d+)?$/;

function escalarParaYaml(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new TypeError('número não finito não tem representação YAML');
    return String(v);
  }
  const s = String(v);
  return PRECISA_ASPAS.test(s) ? `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : s;
}

const ehFolha = (v) => v === null || v === undefined || typeof v !== 'object';

/**
 * Serializa um objeto no subconjunto que `analisar` lê.
 * @param {object} valor
 * @param {object} [opcoes]
 * @param {string[]} [opcoes.cabecalho]  linhas de comentário no topo
 * @returns {string} texto YAML terminado em nova linha
 */
export function serializar(valor, opcoes = {}) {
  const linhas = [];
  for (const c of opcoes.cabecalho || []) linhas.push(c ? `# ${c}` : '#');
  escreverMapa(valor, 0, linhas);
  return `${linhas.join('\n')}\n`;
}

function escreverMapa(obj, recuo, linhas) {
  const pad = ' '.repeat(recuo);
  for (const chave of Object.keys(obj)) {
    const v = obj[chave];
    if (v === undefined) continue;
    if (!CHAVE_SIMPLES.test(chave)) throw new TypeError(`chave fora do subconjunto: ${chave}`);
    if (Array.isArray(v)) {
      if (!v.length) { linhas.push(`${pad}${chave}: []`); continue; }
      linhas.push(`${pad}${chave}:`);
      escreverLista(v, recuo, linhas);
    } else if (!ehFolha(v)) {
      if (!Object.keys(v).length) { linhas.push(`${pad}${chave}: {}`); continue; }
      linhas.push(`${pad}${chave}:`);
      escreverMapa(v, recuo + 2, linhas);
    } else {
      linhas.push(`${pad}${chave}: ${escalarParaYaml(v)}`);
    }
  }
}

function escreverLista(lista, recuo, linhas) {
  const pad = ' '.repeat(recuo);
  for (const item of lista) {
    if (Array.isArray(item)) throw new TypeError('lista dentro de lista sai do subconjunto');
    if (!ehFolha(item)) {
      const chaves = Object.keys(item).filter((k) => item[k] !== undefined);
      if (!chaves.length) { linhas.push(`${pad}- {}`); continue; }
      // O traço carrega a primeira chave; o resto alinha embaixo dela.
      const interno = [];
      escreverMapa(item, recuo + 2, interno);
      linhas.push(`${pad}- ${interno[0].slice(recuo + 2)}`);
      for (const l of interno.slice(1)) linhas.push(l);
    } else {
      linhas.push(`${pad}- ${escalarParaYaml(item)}`);
    }
  }
}

/** Coleções em linha não têm linha própria por item — herdam a da chave. */
function registrarFilhos(valor, caminho, n, mapa) {
  if (Array.isArray(valor)) {
    valor.forEach((v, k) => { mapa.set(`${caminho}.${k}`, n); registrarFilhos(v, `${caminho}.${k}`, n, mapa); });
  } else if (valor && typeof valor === 'object') {
    for (const k of Object.keys(valor)) {
      mapa.set(`${caminho}.${k}`, n);
      registrarFilhos(valor[k], `${caminho}.${k}`, n, mapa);
    }
  }
}
