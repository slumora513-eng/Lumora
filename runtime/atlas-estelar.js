/* ==========================================================================
   Lumora — Atlas Estelar (§16)
   Nome oficial do Cosmógrafo 3D, aprovado pelo Fundador em 01/09/2026.
   Liberado pelo "pode ir" de 05/09/2026, estendido a "pode fazer tudo".

   O Guia define exatamente quatro camadas:

     galáxias (categorias) → constelações (temas) → estrelas (nichos)
                                                  → nicho individual

   com **narração da Aurora**. É a camada de identidade da Comunidade
   (§65.1) — o único sistema cuja assinatura visual ainda não existia em
   código.

   A DECISÃO ESTRUTURAL DESTE ARQUIVO
   O 3D é a pele; **o DOM é a verdade**. Cada nó visível é um <button> real,
   posicionado sobre a projeção do nó na tela. Isso não é um detalhe de
   acessibilidade pendurado no fim: navegação que só existe como pixel não
   tem foco, não tem leitor de tela, não tem teclado e não tem como ser
   testada — reprovaria a §35 inteira. Com o botão real, tudo isso vem de
   graça e o WebGL fica responsável só pelo que ele faz bem, que é a luz.

   É a mesma escolha da legenda das aberturas, pelo mesmo motivo.

   §65.5: Canvas 2D + WebGL, **sem bibliotecas**. A matemática de câmera
   abaixo existe porque importar uma gl-matrix violaria isso.
   ========================================================================== */

import { COMUM, VS } from './animacoes-3d.js';
import { hash32, prng } from './documentos-com-alma.js';

/* --------------------------------------------------------------------------
   Matemática de câmera — o mínimo, escrito à mão (§65.5: sem bibliotecas)
   -------------------------------------------------------------------------- */

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const escala = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const soma = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const ponto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1],
                        a[2] * b[0] - a[0] * b[2],
                        a[0] * b[1] - a[1] * b[0]];
function normalizar(a) {
  const n = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / n, a[1] / n, a[2] / n];
}

/** Perspectiva × visão, já multiplicadas: é a única matriz que o shader usa. */
function matrizVP(olho, alvo, cima, fovY, prop, perto, longe) {
  const f = normalizar(sub(alvo, olho));
  const d = normalizar(cruz(f, cima));
  const u = cruz(d, f);
  // visão (linha-maior transposta para coluna-maior do WebGL)
  const tx = -ponto(d, olho), ty = -ponto(u, olho), tz = ponto(f, olho);
  const cot = 1 / Math.tan(fovY / 2);
  const a = cot / prop, b = cot;
  const c = (longe + perto) / (perto - longe);
  const e = (2 * longe * perto) / (perto - longe);
  // VP = P * V, escrita direto para não alocar duas matrizes por quadro.
  // Coluna-maior: o índice é coluna*4 + linha. A quarta coluna é a da
  // translação, e é a que engana — w precisa sair valendo dot(f, p - olho),
  // isto é, a PROFUNDIDADE do ponto à frente da câmera. Com o sinal trocado
  // ali, w fica negativo, a projeção conclui que o mundo inteiro está atrás
  // da câmera, e a tela fica vazia sem nenhum erro para avisar.
  return new Float32Array([
    a * d[0], b * u[0], -c * f[0], f[0],
    a * d[1], b * u[1], -c * f[1], f[1],
    a * d[2], b * u[2], -c * f[2], f[2],
    a * tx,   b * ty,   c * tz + e,  -tz,
  ]);
}

/** Projeta um ponto do mundo para pixels de CSS. Devolve null atrás da câmera.
 *  É o que costura o 3D ao DOM: o <button> vai exatamente onde a estrela está. */
function projetar(vp, p, larg, alt) {
  const x = vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12];
  const y = vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13];
  const w = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
  if (w <= 0.0001) return null;                     // atrás da câmera
  return [(x / w * 0.5 + 0.5) * larg, (0.5 - y / w * 0.5) * alt, w];
}

/* --------------------------------------------------------------------------
   Posição determinística no céu

   A mesma categoria tem que cair SEMPRE no mesmo lugar. Sem isso a memória
   espacial de quem navega não vale nada — e memória espacial é a única razão
   de existir de um atlas em 3D em vez de uma lista.

   O gerador é o mesmo dos Documentos com Alma: hash do id → mulberry32.
   -------------------------------------------------------------------------- */

/** Distribui n pontos numa casca esférica com a espiral de Fibonacci e depois
 *  desloca cada um pelo próprio hash. A espiral evita aglomerados; o hash
 *  garante que o resultado é do id, não da ordem em que os dados chegaram. */
function posicoes(itens, raio, semente) {
  const n = Math.max(1, itens.length);
  const dourado = Math.PI * (3 - Math.sqrt(5));
  return itens.map((item, i) => {
    const rnd = prng(hash32(semente + '/' + (item.id ?? i)));
    // índice embaralhado pelo hash: a ordem do array não decide o lugar
    const y = 1 - (i + 0.5) / n * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const a = dourado * i + rnd() * 0.9;
    const jitter = 0.82 + rnd() * 0.36;
    return [Math.cos(a) * r * raio * jitter,
            y * raio * jitter * 0.62,          // achatado: céu, não bola
            Math.sin(a) * r * raio * jitter];
  });
}

/* --------------------------------------------------------------------------
   Shaders
   -------------------------------------------------------------------------- */

/* Fundo: o MESMO fundo() das aberturas (nebulosa + campo estelar em espaço
   linear), só que olhando para onde a câmera do Atlas olha. */
const FS_FUNDO = COMUM + `
uniform vec3 u_dir, u_direita, u_cima;
uniform float u_foco;
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
  vec3 rd = normalize(uv.x*u_direita + uv.y*u_cima + u_foco*u_dir);
  gl_FragColor = vec4(pow(fundo(rd), vec3(0.4545)), 1.0);
}`;

/* Nós: quads billboard. Um quad por nó, virado para a câmera no vertex
   shader — assim o número de nós não depende de limite de uniforme, que em
   GLES2 pode ser de apenas 16 vec4 no fragmento. Um "cosmógrafo" com teto de
   16 estrelas não seria um cosmógrafo. */
const VS_NOS = `
attribute vec3 a_centro;
attribute vec2 a_canto;
attribute vec3 a_dados;      // raio, destaque, camada
attribute vec3 a_cor;
uniform mat4 u_vp;
uniform vec3 u_direita, u_cima;
varying vec2 v_canto;
varying vec3 v_cor;
varying float v_dest;
void main(){
  float r = a_dados.x * (1.0 + a_dados.y*0.30);
  vec3 p = a_centro + (u_direita*a_canto.x + u_cima*a_canto.y) * r;
  v_canto = a_canto;
  v_cor = a_cor;
  v_dest = a_dados.y;
  gl_Position = u_vp * vec4(p, 1.0);
}`;

const FS_NOS = `
precision highp float;
varying vec2 v_canto;
varying vec3 v_cor;
varying float v_dest;
void main(){
  float d = length(v_canto);
  if (d > 1.0) discard;
  float halo   = smoothstep(1.0, 0.0, d);   halo *= halo;
  float nucleo = smoothstep(0.40, 0.0, d);
  vec3 c = v_cor * halo * 0.60 + mix(v_cor, vec3(1.0), 0.70) * nucleo;
  // Anel de foco: o mesmo papel do outline do :focus-visible, dentro da cena.
  // Nunca é o ÚNICO sinal — o <button> real também recebe o foco do sistema.
  c += vec3(0.50, 0.90, 1.0) * smoothstep(0.055, 0.0, abs(d - 0.88)) * v_dest * 1.30;
  gl_FragColor = vec4(c, 1.0);
}`;

/* Linhas da constelação: quad por segmento, espesso no eixo perpendicular à
   direção da câmera. gl.LINES não serve — largura maior que 1 px é ignorada
   pela maioria dos drivers. */
const VS_LINHAS = `
attribute vec3 a_a, a_b;
attribute vec2 a_lado;       // t ao longo do segmento, lado -1/+1
uniform mat4 u_vp;
uniform vec3 u_dir;
uniform float u_espessura;
varying float v_lado;
void main(){
  vec3 dir = normalize(a_b - a_a);
  vec3 haste = normalize(cross(dir, u_dir));
  vec3 p = mix(a_a, a_b, a_lado.x) + haste * a_lado.y * u_espessura;
  v_lado = a_lado.y;
  gl_Position = u_vp * vec4(p, 1.0);
}`;

const FS_LINHAS = `
precision highp float;
uniform vec3 u_cor;
varying float v_lado;
void main(){
  float b = smoothstep(1.0, 0.0, abs(v_lado));
  gl_FragColor = vec4(u_cor * b * b * 0.55, 1.0);
}`;

/* --------------------------------------------------------------------------
   Camadas — os quatro níveis que o §16 fixa, com o que muda em cada um
   -------------------------------------------------------------------------- */

const CAMADAS = [
  { chave: 'galaxias',     rotulo: 'galáxia',     filhos: 'temas',
    raio: 6.0,  dist: 14.0, tam: 0.62, cor: ['#B01DFF', '#0072FF'], linha: '#8541FA' },
  { chave: 'constelacoes', rotulo: 'constelação', filhos: 'nichos',
    raio: 3.2,  dist: 7.4,  tam: 0.34, cor: ['#8541FA', '#1D8FC5'], linha: '#1D8FC5' },
  { chave: 'estrelas',     rotulo: 'estrela',     filhos: null,
    raio: 1.9,  dist: 4.4,  tam: 0.16, cor: ['#CFE4FF', '#7FE7FF'], linha: '#1D8FC5' },
  { chave: 'nicho',        rotulo: 'nicho',       filhos: null,
    raio: 0.0,  dist: 2.1,  tam: 0.34, cor: ['#FFFFFF', '#7FE7FF'], linha: '#1D8FC5' },
];

/* Distância focal da câmera do Atlas. Vive aqui porque o enquadramento e a
   projeção precisam concordar: se divergirem, o botão descola da estrela. */
const FOCO_CAMERA = 1.55;

const hexRGB = (h) => [parseInt(h.slice(1, 3), 16) / 255,
                       parseInt(h.slice(3, 5), 16) / 255,
                       parseInt(h.slice(5, 7), 16) / 255];

export class AtlasEstelar {
  /**
   * @param {HTMLElement} raiz  onde o Atlas é montado
   * @param {object} opcoes
   * @param {Array}  opcoes.dados        categorias: [{id, nome, temas:[{id,nome,nichos:[{id,nome}]}]}]
   * @param {string} [opcoes.nivel]      §36: 'pleno' | 'economico' | 'basico'
   * @param {Function} [opcoes.aoAbrirNicho]  chamada ao chegar no nicho individual
   * @param {Function} [opcoes.narrar]   canal de anúncio (por padrão, o próprio aria-live)
   */
  constructor(raiz, opcoes = {}) {
    if (!raiz) throw new TypeError('AtlasEstelar exige um elemento raiz.');
    this.raiz = raiz;
    this.dados = opcoes.dados || [];
    this.nivel = opcoes.nivel || 'pleno';
    this.aoAbrirNicho = opcoes.aoAbrirNicho || null;
    this.narrarExterno = opcoes.narrar || null;
    this.movimentoReduzido = typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.caminho = [];              // ids: [] -> [cat] -> [cat, tema] -> [cat, tema, nicho]
    this.nos = [];                  // nós da camada atual, já posicionados
    this._raf = 0;
    this._orbita = { giro: 0.0, altura: 0.16 };
    this._distancia = CAMADAS[0].dist;
    this._alvoDist = this._distancia;
    this._foco = [0, 0, 0];
    this._alvoFoco = [0, 0, 0];
    this._vp = null;
    this._destacado = null;

    this._montarDOM();
    // §36: no nível básico nem se tenta o WebGL — o modo lista é a experiência,
    // não um aviso de erro.
    this.modo = this.nivel === 'basico' ? 'lista' : (this._iniciarGL() ? '3d' : 'lista');
    this.raiz.dataset.lumModo = this.modo;
    this._ligarEventos();
    this.irPara([]);
    if (this.modo === '3d') this._laco();
  }

  /* ---------------------------------------------------------------- DOM */

  _montarDOM() {
    this.raiz.classList.add('lum-atlas');
    this.raiz.innerHTML = `
      <canvas class="lum-atlas-ceu" aria-hidden="true"></canvas>
      <div class="lum-atlas-topo">
        <nav class="lum-atlas-fio" aria-label="Caminho no Atlas Estelar"></nav>
        <div class="lum-atlas-busca">
          <label class="lum-atlas-rotulo" for="lum-atlas-q">Buscar no Atlas</label>
          <input id="lum-atlas-q" type="search" autocomplete="off"
                 placeholder="categoria, tema ou nicho">
        </div>
      </div>
      <ul class="lum-atlas-nos" role="list"></ul>
      <ul class="lum-atlas-achados" role="list" hidden></ul>
      <p class="lum-atlas-narracao" aria-live="polite"></p>`;
    this.canvas = this.raiz.querySelector('.lum-atlas-ceu');
    this.fio = this.raiz.querySelector('.lum-atlas-fio');
    this.lista = this.raiz.querySelector('.lum-atlas-nos');
    this.achados = this.raiz.querySelector('.lum-atlas-achados');
    this.narracao = this.raiz.querySelector('.lum-atlas-narracao');
    this.busca = this.raiz.querySelector('#lum-atlas-q');
  }

  /* ----------------------------------------------------------------- GL */

  _iniciarGL() {
    const attrs = { alpha: false, antialias: true, depth: false,
                    powerPreference: 'high-performance' };
    const gl = this.canvas.getContext('webgl', attrs)
            || this.canvas.getContext('experimental-webgl', attrs);
    if (!gl) return false;
    this.gl = gl;
    try {
      this.pFundo  = this._programa(VS,         FS_FUNDO,   ['a_pos']);
      this.pNos    = this._programa(VS_NOS,     FS_NOS,     ['a_centro', 'a_canto', 'a_dados', 'a_cor']);
      this.pLinhas = this._programa(VS_LINHAS,  FS_LINHAS,  ['a_a', 'a_b', 'a_lado']);
    } catch {
      return false;                       // §49.3: cai no modo lista, sem tela quebrada
    }
    this.bufTela = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTela);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.bufNos = gl.createBuffer();
    this.bufLinhas = gl.createBuffer();
    // Luz é aditiva: a soma acontece em espaço de exibição, não linear.
    // É uma aproximação assumida — o fundo já saiu gama-codificado do seu
    // passe, e WebGL1 não dá alvo de render em float com garantia.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    this._onPerda = (ev) => { ev.preventDefault(); this._cairParaLista(); };
    this.canvas.addEventListener('webglcontextlost', this._onPerda);
    return true;
  }

  _programa(vs, fs, atributos) {
    const gl = this.gl;
    const compilar = (tipo, fonte) => {
      const s = gl.createShader(tipo);
      gl.shaderSource(s, fonte);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(s);
        gl.deleteShader(s);
        throw new Error(`Atlas: shader não compila — ${log}`);
      }
      return s;
    };
    const a = compilar(gl.VERTEX_SHADER, vs);
    const b = compilar(gl.FRAGMENT_SHADER, fs);
    const prog = gl.createProgram();
    gl.attachShader(prog, a);
    gl.attachShader(prog, b);
    atributos.forEach((nome, i) => gl.bindAttribLocation(prog, i, nome));
    gl.linkProgram(prog);
    gl.deleteShader(a);
    gl.deleteShader(b);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      throw new Error(`Atlas: programa não liga — ${log}`);
    }
    // Uniformes descobertos uma vez, não a cada quadro
    const u = {};
    const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const nome = gl.getActiveUniform(prog, i).name;
      u[nome] = gl.getUniformLocation(prog, nome);
    }
    return { prog, u };
  }

  /** Perder o WebGL não pode virar tela preta: a navegação continua em DOM. */
  _cairParaLista() {
    this.modo = 'lista';
    this.raiz.dataset.lumModo = 'lista';
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._posicionarBotoes();
  }

  /* --------------------------------------------------------- navegação */

  /** Os nós da camada atual, já com posição determinística e cor. */
  _montarCamada() {
    const nivel = this.caminho.length;                 // 0..3
    const C = CAMADAS[Math.min(nivel, 3)];
    let itens = [];
    let semente = 'atlas';

    if (nivel === 0) {
      itens = this.dados;
    } else if (nivel === 1) {
      const cat = this._categoria();
      itens = cat?.temas || [];
      semente = `atlas/${cat?.id}`;
    } else if (nivel === 2) {
      const tema = this._tema();
      itens = tema?.nichos || [];
      semente = `atlas/${this._categoria()?.id}/${tema?.id}`;
    } else {
      const n = this._nicho();
      itens = n ? [n] : [];
      semente = `atlas/nicho/${n?.id}`;
    }

    const pos = nivel === 3 ? [[0, 0, 0]] : posicoes(itens, C.raio, semente);
    const [c1, c2] = C.cor.map(hexRGB);
    this.nos = itens.map((item, i) => {
      const mistura = itens.length > 1 ? i / (itens.length - 1) : 0.5;
      const filhos = item.temas || item.nichos || null;
      return {
        id: item.id ?? String(i),
        nome: item.nome ?? item.id ?? `item ${i + 1}`,
        dados: item,
        pos: pos[i] || [0, 0, 0],
        raio: C.tam * (0.82 + (filhos ? Math.min(filhos.length, 12) / 24 : 0.2)),
        cor: [c1[0] + (c2[0] - c1[0]) * mistura,
              c1[1] + (c2[1] - c1[1]) * mistura,
              c1[2] + (c2[2] - c1[2]) * mistura],
        filhos: filhos ? filhos.length : 0,
      };
    });
    this.camada = C;
    // ENQUADRAMENTO: a distância da câmera é calculada para a camada CABER,
    // não fixada por camada. Com um número fixo, uma galáxia com muitos temas
    // simplesmente sai da tela — e no 3D "sair da tela" não avisa, só some.
    // O meio-ângulo vertical da câmera é 0,5/1,55; a esfera que contém todos
    // os nós tem que caber nele, com uma folga pequena.
    const tanMeio = 0.5 / FOCO_CAMERA;
    const raioMax = this.nos.reduce(
      (m, n) => Math.max(m, Math.hypot(n.pos[0], n.pos[1], n.pos[2]) + n.raio * 1.6), 0.55);
    this._distBase = Math.max(C.dist * 0.5, raioMax / tanMeio * 1.06);
    this._alvoDist = this._distBase;
    this._alvoFoco = [0, 0, 0];
    if (this.movimentoReduzido) {
      this._distancia = this._alvoDist;
      this._foco = this._alvoFoco.slice();
    }
    this._reconstruirBuffers();
    this._renderBotoes();
  }

  _categoria() { return this.dados.find((c) => String(c.id) === this.caminho[0]); }
  _tema() { return this._categoria()?.temas?.find((t) => String(t.id) === this.caminho[1]); }
  _nicho() { return this._tema()?.nichos?.find((n) => String(n.id) === this.caminho[2]); }

  /**
   * Vai para um caminho absoluto: [] | [cat] | [cat, tema] | [cat, tema, nicho].
   * @returns {this}
   */
  irPara(caminho, opcoes = {}) {
    // Trocar de camada destrói os botões da camada anterior — inclusive o que
    // estava com o foco. Sem reposicionar o foco, quem navega por teclado é
    // devolvido ao <body>: perde o Esc, perde as setas e cai fora do Atlas
    // sem nada dizer. Então: quem entrou com foco aqui dentro, sai com foco
    // aqui dentro.
    const tinhaFoco = this.raiz.contains(document.activeElement);
    this.caminho = caminho.slice(0, 3).map(String);
    this._montarCamada();
    this._renderFio();
    this.busca.value = '';
    this.achados.hidden = true;
    if (opcoes.anunciar !== false) this._narrarCamada();
    if (this.caminho.length === 3 && this.aoAbrirNicho) {
      this.aoAbrirNicho(this._nicho(), this.caminho.slice());
    }
    if (this.modo === 'lista' || this.movimentoReduzido) this._posicionarBotoes();
    if (tinhaFoco && document.activeElement !== this.busca) {
      // preventScroll: o Atlas não arrasta a página só porque mudou de camada
      (this.botoes?.[0] || this.fio.querySelector('button'))
        ?.focus({ preventScroll: true });
    }
    return this;
  }

  /** Desce um nível a partir de um nó da camada atual. */
  descer(id) {
    if (this.caminho.length >= 3) return this;
    return this.irPara([...this.caminho, String(id)]);
  }

  /** Sobe um nível. No topo, não faz nada (e diz que não faz). */
  subir() {
    if (!this.caminho.length) {
      this._narrar('Você já está na vista das galáxias.');
      return this;
    }
    return this.irPara(this.caminho.slice(0, -1));
  }

  /* ---------------------------------------------------------- narração */

  /* NARRAÇÃO DA AURORA (§16: "com narração da Aurora").
     (DEFAULT DO AGENTE — o Guia manda a Aurora narrar, e não escreve as
     frases. O tom segue a §16: guardiã, calma quando ajuda. Nenhuma delas é
     decisão do Fundador.) */
  _narrarCamada() {
    const n = this.nos.length;
    const nivel = this.caminho.length;
    if (nivel === 0) {
      this._narrar(n === 1
        ? 'Uma galáxia no céu. Cada galáxia é uma categoria.'
        : `${n} galáxias no céu. Cada galáxia é uma categoria.`);
    } else if (nivel === 1) {
      this._narrar(`Galáxia ${this._categoria()?.nome}. ` +
        (n ? `${n} ${n === 1 ? 'constelação' : 'constelações'} aqui dentro.`
           : 'Ainda sem constelações — esta galáxia está esperando alguém.'));
    } else if (nivel === 2) {
      this._narrar(`Constelação ${this._tema()?.nome}. ` +
        (n ? `${n} ${n === 1 ? 'estrela' : 'estrelas'}, uma para cada nicho.`
           : 'Nenhuma estrela acesa ainda.'));
    } else {
      this._narrar(`Nicho ${this._nicho()?.nome}. Você chegou ao fim do caminho.`);
    }
  }

  _narrar(texto) {
    this.narracao.textContent = texto;
    if (this.narrarExterno) this.narrarExterno(texto);
    return this;
  }

  /* ------------------------------------------------------------- busca */

  /* §16 lista "barra de busca" na tela da Comunidade. Busca só na camada
     atual seria quase inútil num atlas de quatro camadas — então varre a
     árvore inteira e devolve o CAMINHO de cada achado, que é o que permite
     saltar direto para lá. */
  buscar(texto) {
    const q = String(texto || '').trim().toLowerCase();
    if (q.length < 2) { this.achados.hidden = true; this.achados.replaceChildren(); return []; }
    const achados = [];
    const bate = (s) => String(s || '').toLowerCase().includes(q);
    for (const cat of this.dados) {
      if (bate(cat.nome)) achados.push({ caminho: [cat.id], rotulo: cat.nome, tipo: 'galáxia' });
      for (const tema of cat.temas || []) {
        if (bate(tema.nome)) {
          achados.push({ caminho: [cat.id, tema.id], rotulo: tema.nome,
                         tipo: 'constelação', em: cat.nome });
        }
        for (const nicho of tema.nichos || []) {
          if (bate(nicho.nome)) {
            achados.push({ caminho: [cat.id, tema.id, nicho.id], rotulo: nicho.nome,
                           tipo: 'nicho', em: `${cat.nome} · ${tema.nome}` });
          }
        }
      }
    }
    this._renderAchados(achados, q);
    return achados;
  }

  _renderAchados(achados, q) {
    this.achados.replaceChildren();
    this.achados.hidden = achados.length === 0;
    for (const a of achados.slice(0, 12)) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lum-atlas-achado';
      b.innerHTML = `<span class="lum-atlas-achado-nome"></span>` +
                    `<span class="lum-atlas-achado-onde"></span>`;
      b.querySelector('.lum-atlas-achado-nome').textContent = a.rotulo;
      b.querySelector('.lum-atlas-achado-onde').textContent =
        a.em ? `${a.tipo} em ${a.em}` : a.tipo;
      b.addEventListener('click', () => this.irPara(a.caminho));
      li.appendChild(b);
      this.achados.appendChild(li);
    }
    this._narrar(achados.length
      ? `${achados.length} ${achados.length === 1 ? 'resultado' : 'resultados'} para "${q}".`
      : `Nada encontrado para "${q}".`);
  }

  /* ------------------------------------------------- os botões (verdade) */

  /* Um <button> real por nó. É por aqui que a navegação existe: foco do
     sistema, leitor de tela, Enter, Tab e teste automatizado. O canvas é
     aria-hidden justamente para o mesmo conteúdo não ser anunciado duas
     vezes — e porque ele não tem conteúdo, tem luz. */
  _renderBotoes() {
    this.lista.replaceChildren();
    this.botoes = this.nos.map((no) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lum-atlas-no';
      b.dataset.id = no.id;
      const folha = this.caminho.length >= 2;
      b.setAttribute('aria-label', folha
        ? `${no.nome}, ${this.camada.rotulo}`
        : `${no.nome}, ${this.camada.rotulo} com ${no.filhos} ` +
          `${no.filhos === 1 ? 'item' : 'itens'}`);
      b.innerHTML = `<span class="lum-atlas-ponto" aria-hidden="true"></span>` +
                    `<span class="lum-atlas-nome"></span>`;
      b.querySelector('.lum-atlas-nome').textContent = no.nome;
      b.style.setProperty('--no-cor',
        `rgb(${no.cor.map((c) => Math.round(c * 255)).join(',')})`);
      b.addEventListener('click', () => {
        if (this.caminho.length >= 3) this._narrar('Este é o nicho. Não há para onde descer.');
        else this.descer(no.id);
      });
      const destacar = (v) => { no.destaque = v; this._reconstruirBuffers(); };
      b.addEventListener('focus', () => destacar(1));
      b.addEventListener('blur', () => destacar(0));
      b.addEventListener('pointerenter', () => destacar(1));
      b.addEventListener('pointerleave', () => { if (document.activeElement !== b) destacar(0); });
      li.appendChild(b);
      this.lista.appendChild(li);
      no.botao = b;
      no.item = li;
      return b;
    });
    this._posicionarBotoes();
  }

  /* Costura: cada botão vai para a projeção do seu nó. No modo lista o
     posicionamento é abandonado e o CSS assume — a mesma marcação serve aos
     dois, então nenhuma funcionalidade depende do WebGL. */
  _posicionarBotoes() {
    if (this.modo !== '3d' || !this._vp) {
      for (const no of this.nos) {
        if (!no.item) continue;
        no.item.style.transform = '';
        no.item.hidden = false;
      }
      return;
    }
    const r = this.canvas.getBoundingClientRect();
    for (const no of this.nos) {
      if (!no.item) continue;
      const p = projetar(this._vp, no.pos, r.width, r.height);
      if (!p) { no.item.hidden = true; continue; }     // atrás da câmera
      no.item.hidden = false;
      // Posição E perspectiva num transform só, no <li>. O <button> dentro
      // dele se centra com translate(-50%,-50%) pelo CSS: como o recuo é
      // aplicado JÁ dentro do sistema escalado, o centro do botão continua
      // exatamente sobre a estrela em qualquer escala. Misturar escala e
      // recuo percentual no mesmo elemento desalinharia os dois.
      const e = Math.max(0.62, Math.min(1.35, 7 / p[2]));
      no.item.style.transform =
        `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px) scale(${e.toFixed(3)})`;
    }
  }

  /* ------------------------------------------------------------ buffers */

  _reconstruirBuffers() {
    if (this.modo !== '3d' || !this.gl) return;
    const gl = this.gl;
    // 6 vértices por nó (2 triângulos), 11 floats por vértice
    const cantos = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
    const v = new Float32Array(this.nos.length * 6 * 11);
    let k = 0;
    for (const no of this.nos) {
      for (const [cx, cy] of cantos) {
        v[k++] = no.pos[0]; v[k++] = no.pos[1]; v[k++] = no.pos[2];
        v[k++] = cx; v[k++] = cy;
        v[k++] = no.raio; v[k++] = no.destaque || 0; v[k++] = this.caminho.length;
        v[k++] = no.cor[0]; v[k++] = no.cor[1]; v[k++] = no.cor[2];
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNos);
    gl.bufferData(gl.ARRAY_BUFFER, v, gl.DYNAMIC_DRAW);
    this._nVertNos = this.nos.length * 6;

    // Linhas: a constelação é desenhada ligando cada nó ao vizinho mais
    // próximo ainda não ligado. Não é enfeite — é o que faz um punhado de
    // pontos LER como constelação (§71.1, a Constelação do Dia usa a mesma
    // ideia no Céu Vivo).
    const seg = [];
    if (this.nos.length > 1 && this.caminho.length < 3) {
      const restantes = this.nos.slice(1);
      let atual = this.nos[0];
      while (restantes.length) {
        let melhor = 0, melhorD = Infinity;
        restantes.forEach((o, i) => {
          const d = (o.pos[0] - atual.pos[0]) ** 2 + (o.pos[1] - atual.pos[1]) ** 2 +
                    (o.pos[2] - atual.pos[2]) ** 2;
          if (d < melhorD) { melhorD = d; melhor = i; }
        });
        const prox = restantes.splice(melhor, 1)[0];
        seg.push([atual.pos, prox.pos]);
        atual = prox;
      }
    }
    const lados = [[0, -1], [1, -1], [1, 1], [0, -1], [1, 1], [0, 1]];
    const l = new Float32Array(seg.length * 6 * 8);
    let j = 0;
    for (const [a, b] of seg) {
      for (const [t, lado] of lados) {
        l[j++] = a[0]; l[j++] = a[1]; l[j++] = a[2];
        l[j++] = b[0]; l[j++] = b[1]; l[j++] = b[2];
        l[j++] = t; l[j++] = lado;
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufLinhas);
    gl.bufferData(gl.ARRAY_BUFFER, l, gl.DYNAMIC_DRAW);
    this._nVertLinhas = seg.length * 6;
  }

  /* ------------------------------------------------------------- render */

  _camera() {
    const g = this._orbita.giro, a = this._orbita.altura;
    const d = this._distancia;
    const olho = [
      this._foco[0] + Math.sin(g) * Math.cos(a) * d,
      this._foco[1] + Math.sin(a) * d,
      this._foco[2] + Math.cos(g) * Math.cos(a) * d,
    ];
    const dir = normalizar(sub(this._foco, olho));
    const direita = normalizar(cruz(dir, [0, 1, 0]));
    const cima = cruz(direita, dir);
    return { olho, dir, direita, cima };
  }

  _dimensionar() {
    const teto = this.nivel === 'economico' ? 1 : 2;
    const dpr = Math.min(devicePixelRatio || 1, teto);
    const r = this.canvas.getBoundingClientRect();
    const L = Math.max(1, Math.round((r.width || 640) * dpr));
    const A = Math.max(1, Math.round((r.height || 360) * dpr));
    if (this.canvas.width !== L || this.canvas.height !== A) {
      this.canvas.width = L; this.canvas.height = A;
    }
    this.gl.viewport(0, 0, L, A);
    return [L, A];
  }

  _desenhar(t) {
    const gl = this.gl;
    const [L, A] = this._dimensionar();
    const cam = this._camera();
    this._vp = matrizVP(cam.olho, this._foco, [0, 1, 0],
                        2 * Math.atan(0.5 / FOCO_CAMERA), L / A, 0.05, 300);

    // 1) fundo: nebulosa + campo estelar, sem mistura (é a base)
    gl.disable(gl.BLEND);
    gl.useProgram(this.pFundo.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTela);
    gl.enableVertexAttribArray(0);
    gl.disableVertexAttribArray(1);
    gl.disableVertexAttribArray(2);
    gl.disableVertexAttribArray(3);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const uf = this.pFundo.u;
    gl.uniform2f(uf.u_res, L, A);
    gl.uniform1f(uf.u_t, t);
    gl.uniform1f(uf.u_p, 1);
    gl.uniform1f(uf.u_q, this.nivel === 'economico' ? 0.6 : 1.0);
    gl.uniform3fv(uf.u_dir, cam.dir);
    gl.uniform3fv(uf.u_direita, cam.direita);
    gl.uniform3fv(uf.u_cima, cam.cima);
    gl.uniform1f(uf.u_foco, FOCO_CAMERA);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 2) linhas da constelação, por baixo dos nós
    gl.enable(gl.BLEND);
    if (this._nVertLinhas > 0) {
      gl.useProgram(this.pLinhas.prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufLinhas);
      for (let i = 0; i < 3; i++) gl.enableVertexAttribArray(i);
      gl.disableVertexAttribArray(3);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
      gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);
      const ul = this.pLinhas.u;
      gl.uniformMatrix4fv(ul.u_vp, false, this._vp);
      gl.uniform3fv(ul.u_dir, cam.dir);
      gl.uniform1f(ul.u_espessura, this.camada.tam * 0.075);
      gl.uniform3fv(ul.u_cor, hexRGB(this.camada.linha));
      gl.drawArrays(gl.TRIANGLES, 0, this._nVertLinhas);
    }

    // 3) nós
    if (this._nVertNos > 0) {
      gl.useProgram(this.pNos.prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNos);
      for (let i = 0; i < 4; i++) gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 44, 0);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 44, 12);
      gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 44, 20);
      gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 44, 32);
      const un = this.pNos.u;
      gl.uniformMatrix4fv(un.u_vp, false, this._vp);
      gl.uniform3fv(un.u_direita, cam.direita);
      gl.uniform3fv(un.u_cima, cam.cima);
      gl.drawArrays(gl.TRIANGLES, 0, this._nVertNos);
    }
  }

  _laco() {
    const inicio = performance.now();
    const passo = (agora) => {
      const t = (agora - inicio) / 1000;
      // aproximação suave da câmera: a chegada é o gesto, não um corte
      const k = this.movimentoReduzido ? 1 : 0.085;
      this._distancia += (this._alvoDist - this._distancia) * k;
      for (let i = 0; i < 3; i++) {
        this._foco[i] += (this._alvoFoco[i] - this._foco[i]) * k;
      }
      // deriva lenta: o céu está vivo, mas não pisca (§35 item 8)
      if (!this.movimentoReduzido) this._orbita.giro += 0.00035;
      this._desenhar(t);
      this._posicionarBotoes();
      this._raf = requestAnimationFrame(passo);
    };
    this._raf = requestAnimationFrame(passo);
  }

  /* ----------------------------------------------------------- eventos */

  _ligarEventos() {
    this.busca.addEventListener('input', () => this.buscar(this.busca.value));

    // Esc sobe um nível — o gesto de "voltar" que a §65.3 já usa nas bolhas.
    this._onTecla = (ev) => {
      if (ev.key === 'Escape') {
        if (this.achados.hidden === false) {
          this.busca.value = ''; this.buscar('');
        } else { this.subir(); }
        return;
      }
      // Setas movem o foco para o nó VISUALMENTE mais próximo naquela
      // direção. Num mapa espacial, Tab em ordem de documento não basta:
      // quem enxerga a tela espera que a seta ande no céu.
      const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      const d = dirs[ev.key];
      if (!d || this.modo !== '3d') return;
      const atual = this.nos.find((n) => n.botao === document.activeElement);
      if (!atual) return;
      ev.preventDefault();
      const r = this.canvas.getBoundingClientRect();
      const pa = projetar(this._vp, atual.pos, r.width, r.height);
      if (!pa) return;
      let melhor = null, melhorC = Infinity;
      for (const no of this.nos) {
        if (no === atual || no.botao?.hidden) continue;
        const p = projetar(this._vp, no.pos, r.width, r.height);
        if (!p) continue;
        const dx = p[0] - pa[0], dy = p[1] - pa[1];
        const proj = dx * d[0] + dy * d[1];
        if (proj <= 4) continue;                        // não está nessa direção
        const desvio = Math.abs(dx * d[1] - dy * d[0]); // quanto sai do eixo
        const custo = desvio * 2 + proj;
        if (custo < melhorC) { melhorC = custo; melhor = no; }
      }
      melhor?.botao?.focus();
    };
    this.raiz.addEventListener('keydown', this._onTecla);

    if (this.modo !== '3d') return;

    // Arrastar orbita; roda aproxima. §65.3 pede gestos espaciais.
    let arrastando = false, ux = 0, uy = 0;
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('pointerdown', (ev) => {
      arrastando = true; ux = ev.clientX; uy = ev.clientY;
      this.canvas.setPointerCapture(ev.pointerId);
    });
    this.canvas.addEventListener('pointermove', (ev) => {
      if (!arrastando) return;
      this._orbita.giro -= (ev.clientX - ux) * 0.005;
      this._orbita.altura = Math.max(-1.2, Math.min(1.2,
        this._orbita.altura + (ev.clientY - uy) * 0.004));
      ux = ev.clientX; uy = ev.clientY;
    });
    const soltar = () => { arrastando = false; };
    this.canvas.addEventListener('pointerup', soltar);
    this.canvas.addEventListener('pointercancel', soltar);
    this.canvas.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      this._alvoDist = Math.max(this._distBase * 0.40,
                       Math.min(this._distBase * 2.0,
                                this._alvoDist * (1 + Math.sign(ev.deltaY) * 0.12)));
    }, { passive: false });

    // Pinça — o Guia nomeia este gesto: "pinça para zoom no Atlas Estelar".
    let pinca = 0;
    const toques = new Map();
    const dist2 = () => {
      const [a, b] = [...toques.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    this.canvas.addEventListener('touchstart', (ev) => {
      for (const t of ev.changedTouches) toques.set(t.identifier, { x: t.clientX, y: t.clientY });
      if (toques.size === 2) pinca = dist2();
    }, { passive: true });
    this.canvas.addEventListener('touchmove', (ev) => {
      for (const t of ev.changedTouches) {
        if (toques.has(t.identifier)) toques.set(t.identifier, { x: t.clientX, y: t.clientY });
      }
      if (toques.size === 2 && pinca > 0) {
        const agora = dist2();
        this._alvoDist = Math.max(this._distBase * 0.40,
                         Math.min(this._distBase * 2.0,
                                  this._alvoDist * (pinca / Math.max(agora, 1))));
        pinca = agora;
      }
    }, { passive: true });
    const largar = (ev) => {
      for (const t of ev.changedTouches) toques.delete(t.identifier);
      if (toques.size < 2) pinca = 0;
    };
    this.canvas.addEventListener('touchend', largar, { passive: true });
    this.canvas.addEventListener('touchcancel', largar, { passive: true });
  }

  /* ------------------------------------------------------- fio (§68.3) */

  _renderFio() {
    this.fio.replaceChildren();
    const passos = [{ rotulo: 'Atlas Estelar', caminho: [] }];
    if (this.caminho[0]) passos.push({ rotulo: this._categoria()?.nome, caminho: this.caminho.slice(0, 1) });
    if (this.caminho[1]) passos.push({ rotulo: this._tema()?.nome, caminho: this.caminho.slice(0, 2) });
    if (this.caminho[2]) passos.push({ rotulo: this._nicho()?.nome, caminho: this.caminho.slice(0, 3) });
    passos.forEach((p, i) => {
      const ultimo = i === passos.length - 1;
      const el = document.createElement(ultimo ? 'span' : 'button');
      el.className = 'lum-atlas-passo';
      el.textContent = p.rotulo || '—';
      if (ultimo) el.setAttribute('aria-current', 'location');
      else {
        el.type = 'button';
        el.addEventListener('click', () => this.irPara(p.caminho));
      }
      this.fio.appendChild(el);
    });
  }

  /* ---------------------------------------------------------- descarte */

  destruir() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    this.raiz.removeEventListener('keydown', this._onTecla);
    if (this.gl) {
      this.canvas.removeEventListener('webglcontextlost', this._onPerda);
      try { this.gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* ignora */ }
    }
    this.raiz.replaceChildren();
    this.raiz.classList.remove('lum-atlas');
    return this;
  }
}
