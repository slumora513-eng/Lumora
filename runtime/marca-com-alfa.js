/* ==========================================================================
   Lumora — 🅛 MARCA COM ALFA
   Resolve a ESCALACOES.md §3 ("falta de canal alfa") sem alterar um byte
   dos arquivos oficiais.

   O PROBLEMA
   Os 13 arquivos oficiais são JPEG (apesar da extensão .png), portanto sem
   transparência. Sobre o Céu Vivo isso foi contornado com
   `mix-blend-mode: screen` (tokens.css). Sobre PAPEL BRANCO nenhum modo de
   mistura funciona — `screen` sobre branco dá branco — e por isso o
   cabeçalho do papel-mãe (§70.5/§71.5, "a L canônica em destaque") ficava
   com a área reservada e VAZIA.

   A SAÍDA — E POR QUE ELA NÃO É "DESENHAR A MARCA"
   A arte oficial é LUZ ADITIVA SOBRE PRETO. Isso não é opinião: é o que os
   arquivos medem. E achatar luz aditiva sobre preto é uma operação conhecida
   e INVERSÍVEL:

       observado  C = A·K + (1−A)·0 = A·K

   Conhecendo C e assumindo que a cor da arte satura em algum canal
   (max(K) = 255 — verdade para arte luminosa), recupera-se exatamente:

       A = max(C)/255            (a máscara)
       K = C · 255/max(C)        (a cor despremultiplicada)

   Recompor K sobre preto devolve C. Não há invenção de forma, de cor nem de
   contorno: é a MEDIÇÃO do que o arquivo já contém, o mesmo método com que
   docs/10-paleta.md extraiu a paleta. A regra 14 continua valendo — este
   módulo não desenha wordmark, símbolo ou logo; ele lê o oficial.

   O PISO DE RUÍDO É MEDIDO, NÃO CHUTADO
   JPEG deixa lixo no campo escuro. Medido nos oficiais de fundo Deep Space
   (borda de 40px dos 4 lados, arquivos 09 e 11):

       campo: p50 = 2–8   p99 = 8–10   p99.9 = 12   máximo = 12

   O teto do ruído é 12/255. PISO fica nele e TETO em 20/255, com joelho
   suave (smoothstep) para não cortar o brilho fraco da arte em degrau.
   Consequência verificada: alfa da borda = 0 EXATO, e o erro de ida-e-volta
   sobre preto puro tem máximo de 12/255 — o pior pixel é (0,0,12) → (0,0,0),
   isto é, só se perde o ruído que se queria remover. A arte fica intacta.

   OS DOIS ARQUIVOS DE FUNDO BRANCO
   01 e 02 têm campo branco EXATO (min(R,G,B) = 255, ruído zero medido), e
   pedem a chave inversa. Isso também resolve o achado nº 2 do README: sobre
   a interface escura eles renderizavam como caixa branca.

   O QUE ISTO **NÃO** RESOLVE — registrado, não escondido
   O wordmark "LUMORA" é branco. Branco é luz aditiva plena: sobre papel
   branco ele some, e nenhuma extração conserta isso, porque não é perda de
   informação — é o resultado fisicamente correto. Para wordmark sobre fundo
   claro continua faltando uma versão em tinta escura, que só o produtor
   entrega. É por isso que §70.5/§71.5 pedem "a L canônica em destaque": a L
   é cromática e sobrevive ao papel. O wordmark não.

   Custo zero (§65.5): nenhuma rede externa, nenhuma dependência. O arquivo
   lido é local e mesma origem.
   ========================================================================== */

'use strict';

/** Teto do ruído JPEG medido no campo escuro dos oficiais. */
export const PISO_RUIDO = 12 / 255;
/** Fim do joelho: acima daqui o alfa é o observado, sem atenuação. */
export const TETO_RUIDO = 20 / 255;

/** Alfa mínimo para um pixel contar como "arte" ao rotular componentes. */
const LIMIAR_COMPONENTE = 40 / 255;

/**
 * A fonte da L canônica. docs/11-l-canonica.md registra 11 como
 * "referência mais limpa da forma isolada": a L aparece sozinha, sem motivo
 * gráfico sobreposto, sobre fundo Deep Space quase puro.
 */
export const FONTE_L_CANONICA = new URL(
  '../assets/oficiais/11_lumora_elio_wordmark.png', import.meta.url).href;

/** Os dois oficiais de fundo branco — pedem chave inversa. */
const FUNDO_BRANCO = /\/(01_lumora_glass_orb|02_lumora_neon_coins)\.png$/;

function smoothstep(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/* --------------------------------------------------------------------------
   1. Extração do alfa
   -------------------------------------------------------------------------- */

/**
 * Despremultiplica um oficial achatado sobre fundo sólido, devolvendo RGBA
 * verdadeiro. Não toca no arquivo: trabalha sobre uma cópia em memória.
 *
 * @param {CanvasImageSource & {width:number,height:number}} imagem
 * @param {object} [opcoes]
 * @param {'preto'|'branco'} [opcoes.chave='preto']
 * @param {number} [opcoes.piso=PISO_RUIDO]
 * @param {number} [opcoes.teto=TETO_RUIDO]
 * @returns {{canvas: HTMLCanvasElement, dados: ImageData}}
 */
export function extrairAlfa(imagem, opcoes = {}) {
  const { chave = 'preto', piso = PISO_RUIDO, teto = TETO_RUIDO } = opcoes;
  const w = imagem.naturalWidth || imagem.width;
  const h = imagem.naturalHeight || imagem.height;
  if (!w || !h) throw new Error('marca-com-alfa: imagem sem dimensões.');

  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(imagem, 0, 0, w, h);

  const dados = ctx.getImageData(0, 0, w, h);
  const p = dados.data;
  const branco = chave === 'branco';

  // O campo é a maior parte da imagem (medido: 86–89% dos pixels nos oficiais
  // de fundo escuro). Sair cedo nele evita smoothstep e divisão em ~9 de cada
  // 10 pixels — o mesmo resultado, bem mais rápido.
  const pisoBruto = piso * 255;

  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], g = p[i + 1], b = p[i + 2];

    // alfa observado antes de qualquer atenuação
    const bruto = branco
      ? 255 - Math.min(r, Math.min(g, b))
      : Math.max(r, Math.max(g, b));

    if (bruto <= pisoBruto) { p[i] = p[i + 1] = p[i + 2] = p[i + 3] = 0; continue; }
    const aObs = bruto / 255;

    // alfa de saída: joelho suave que zera o campo sem cortar o brilho fraco
    const aSai = aObs * smoothstep(piso, teto, aObs);
    if (aSai <= 0) { p[i] = p[i + 1] = p[i + 2] = p[i + 3] = 0; continue; }

    // despremultiplica SEMPRE pelo alfa observado — atenuar aqui deslocaria a
    // cor; a atenuação é só da máscara.
    if (branco) {
      const fundo = (1 - aObs) * 255;
      p[i]     = Math.max(0, Math.min(255, Math.round((r - fundo) / aObs)));
      p[i + 1] = Math.max(0, Math.min(255, Math.round((g - fundo) / aObs)));
      p[i + 2] = Math.max(0, Math.min(255, Math.round((b - fundo) / aObs)));
    } else {
      const k = 1 / aObs;              // = 255/max(C)
      p[i]     = Math.min(255, Math.round(r * k));
      p[i + 1] = Math.min(255, Math.round(g * k));
      p[i + 2] = Math.min(255, Math.round(b * k));
    }
    p[i + 3] = Math.round(aSai * 255);
  }

  ctx.putImageData(dados, 0, 0);
  return { canvas: cv, dados };
}

/* --------------------------------------------------------------------------
   2. Componentes conexos — a regra de recorte é COMPUTADA
   -------------------------------------------------------------------------- */

/**
 * Rotula componentes conexos (vizinhança-4) de pixels com alfa ≥ limiar.
 * Iterativo, com pilha em Int32Array: 1024×1024 sem estourar chamada.
 *
 * @returns {Array<{area:number, x0:number, y0:number, x1:number, y1:number}>}
 *          ordenado por área, do maior para o menor.
 */
export function componentes(dados, limiar = LIMIAR_COMPONENTE) {
  const { width: w, height: h, data: p } = dados;
  const corte = limiar * 255;
  const visto = new Uint8Array(w * h);
  const pilha = new Int32Array(w * h);
  const achados = [];

  for (let s = 0; s < w * h; s++) {
    if (visto[s] || p[s * 4 + 3] < corte) continue;
    let topo = 0;
    pilha[topo++] = s;
    visto[s] = 1;
    let area = 0;
    let x0 = s % w, x1 = x0, y0 = (s / w) | 0, y1 = y0;

    while (topo > 0) {
      const i = pilha[--topo];
      const x = i % w, y = (i / w) | 0;
      area++;
      if (x < x0) x0 = x; else if (x > x1) x1 = x;
      if (y < y0) y0 = y; else if (y > y1) y1 = y;

      if (x > 0)     { const j = i - 1; if (!visto[j] && p[j * 4 + 3] >= corte) { visto[j] = 1; pilha[topo++] = j; } }
      if (x < w - 1) { const j = i + 1; if (!visto[j] && p[j * 4 + 3] >= corte) { visto[j] = 1; pilha[topo++] = j; } }
      if (y > 0)     { const j = i - w; if (!visto[j] && p[j * 4 + 3] >= corte) { visto[j] = 1; pilha[topo++] = j; } }
      if (y < h - 1) { const j = i + w; if (!visto[j] && p[j * 4 + 3] >= corte) { visto[j] = 1; pilha[topo++] = j; } }
    }
    achados.push({ area, x0, y0, x1, y1 });
  }
  achados.sort((a, b) => b.area - a.area);
  return achados;
}

/**
 * A caixa da marca, por regra computada — nenhuma coordenada escrita à mão.
 *
 *   1. o MAIOR componente conexo é a marca-base (a L);
 *   2. somam-se os componentes cuja caixa esteja INTEIRAMENTE CONTIDA na
 *      dela — é assim que a bolha-ponto entra, sendo ela um elemento solto
 *      que docs/11-l-canonica.md descreve como opcional da L;
 *   3. o wordmark fica de fora porque está abaixo, nunca contido.
 *
 * Medido em 11: L = 48 494 px em (369,198)-(655,562); bolha = 10 862 px em
 * (519,241)-(635,358), contida. Letras do wordmark começam em y = 619.
 * Em 09 a mesma regra devolve a L com os anéis orbitais, que ali fazem parte
 * do símbolo — o comportamento generaliza sem exceção escrita.
 */
export function caixaDaMarca(lista) {
  if (!lista.length) return null;
  const base = lista[0];
  let { x0, y0, x1, y1 } = base;
  for (let i = 1; i < lista.length; i++) {
    const c = lista[i];
    if (c.x0 >= base.x0 && c.x1 <= base.x1 && c.y0 >= base.y0 && c.y1 <= base.y1) {
      if (c.x0 < x0) x0 = c.x0;
      if (c.y0 < y0) y0 = c.y0;
      if (c.x1 > x1) x1 = c.x1;
      if (c.y1 > y1) y1 = c.y1;
    }
  }
  return { x0, y0, x1, y1 };
}

/** Recorta um pedaço do canvas, com margem opcional em fração do lado maior. */
export function recortar(canvas, caixa, margem = 0.04) {
  const lw = caixa.x1 - caixa.x0 + 1;
  const lh = caixa.y1 - caixa.y0 + 1;
  const m = Math.round(Math.max(lw, lh) * margem);
  const x = Math.max(0, caixa.x0 - m);
  const y = Math.max(0, caixa.y0 - m);
  const w = Math.min(canvas.width - x, lw + m * 2);
  const h = Math.min(canvas.height - y, lh + m * 2);

  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  cv.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, w, h);
  return cv;
}

/* --------------------------------------------------------------------------
   3. Uso pronto
   -------------------------------------------------------------------------- */

function carregarImagem(url) {
  return new Promise((ok, falha) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => ok(img);
    img.onerror = () => falha(new Error(`marca-com-alfa: não carregou ${url}`));
    img.src = url;
  });
}

/** Cache por URL: a extração roda uma vez por documento, não por uso. */
const cache = new Map();

/**
 * Devolve a marca oficial recortada e com alfa verdadeiro, pronta para
 * compor sobre QUALQUER fundo — Céu Vivo, aurora acesa ou papel branco.
 *
 * @param {object} [opcoes]
 * @param {string} [opcoes.url=FONTE_L_CANONICA]
 * @param {boolean} [opcoes.recortarMarca=true]  false devolve a arte inteira
 * @returns {Promise<HTMLCanvasElement>}
 */
export function marcaComAlfa(opcoes = {}) {
  const { url = FONTE_L_CANONICA, recortarMarca = true } = opcoes;
  const chave = `${url}|${recortarMarca}`;
  if (cache.has(chave)) return cache.get(chave);

  const tarefa = carregarImagem(url).then((img) => {
    const { canvas, dados } = extrairAlfa(img, {
      chave: FUNDO_BRANCO.test(url) ? 'branco' : 'preto',
    });
    if (!recortarMarca) return canvas;
    const caixa = caixaDaMarca(componentes(dados));
    return caixa ? recortar(canvas, caixa) : canvas;
  });

  cache.set(chave, tarefa);
  return tarefa;
}

/**
 * Preenche todo [data-lum-marca] da raiz com a marca extraída.
 *
 * O valor do atributo é a URL do oficial; vazio usa a L canônica.
 * Em falha NADA é desenhado: a área continua reservada e vazia, como estava
 * antes desta feature. Inventar um substituto é que seria proibido (regra 14).
 *
 * @returns {Promise<number>} quantas marcas foram preenchidas
 */
export async function aplicarMarcas(raiz = document) {
  const alvos = [...raiz.querySelectorAll('[data-lum-marca]')];
  let feitas = 0;

  await Promise.all(alvos.map(async (alvo) => {
    if (alvo.dataset.lumMarcaEstado === 'pronta') { feitas++; return; }
    try {
      const cv = await marcaComAlfa({ url: alvo.dataset.lumMarca || undefined });
      // Bitmap com alfa: <img> imprime melhor que <canvas> e sobrevive à
      // serialização para PDF, onde canvas às vezes sai em branco.
      const img = new Image();
      img.src = cv.toDataURL('image/png');
      img.alt = alvo.dataset.lumMarcaAlt || 'Lumora';
      img.className = 'lum-marca-arte';
      alvo.replaceChildren(img);
      alvo.dataset.lumMarcaEstado = 'pronta';
      feitas++;
    } catch (erro) {
      // Silencioso e visível ao mesmo tempo: o estado fica no DOM para quem
      // for depurar, e a área permanece vazia — nunca um substituto.
      alvo.dataset.lumMarcaEstado = 'indisponivel';
    }
  }));

  return feitas;
}
