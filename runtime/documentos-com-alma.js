/* ==========================================================================
   Lumora — Fase 3A, passo 5: 📜 DOCUMENTOS COM ALMA (constelação do rodapé)
   §70.5 / §71.5.

   §70.5: "no rodapé, uma constelação gerada pelos dados do próprio documento".

   Duas exigências que mandam no algoritmo:

   - A constelação é DERIVADA dos dados, não decorativa. Mesmo documento,
     mesma constelação — sempre. Por isso o gerador é determinístico: um hash
     estável do conteúdo alimenta um PRNG, e não Math.random().

   - §71.5: "geração local e leve (sem serviço externo)". Nenhuma rede,
     nenhuma dependência: SVG montado no próprio aparelho.
   ========================================================================== */

'use strict';

/** FNV-1a de 32 bits — hash estável, sem dependência. */
function hash32(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** PRNG determinístico (mulberry32): mesma semente, mesma sequência. */
function prng(semente) {
  let a = semente >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Gera a constelação de um documento.
 *
 * @param {string|object} dados   conteúdo do documento (número da nota, valor,
 *                                data, itens...). Objeto é serializado.
 * @param {object} [opcoes]
 * @param {number} [opcoes.largura=180]
 * @param {number} [opcoes.altura=62]
 * @param {number} [opcoes.minEstrelas=5]
 * @param {number} [opcoes.maxEstrelas=11]
 * @returns {SVGSVGElement}
 */
export function constelacaoDoDocumento(dados, opcoes = {}) {
  const texto = typeof dados === 'string' ? dados : JSON.stringify(dados);
  const { largura = 180, altura = 62, minEstrelas = 5, maxEstrelas = 11 } = opcoes;

  const rnd = prng(hash32(texto));
  const n = minEstrelas + Math.floor(rnd() * (maxEstrelas - minEstrelas + 1));
  const margem = 6;

  const pontos = [];
  for (let i = 0; i < n; i++) {
    pontos.push({
      x: margem + rnd() * (largura - margem * 2),
      y: margem + rnd() * (altura - margem * 2),
      r: 0.9 + rnd() * 1.3,
    });
  }

  // Liga em cadeia pelo vizinho mais próximo — mesma regra do Céu Vivo, para
  // que a constelação do documento e a do dia tenham a mesma "letra".
  const restantes = pontos.slice(1);
  const ordem = [pontos[0]];
  let atual = pontos[0];
  while (restantes.length) {
    let melhor = 0, menor = Infinity;
    for (let i = 0; i < restantes.length; i++) {
      const d = (restantes[i].x - atual.x) ** 2 + (restantes[i].y - atual.y) ** 2;
      if (d < menor) { menor = d; melhor = i; }
    }
    atual = restantes.splice(melhor, 1)[0];
    ordem.push(atual);
  }

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'lum-doc-constelacao');
  svg.setAttribute('viewBox', `0 0 ${largura} ${altura}`);
  svg.setAttribute('role', 'img');
  // §35 item 6 e regra "alternativas textuais quando aplicável": a figura é
  // decorativa em conteúdo, mas tem nome — o leitor de tela não fica no vazio.
  svg.setAttribute('aria-label',
    `Constelação gerada a partir dos dados deste documento, com ${n} estrelas.`);

  for (let i = 1; i < ordem.length; i++) {
    const linha = document.createElementNS(SVG_NS, 'line');
    linha.setAttribute('x1', ordem[i - 1].x.toFixed(2));
    linha.setAttribute('y1', ordem[i - 1].y.toFixed(2));
    linha.setAttribute('x2', ordem[i].x.toFixed(2));
    linha.setAttribute('y2', ordem[i].y.toFixed(2));
    svg.appendChild(linha);
  }
  for (const p of ordem) {
    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', p.x.toFixed(2));
    c.setAttribute('cy', p.y.toFixed(2));
    c.setAttribute('r', p.r.toFixed(2));
    svg.appendChild(c);
  }
  return svg;
}

/**
 * Aplica a constelação a todo [data-lum-constelacao] do documento.
 * O valor do atributo é a semente; vazio usa o texto do próprio .lum-doc.
 */
export function aplicarConstelacoes(raiz = document) {
  for (const alvo of raiz.querySelectorAll('[data-lum-constelacao]')) {
    const semente = alvo.dataset.lumConstelacao ||
      alvo.closest('.lum-doc')?.textContent?.trim() || 'lumora';
    alvo.replaceChildren(constelacaoDoDocumento(semente));
  }
}

export { hash32 };
