/* ==========================================================================
   Lumora — Fase 3A, passo 2: 🌌 CÉU VIVO (ambiente)
   §70.1 / §71.1. Liberado pelo "pode ir" do Fundador (05/09/2026).

   O fundo de TODOS os sistemas. Muda por horário do dia, NUNCA por cliente,
   país ou região (§60.2, §71 — wallpapers por país revogados em §60.1).

     madrugada -> aurora boreal sutil
     dia       -> partículas douradas
     noite     -> constelações acesas

   Cada ação real do negócio acende uma estrela. Ao fim do dia, a Lumora
   desenha a Constelação do Dia.

   MEIO (§65.5, decisão do Fundador):
     "Canvas 2D + WebGL (shaders) para fundo, partículas, aurora e rastros —
      nada de gradiente CSS chapado como estética principal."
     "Física leve de bolhas em JS puro, sem bibliotecas."
   Esta é a camada Canvas 2D, sem dependências. A camada de shaders WebGL
   para a aurora é o refinamento seguinte; o Canvas 2D permanece como o
   caminho garantido para hardware básico, que a §36 exige de qualquer forma.

   CUSTO ZERO: procedural, sem asset, sem API externa (§65.5, §71).
   ========================================================================== */

'use strict';

/** Fases do céu por hora local do aparelho.
 *  (DEFAULT DO AGENTE — o Guia nomeia "madrugada / dia / noite" mas não fixa
 *  os horários de corte. Faixas escolhidas para o fuso do Brasil; ajustáveis
 *  em `opcoes.fases` sem tocar no resto.) */
const FASES_PADRAO = [
  { nome: 'madrugada', de: 0,  ate: 5  },
  { nome: 'dia',       de: 6,  ate: 17 },
  { nome: 'noite',     de: 18, ate: 23 },
];

const PALETA = {
  madrugada: {
    fundo:     ['#00040F', '#04121F'],
    estrela:   'rgba(200, 210, 232, ',
    aurora:    ['#2BCF92', '#1D8FC5', '#8541FA'],  // §65.2, medido em 05
    densidade: 0.7,
  },
  dia: {
    fundo:     ['#00040F', '#0A1020'],
    estrela:   'rgba(255, 226, 168, ',
    particula: '#FFA238',                          // dourada, medido em 03
    densidade: 1.0,
  },
  noite: {
    fundo:     ['#000006', '#00060F'],
    estrela:   'rgba(230, 238, 255, ',
    linha:     'rgba(176, 29, 255, ',              // --lum-violeta
    densidade: 1.2,
  },
};

const TAU = Math.PI * 2;

function aleatorio(min, max) { return min + Math.random() * (max - min); }

export class CeuVivo {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} [opcoes]
   * @param {number} [opcoes.densidade=1]   multiplicador de estrelas
   * @param {string} [opcoes.nivel='pleno'] 'pleno' | 'economico' | 'basico' (§36)
   * @param {Array}  [opcoes.fases]         sobrescreve as faixas de horário
   * @param {Date}   [opcoes.agora]         injeta o relógio (testes)
   */
  constructor(canvas, opcoes = {}) {
    if (!canvas || !canvas.getContext) {
      throw new TypeError('CeuVivo exige um <canvas>.');
    }
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });

    // <canvas> é elemento substituído: sem inline-size/block-size explícitos
    // em CSS, o tamanho INTRÍNSECO (os atributos width/height) vira o tamanho
    // usado, e "position: fixed; inset: 0" NÃO estica o elemento. Pior: como
    // redimensionar() escreve nesses atributos, o layout se realimenta e o céu
    // encolhe a cada quadro. O runtime assume a medida para que nenhuma
    // integração caia nessa armadilha.
    if (!canvas.style.inlineSize) canvas.style.inlineSize = '100%';
    if (!canvas.style.blockSize) canvas.style.blockSize = '100%';
    if (!canvas.style.display) canvas.style.display = 'block';
    this.opcoes = opcoes;
    this.fases = opcoes.fases || FASES_PADRAO;
    this.nivel = opcoes.nivel || 'pleno';

    this.estrelas = [];
    this.particulas = [];
    this.estrelasDeNegocio = [];   // acesas por ação real (§70.1)
    this.constelacao = null;       // Constelação do Dia, quando desenhada

    this.cursor = { x: -9999, y: -9999, ativo: false };
    this.respirando = false;       // Respiração do Céu (§67.3)
    this.velocidadeAlvo = 1;
    this.velocidade = 1;

    this.rodando = false;
    this._raf = 0;
    this._ultimo = 0;
    this._amostrasFps = [];
    this._rebaixado = false;

    this.movimentoReduzido = typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.fase = this._faseAtual(opcoes.agora);
    this._ligarEventos();
    this.redimensionar();
  }

  /* --------------------------------------------------------------- ciclo */

  iniciar() {
    if (this.rodando) return this;
    // Com movimento reduzido o céu existe, mas não anima: um quadro estático.
    // O ambiente não desaparece — só para de se mexer (§35 item 8).
    if (this.movimentoReduzido) { this._quadro(0); return this; }
    this.rodando = true;
    this._ultimo = performance.now();
    const laco = (t) => {
      if (!this.rodando) return;
      const dt = Math.min((t - this._ultimo) / 16.667, 3); // em "frames de 60fps"
      this._ultimo = t;
      this._medirFps(t);
      this._quadro(dt);
      this._raf = requestAnimationFrame(laco);
    };
    this._raf = requestAnimationFrame(laco);
    return this;
  }

  parar() {
    this.rodando = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    return this;
  }

  destruir() {
    this.parar();
    this._desligarEventos();
    this.estrelas.length = 0;
    this.particulas.length = 0;
    this.estrelasDeNegocio.length = 0;
  }

  /* ------------------------------------------------------------- público */

  /** Acende uma estrela no céu — uma venda, entrega, pedido ou lançamento.
   *  §70.1: "Cada venda, entrega, pedido ou ação relevante acende uma
   *  estrela no céu."
   *  @param {object} [dados] carga livre (tipo, valor, id) usada depois pela
   *                          Constelação do Dia e pelo Replay do Dia (§61). */
  acenderEstrela(dados = {}) {
    const estrela = {
      x: aleatorio(0.08, 0.92) * this.largura,
      y: aleatorio(0.08, 0.72) * this.altura,
      brilho: 0,
      alvo: 1,
      raio: aleatorio(1.1, 1.8),
      nascida: Date.now(),
      dados,
    };
    this.estrelasDeNegocio.push(estrela);
    return estrela;
  }

  /** Desenha a Constelação do Dia — liga as estrelas acesas hoje.
   *  §71.1: "ao fim do dia a Lumora desenha a Constelação do Dia — uma
   *  constelação única formada pelas atividades do negócio". */
  constelacaoDoDia() {
    const pontos = this.estrelasDeNegocio.slice();
    if (pontos.length < 2) return null;
    // Liga em cadeia pelo vizinho mais próximo ainda não visitado: a forma
    // resultante é determinística para o mesmo conjunto de estrelas — a
    // constelação daquele dia é sempre a mesma se os dados forem os mesmos.
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
    this.constelacao = { pontos: ordem, progresso: 0, criada: Date.now() };
    return this.constelacao;
  }

  /** Respiração do Céu — Modo Foco (§67.3).
   *  "As estrelas desaceleram (~4x) e um halo suave pulsa na borda da tela." */
  respiracaoDoCeu(ligada = true) {
    this.respirando = ligada;
    this.velocidadeAlvo = ligada ? 0.25 : 1;   // ~4x mais lento
    this.canvas.dispatchEvent(new CustomEvent('lum:respiracao', {
      detail: { ligada }, bubbles: true,
    }));
    return this;
  }

  /** Troca a fase manualmente (demonstração e testes). */
  definirFase(nome) {
    if (!PALETA[nome]) throw new RangeError(`Fase desconhecida: ${nome}`);
    this.fase = nome;
    this._semear();
    if (this.movimentoReduzido || !this.rodando) this._quadro(0);
    return this;
  }

  /** Nível da otimização adaptativa (§36). */
  definirNivel(nivel) {
    this.nivel = nivel;
    this._semear();
    return this;
  }

  redimensionar() {
    const dpr = Math.min(devicePixelRatio || 1, this.nivel === 'basico' ? 1 : 2);
    const r = this.canvas.getBoundingClientRect();
    this.largura = Math.max(1, Math.round(r.width));
    this.altura = Math.max(1, Math.round(r.height));
    this.canvas.width = Math.round(this.largura * dpr);
    this.canvas.height = Math.round(this.altura * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._semear();
    if (this.movimentoReduzido || !this.rodando) this._quadro(0);
    return this;
  }

  /* ------------------------------------------------------------- interno */

  _faseAtual(agora) {
    const h = (agora instanceof Date ? agora : new Date()).getHours();
    const f = this.fases.find((x) => h >= x.de && h <= x.ate);
    return f ? f.nome : 'noite';
  }

  _semear() {
    const p = PALETA[this.fase];
    const area = this.largura * this.altura;
    const fator = { pleno: 1, economico: 0.55, basico: 0.3 }[this.nivel] ?? 1;
    // Divisor calibrado por leitura, não por chute: com 9000 uma tela de
    // 1280x900 em nível econômico ganhava ~84 estrelas — pontos soltos, não
    // um céu. A fase "noite" (§70.1, "constelações acesas") é justamente a
    // que mais depende de densidade, porque não tem aurora nem partículas
    // preenchendo o quadro.
    const alvo = Math.round((area / 4500) * p.densidade * fator *
                            (this.opcoes.densidade ?? 1));

    this.estrelas = Array.from({ length: alvo }, () => ({
      x: Math.random() * this.largura,
      y: Math.random() * this.altura,
      r: aleatorio(0.4, 1.5),
      // profundidade: fundo se move menos (parallax, §70.2)
      z: aleatorio(0.2, 1),
      fase: Math.random() * TAU,
      cintila: aleatorio(0.008, 0.03),
      dx: 0, dy: 0,
    }));

    // Partículas douradas do dia (§70.1)
    this.particulas = this.fase !== 'dia' ? [] :
      Array.from({ length: Math.round(alvo * 0.28) }, () => ({
        x: Math.random() * this.largura,
        y: Math.random() * this.altura,
        r: aleatorio(0.8, 2.2),
        vx: aleatorio(-0.12, 0.12),
        vy: aleatorio(-0.28, -0.06),   // sobem devagar
        vida: Math.random(),
      }));
  }

  _quadro(dt) {
    const ctx = this.ctx;
    const p = PALETA[this.fase];
    const L = this.largura, A = this.altura;

    // Aproxima a velocidade do alvo (transição suave ao entrar/sair do foco)
    this.velocidade += (this.velocidadeAlvo - this.velocidade) * 0.05 * (dt || 1);
    const v = this.velocidade;

    // --- fundo Deep Space
    const g = ctx.createLinearGradient(0, 0, 0, A);
    g.addColorStop(0, p.fundo[0]);
    g.addColorStop(1, p.fundo[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L, A);

    if (this.fase === 'madrugada') this._aurora(ctx, L, A, dt, v);

    this._estrelas(ctx, dt, v, p);

    if (this.fase === 'dia') this._particulas(ctx, L, A, dt, v, p);
    if (this.fase === 'noite') this._constelacoesDeFundo(ctx, p);

    this._estrelasDeNegocio(ctx, dt);
    if (this.constelacao) this._constelacaoDoDia(ctx, dt);
  }

  /** Aurora boreal sutil da madrugada.
   *  CORTINAS VERTICAIS — aurora boreal cai do céu, não é faixa horizontal.
   *  É a mesma matéria visual da Aurora (§65.2: "rios de luz verdes/teal/
   *  violeta fluindo"), nunca bolha. As três cortinas ficam separadas no eixo
   *  x para que as três cores se leiam; sobrepostas, a mistura aditiva as
   *  achata em um verde só. */
  _aurora(ctx, L, A, dt, v) {
    const t = (this._ultimo || 0) / 5000 * v;
    const cores = PALETA.madrugada.aurora;         // verde, teal, violeta
    const cortinas = this.nivel === 'basico' ? 1 : 3;
    const topo = A * 0.04, base = A * 0.62;
    const passo = this.nivel === 'pleno' ? 8 : 16;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let c = 0; c < cortinas; c++) {
      const cor = cores[c % 3];
      const cx = L * (0.24 + c * 0.26) + Math.sin(t * 0.7 + c * 2.1) * L * 0.07;
      const larg = L * 0.15;

      const g = ctx.createLinearGradient(0, topo, 0, base);
      g.addColorStop(0, cor + '00');
      g.addColorStop(0.32, cor + '30');   // sutil: §70.1 pede "aurora sutil"
      g.addColorStop(0.62, cor + '1A');
      g.addColorStop(1, cor + '00');
      ctx.fillStyle = g;

      // A cortina alarga na base, como aurora real.
      const desloc = (y) => Math.sin(y / 130 + t + c * 2.4) * larg * 0.55
                          + Math.sin(y / 47 + t * 1.7) * larg * 0.14;
      ctx.beginPath();
      for (let y = topo; y <= base; y += passo) {
        const f = (y - topo) / (base - topo);
        const x = cx + desloc(y) - larg * (0.45 + f * 0.35);
        if (y === topo) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      for (let y = base; y >= topo; y -= passo) {
        const f = (y - topo) / (base - topo);
        ctx.lineTo(cx + desloc(y) + larg * (0.45 + f * 0.35), y);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  _estrelas(ctx, dt, v, p) {
    const raio = 130, raio2 = raio * raio;
    for (const e of this.estrelas) {
      // Partículas fogem do toque/cursor (§70.2 / §71.2)
      if (this.cursor.ativo) {
        const ex = e.x - this.cursor.x, ey = e.y - this.cursor.y;
        const d2 = ex * ex + ey * ey;
        if (d2 < raio2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const forca = (1 - d / raio) * 1.6 * e.z;
          e.dx += (ex / d) * forca;
          e.dy += (ey / d) * forca;
        }
      }
      // volta ao lugar com inércia líquida
      e.dx *= 0.92; e.dy *= 0.92;
      e.fase += e.cintila * dt * v;

      const x = e.x + e.dx, y = e.y + e.dy;
      const alfa = 0.35 + Math.sin(e.fase) * 0.3;
      ctx.fillStyle = p.estrela + Math.max(0.08, alfa).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(x, y, e.r, 0, TAU);
      ctx.fill();
    }
  }

  _particulas(ctx, L, A, dt, v, p) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const q of this.particulas) {
      q.x += q.vx * dt * v;
      q.y += q.vy * dt * v;
      q.vida += 0.004 * dt * v;
      if (q.y < -8 || q.vida > 1) {
        q.x = Math.random() * L; q.y = A + 8; q.vida = 0;
      }
      if (q.x < -8) q.x = L + 8; else if (q.x > L + 8) q.x = -8;
      const alfa = Math.sin(q.vida * Math.PI) * 0.55;
      if (alfa <= 0) continue;
      ctx.fillStyle = p.particula + Math.round(alfa * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Constelações acesas da noite: liga as estrelas mais brilhantes
   *  próximas, formando figuras discretas no fundo. */
  _constelacoesDeFundo(ctx, p) {
    if (this.nivel === 'basico') return;
    const fortes = this.estrelas.filter((e) => e.r > 1.15);
    ctx.lineWidth = 0.6;
    for (let i = 0; i < fortes.length; i++) {
      const a = fortes[i];
      for (let j = i + 1; j < Math.min(i + 4, fortes.length); j++) {
        const b = fortes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > 120) continue;
        ctx.strokeStyle = p.linha + (0.10 * (1 - d / 120)).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(a.x + a.dx, a.y + a.dy);
        ctx.lineTo(b.x + b.dx, b.y + b.dy);
        ctx.stroke();
      }
    }
  }

  /** Estrelas acesas por ação real do negócio — mais quentes e maiores
   *  que as de fundo, para que a atividade se distinga do ambiente. */
  _estrelasDeNegocio(ctx, dt) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const e of this.estrelasDeNegocio) {
      if (e.brilho < e.alvo) e.brilho = Math.min(e.alvo, e.brilho + 0.05 * (dt || 1));
      // Estrela, não bola de luz: o núcleo é pequeno e o halo curto. Ela se
      // distingue das estrelas de fundo pelo brilho, não pelo tamanho.
      const r = e.raio * (1 + e.brilho * 0.3);
      const halo = r * 4;
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, halo);
      g.addColorStop(0, `rgba(255,255,255,${(0.95 * e.brilho).toFixed(3)})`);
      g.addColorStop(0.18, `rgba(215,180,255,${(0.55 * e.brilho).toFixed(3)})`);
      g.addColorStop(0.45, `rgba(176,29,255,${(0.20 * e.brilho).toFixed(3)})`);
      g.addColorStop(1, 'rgba(0,114,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(e.x, e.y, halo, 0, TAU);
      ctx.fill();
      // Núcleo sólido — a estrela tem um ponto, não só um borrão.
      ctx.fillStyle = `rgba(255,255,255,${e.brilho.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, r * 0.55, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  _constelacaoDoDia(ctx, dt) {
    const c = this.constelacao;
    // O traço se desenha progressivamente — o replay visual da §71.1.
    if (c.progresso < 1) {
      c.progresso = this.movimentoReduzido
        ? 1
        : Math.min(1, c.progresso + 0.004 * (dt || 1));
    }
    const total = c.pontos.length - 1;
    const ate = c.progresso * total;
    ctx.save();
    ctx.strokeStyle = 'rgba(176, 29, 255, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c.pontos[0].x, c.pontos[0].y);
    for (let i = 1; i <= total; i++) {
      const a = c.pontos[i - 1], b = c.pontos[i];
      if (i <= ate) {
        ctx.lineTo(b.x, b.y);
      } else if (i - 1 < ate) {
        const f = ate - (i - 1);
        ctx.lineTo(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
        break;
      } else break;
    }
    ctx.stroke();
    ctx.restore();
  }

  /* ---------------------------------------------------- telemetria local */

  /** Telemetria local de desempenho (§72.1 item 4, APROVADO):
   *  "fps medidos no aparelho, sem analytics externo (LGPD)".
   *  Alimenta a otimização adaptativa (§36) rebaixando o nível sozinho. */
  _medirFps(t) {
    this._amostrasFps.push(t);
    if (this._amostrasFps.length < 60) return;
    const janela = t - this._amostrasFps[0];
    const fps = (this._amostrasFps.length - 1) / (janela / 1000);
    this._amostrasFps.length = 0;
    this.fps = Math.round(fps);
    // A medida bruta vai para a Telemetria Local (§72.1 item 4), que é quem
    // decide subir de nível — o Céu Vivo só sabe descer, e uma vez só.
    this.aoMedirFps?.(fps);

    if (this._rebaixado) return;
    let novo = null;
    if (fps < 30 && this.nivel !== 'basico') novo = 'basico';
    else if (fps < 45 && this.nivel === 'pleno') novo = 'economico';
    if (novo) {
      this._rebaixado = true;              // rebaixa uma vez, nunca oscila
      this.definirNivel(novo);
      document.documentElement.dataset.lumNivel = novo;
      this.canvas.dispatchEvent(new CustomEvent('lum:nivel', {
        detail: { nivel: novo, fps: this.fps }, bubbles: true,
      }));
    }
  }

  /* ---------------------------------------------------------- eventos */

  _ligarEventos() {
    this._onPointer = (ev) => {
      const r = this.canvas.getBoundingClientRect();
      this.cursor.x = ev.clientX - r.left;
      this.cursor.y = ev.clientY - r.top;
      this.cursor.ativo = true;
    };
    this._onSair = () => { this.cursor.ativo = false; };
    this._onResize = () => this.redimensionar();
    this._onVisibilidade = () => {
      // Pausa fora da tela: não queima bateria desenhando o que ninguém vê.
      if (document.hidden) this.parar();
      else if (!this.movimentoReduzido) this.iniciar();
    };

    addEventListener('pointermove', this._onPointer, { passive: true });
    addEventListener('pointerleave', this._onSair, { passive: true });
    addEventListener('resize', this._onResize, { passive: true });
    document.addEventListener('visibilitychange', this._onVisibilidade);
  }

  _desligarEventos() {
    removeEventListener('pointermove', this._onPointer);
    removeEventListener('pointerleave', this._onSair);
    removeEventListener('resize', this._onResize);
    document.removeEventListener('visibilitychange', this._onVisibilidade);
  }
}

export { FASES_PADRAO, PALETA };
