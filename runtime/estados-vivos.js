/* ==========================================================================
   Lumora — ESTADOS VAZIOS E DE ERRO COM IDENTIDADE (§72.1 item 1, APROVADO
   pelo Fundador em 02/09/2026: "eu apoio essas seis candidatas, pode colocar
   todas" — status registrado como "código na rodada a agendar")

   "nada aqui ainda…", "rota perdida" no vocabulário cósmico, ZERO ASSETS.

   O catálogo de frases já existia em sotaque-cosmico.js. O que não existia era
   a superfície: a tela vazia continuava sendo um branco sem nada, e o erro,
   um parágrafo solto. Este módulo é essa superfície.

   Três regras que o módulo impõe, em vez de confiar em quem usa:

   1. §70.3 — HUMOR NUNCA EM CONTEXTO CRÍTICO. O contexto atravessa até o
      SotaqueCosmico, que troca para o catálogo neutro sozinho. Um erro fiscal
      não diz "uma nebulosa engoliu isso".
   2. §35 item 3 — A COR NUNCA É CANAL ÚNICO. Cada estado tem frase própria,
      forma própria (a cena em CSS) e `data-lum-estado` legível; na paleta
      preto/branco e na impressão, o texto sobrevive sozinho.
   3. §35/§69.5 — ERRO É `role="alert"` COM `aria-live="assertive"`; vazio é
      `role="status"` e polite. Estado que só existe como pixel não é estado.

   Zero asset: a cena é CSS (estados-vivos.css), não imagem e não canvas.
   §36 pede leveza, e uma tela vazia é o pior lugar do sistema para gastar
   GPU — ela costuma aparecer justamente quando algo já não foi bem.
   ========================================================================== */

'use strict';

import { SotaqueCosmico } from './sotaque-cosmico.js';

/** As chaves do catálogo que descrevem estado de tela (§72.1 item 1). */
export const ESTADOS = ['vazio', 'erro', 'semResultado', 'semConexao', 'rotaPerdida', 'carregando'];

/** Estados em que o anúncio é assertivo — algo falhou, não é só ausência. */
const ASSERTIVOS = new Set(['erro', 'semConexao']);

const sotaquePadrao = new SotaqueCosmico();

/**
 * Desenha um estado vivo dentro de um elemento.
 *
 * @param {HTMLElement} alvo        container; o conteúdo anterior é trocado
 * @param {object} opcoes
 * @param {string} opcoes.estado    uma de ESTADOS
 * @param {string} [opcoes.contexto='geral']   §70.3: crítico cai para neutro
 * @param {string} [opcoes.detalhe]  linha neutra e objetiva, opcional
 * @param {{rotulo: string, aoAcionar: Function}} [opcoes.acao]
 * @param {SotaqueCosmico} [opcoes.sotaque]
 * @returns {HTMLElement} o elemento do estado
 */
export function estadoVivo(alvo, opcoes = {}) {
  if (!alvo || typeof alvo.replaceChildren !== 'function') {
    throw new TypeError('estadoVivo precisa de um elemento');
  }
  const estado = ESTADOS.includes(opcoes.estado) ? opcoes.estado : 'vazio';
  const contexto = opcoes.contexto || 'geral';
  const sotaque = opcoes.sotaque || sotaquePadrao;
  const assertivo = ASSERTIVOS.has(estado);

  const el = document.createElement('div');
  el.className = 'lum-estado-vivo';
  el.dataset.lumEstado = estado;
  el.setAttribute('role', assertivo ? 'alert' : 'status');
  el.setAttribute('aria-live', assertivo ? 'assertive' : 'polite');

  const cena = document.createElement('span');
  cena.className = 'lum-estado-cena';
  cena.setAttribute('aria-hidden', 'true');    // decoração nunca é informação

  const frase = document.createElement('p');
  frase.className = 'lum-estado-frase';
  frase.textContent = sotaque.frase(estado, contexto);

  el.append(cena, frase);

  if (opcoes.detalhe) {
    const d = document.createElement('p');
    d.className = 'lum-estado-detalhe';
    d.textContent = opcoes.detalhe;
    el.append(d);
  }

  if (opcoes.acao && typeof opcoes.acao.aoAcionar === 'function') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lum-botao lum-estado-acao';
    b.textContent = opcoes.acao.rotulo || 'Tentar de novo';
    b.addEventListener('click', () => opcoes.acao.aoAcionar(estado));
    el.append(b);
  }

  alvo.replaceChildren(el);
  return el;
}

/**
 * Aplica os estados declarados no HTML, do mesmo jeito que
 * `SotaqueCosmico.aplicar()` faz com os microtextos:
 *
 *   <div data-lum-estado-vivo="vazio"></div>
 *   <div data-lum-estado-vivo="erro" data-lum-contexto="fiscal"></div>
 *
 * @returns {number} quantos foram aplicados
 */
export function aplicarEstados(raiz = document, sotaque = sotaquePadrao) {
  const alvos = raiz.querySelectorAll('[data-lum-estado-vivo]');
  for (const alvo of alvos) {
    estadoVivo(alvo, {
      estado: alvo.dataset.lumEstadoVivo,
      contexto: alvo.dataset.lumContexto || 'geral',
      detalhe: alvo.dataset.lumDetalhe || '',
      sotaque,
    });
  }
  return alvos.length;
}

/**
 * "rota perdida" (§72.1 item 1) — a tela que não existe mais.
 * Separada porque é a única que tem uma ação óbvia e sempre a mesma: voltar
 * para onde dá pé. Quem integra decide para onde, e o Fio de Ariadne (§68.3)
 * costuma saber.
 */
export function rotaPerdida(alvo, aoVoltar, opcoes = {}) {
  return estadoVivo(alvo, {
    ...opcoes,
    estado: 'rotaPerdida',
    acao: typeof aoVoltar === 'function'
      ? { rotulo: opcoes.rotulo || 'Voltar para o começo', aoAcionar: aoVoltar }
      : undefined,
  });
}
