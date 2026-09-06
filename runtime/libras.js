/* ==========================================================================
   Lumora — LIBRAS: datilologia animada (§60.3, aprovada em 01/09/2026) e a
   janela de Libras da notificação crítica (§72.1 item 5, aprovada em
   02/09/2026)

   §60.3, verbatim: "a bolha do Elio se transforma em uma mãozinha que sinaliza
   as letras em Libras, formando as palavras em tempo real; velocidade de troca
   de letras ajustável pelo usuário."

   ONDE ESTE MÓDULO PARA, E POR QUÊ

   O próprio Guia põe o limite, e ele não é modéstia: §60.3 encerra com
   "Libras é língua com gramática própria; validação com a comunidade surda".
   Duas consequências práticas:

   1. DATILOLOGIA NÃO É LIBRAS. Soletrar letra a letra é o alfabeto manual —
      recurso de apoio, usado para nomes próprios e siglas. Foi exatamente
      isso que a §60.3 aprovou, e é só isso que este módulo sequencia. Chamar
      datilologia de "tradução em Libras" seria falso.
   2. AS CONFIGURAÇÕES DE MÃO NÃO SÃO DESENHADAS AQUI. Elas são conteúdo de
      língua, precisam de validação com a comunidade surda (§35/§60.3), e §48
      proíbe a plataforma de gerar imagem ou vídeo. Uma mão errada não é
      "acessibilidade parcial": é ruído apresentado como acessibilidade, e o
      dano cai justamente sobre quem a função existe para atender.

   ENTÃO O QUE ESTE MÓDULO É: o motor. Ele sabe QUAL letra mostrar, QUANDO
   mostrar, em que velocidade (ajustável, como a §60.3 exige), como tratar
   letra repetida, o que fazer com o que não se soletra, e como manter o canal
   de texto vivo em paralelo. As 27 configurações do alfabeto manual entram
   por `registrarAlfabeto()` — mesma arquitetura de slot da §49 e da
   `marca-com-alfa.js`: sem fonte registrada, NADA é desenhado.
   ========================================================================== */

'use strict';

/** As 27 configurações do alfabeto manual usadas no Brasil. */
export const ALFABETO_LIBRAS = [
  'A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

/* (AGENTE — a §60.3 diz "velocidade ajustável" e não fixa a escala.)
   600 ms por letra é a leitura confortável de referência; a faixa vai de
   metade a três vezes essa velocidade. */
export const MS_POR_LETRA = 600;
export const VELOCIDADE_MIN = 0.5;
export const VELOCIDADE_MAX = 3;

/** Registro global das configurações de mão. Nasce vazio, e é assim mesmo. */
const alfabetoRegistrado = new Map();

/**
 * Registra as configurações do alfabeto manual.
 * @param {Record<string, Node|((letra: string) => Node)>} mapa letra → visual
 * @returns {number} quantas das 27 estão cobertas
 */
export function registrarAlfabeto(mapa) {
  for (const [letra, fonte] of Object.entries(mapa || {})) {
    const L = letra.toUpperCase();
    if (!ALFABETO_LIBRAS.includes(L)) continue;   // fora do alfabeto: ignora
    if (fonte == null) alfabetoRegistrado.delete(L);
    else alfabetoRegistrado.set(L, fonte);
  }
  return alfabetoRegistrado.size;
}

/** Quantas das 27 configurações estão disponíveis. 0 = nada é desenhado. */
export function cobertura() { return alfabetoRegistrado.size; }

export function limparAlfabeto() { alfabetoRegistrado.clear(); }

/**
 * Reduz um texto ao que o alfabeto manual soletra.
 * Acentos caem (Á → A), Ç fica, espaço vira pausa, e o que sobra é relatado
 * em vez de sumir em silêncio — quem integra precisa saber que o nome tinha
 * um "3" que ninguém soletrou.
 *
 * @returns {{letras: string[], descartado: string[]}}
 */
export function paraDatilologia(texto) {
  const letras = [];
  const descartado = [];
  for (const bruto of String(texto || '')) {
    if (/\s/.test(bruto)) { if (letras[letras.length - 1] !== ' ') letras.push(' '); continue; }
    const semAcento = bruto === 'ç' || bruto === 'Ç'
      ? 'Ç'
      : bruto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    if (ALFABETO_LIBRAS.includes(semAcento)) letras.push(semAcento);
    else if (semAcento.trim()) descartado.push(bruto);
  }
  while (letras[0] === ' ') letras.shift();
  while (letras[letras.length - 1] === ' ') letras.pop();
  return { letras, descartado };
}

export class Datilologia {
  /**
   * @param {HTMLElement} alvo
   * @param {object} [opcoes]
   * @param {number} [opcoes.velocidade=1]  §60.3, ajustável pelo usuário
   * @param {Function} [opcoes.aoTrocarLetra]
   */
  constructor(alvo, opcoes = {}) {
    if (!alvo) throw new TypeError('Datilologia precisa de um elemento');
    this.alvo = alvo;
    this.velocidade = limitar(opcoes.velocidade ?? 1);
    this.aoTrocarLetra = opcoes.aoTrocarLetra;
    this.letras = [];
    this.indice = -1;
    this.rodando = false;
    this._timer = 0;
    this.movimentoReduzido = typeof matchMedia === 'function'
      && matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.alvo.classList.add('lum-datilologia');
    this.alvo.dataset.lumLibras = alfabetoRegistrado.size ? 'presente' : 'ausente';

    // A mão, quando existir. Decoração para o leitor de tela: quem lê texto
    // não precisa da imagem da mão, precisa do texto — que está ao lado.
    this.mao = document.createElement('span');
    this.mao.className = 'lum-datilologia-mao';
    this.mao.setAttribute('aria-hidden', 'true');

    // O canal de texto, sempre presente (§68.7: nenhum canal fica sozinho).
    this.legenda = document.createElement('span');
    this.legenda.className = 'lum-datilologia-legenda';
    this.legenda.setAttribute('aria-live', 'off');   // a palavra inteira já foi anunciada

    this.alvo.replaceChildren(this.mao, this.legenda);
  }

  /** Há alfabeto registrado? Sem ele nenhuma mão é desenhada. */
  get disponivel() { return alfabetoRegistrado.size > 0; }

  /**
   * Soletra um texto.
   * @returns {{letras: number, descartado: string[]}}
   */
  soletrar(texto) {
    const { letras, descartado } = paraDatilologia(texto);
    this.parar();
    this.letras = letras;
    this.indice = -1;
    this.alvo.dataset.lumLibras = this.disponivel ? 'presente' : 'ausente';
    this.legenda.textContent = '';
    if (letras.length) { this.rodando = true; this._passo(); }
    return { letras: letras.length, descartado };
  }

  /** Avança uma letra. Público, porque também é o modo manual. */
  avancar() {
    this.indice += 1;
    if (this.indice >= this.letras.length) { this.parar(); return null; }
    const letra = this.letras[this.indice];
    this._pintar(letra);
    this.aoTrocarLetra?.(letra, this.indice, this.letras.length);
    return letra;
  }

  _passo() {
    const letra = this.avancar();
    if (letra === null || !this.rodando) return;
    // Letra repetida precisa de respiro, senão "ANNA" lê como "ANA": a mão
    // não muda de configuração e a troca some.
    const proxima = this.letras[this.indice + 1];
    const repetida = proxima === letra;
    const espera = (letra === ' ' ? 1.4 : repetida ? 1.5 : 1) * MS_POR_LETRA / this.velocidade;
    this._timer = setTimeout(() => this._passo(), espera);
  }

  _pintar(letra) {
    this.legenda.textContent = letra === ' ' ? '·' : letra;
    if (letra === ' ' || !this.disponivel) { this.mao.replaceChildren(); return; }
    const fonte = alfabetoRegistrado.get(letra);
    const visual = typeof fonte === 'function' ? fonte(letra) : fonte;
    if (visual instanceof Node) this.mao.replaceChildren(visual.cloneNode(true));
    else this.mao.replaceChildren();
  }

  /** §60.3: "velocidade de troca de letras ajustável pelo usuário". */
  definirVelocidade(v) {
    this.velocidade = limitar(v);
    try { localStorage.setItem('lum:libras-velocidade', String(this.velocidade)); }
    catch { /* modo privado */ }
    return this;
  }

  pausar() { this.rodando = false; clearTimeout(this._timer); this._timer = 0; return this; }
  continuar() { if (!this.rodando && this.indice < this.letras.length - 1) { this.rodando = true; this._passo(); } return this; }

  parar() {
    this.rodando = false;
    clearTimeout(this._timer);
    this._timer = 0;
    return this;
  }

  destruir() { this.parar(); this.alvo.replaceChildren(); }
}

/** Velocidade guardada pelo usuário, se houver. */
export function velocidadePreferida() {
  try {
    const v = Number(localStorage.getItem('lum:libras-velocidade'));
    return Number.isFinite(v) && v > 0 ? limitar(v) : 1;
  } catch { return 1; }
}

/**
 * Fonte pronta para `NotificacoesVivas.registrarLibras()` (§72.1 item 5):
 * a janela da crítica soletra o texto do alerta.
 *
 * Sem alfabeto registrado ela devolve `null`, e a janela não nasce — a
 * ausência continua auditável em `data-lum-libras="ausente"` na notificação.
 */
export function fonteDeDatilologia() {
  return (dados) => {
    if (!alfabetoRegistrado.size) return null;
    const caixa = document.createElement('div');
    const d = new Datilologia(caixa, { velocidade: velocidadePreferida() });
    d.soletrar(dados?.texto || '');
    return caixa;
  };
}

/** Prende a velocidade na faixa. Zero e lixo caem no padrão, não em zero —
 *  velocidade 0 pararia a soletração sem que ninguém tivesse pedido pausa. */
function limitar(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return n === 0 ? VELOCIDADE_MIN : 1;
  return Math.min(VELOCIDADE_MAX, Math.max(VELOCIDADE_MIN, n));
}
