/* ==========================================================================
   Lumora — Fase 3A, passo 4: 🚀 VIAGEM CÓSMICA (transições)
   §70.2 / §71.2. Liberado pelo "pode ir" do Fundador (05/09/2026).

   §71.2: "Trocar de sistema é uma viagem: a câmera encolhe a bolha atual,
   atravessa um campo de estrelas e cresce no sistema de destino (zoom
   astronômico). Com movimento reduzido, vira um fade simples."

   O fade simples com prefers-reduced-motion não é degradação opcional: é o
   comportamento que o Guia especifica nominalmente, em §70.2 e §71.2.

   Meio: Web Animations API + um canvas de rastro. Sem bibliotecas (§70.4).
   ========================================================================== */

'use strict';

const TAU = Math.PI * 2;

export class ViagemCosmica {
  /**
   * @param {object}  [opcoes]
   * @param {number}  [opcoes.duracao=900]  ms da viagem completa
   * @param {string}  [opcoes.nivel='pleno'] §36
   */
  constructor(opcoes = {}) {
    this.duracao = opcoes.duracao ?? 900;
    this.nivel = opcoes.nivel || 'pleno';
    this.ease = 'cubic-bezier(.22, 1, .36, 1)';   // §66.2
    this.emViagem = false;
    this.movimentoReduzido = typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Viaja da tela atual para a de destino.
   *
   * @param {HTMLElement} origem   tela que sai
   * @param {HTMLElement} destino  tela que entra (pode estar [hidden])
   * @param {object} [opcoes]
   * @param {{x:number,y:number}} [opcoes.foco]  ponto de partida do zoom
   *        (ex.: a bolha clicada). Padrão: centro da viewport.
   * @returns {Promise<void>}
   */
  async viajar(origem, destino, opcoes = {}) {
    if (this.emViagem) return;
    if (!destino) throw new TypeError('ViagemCosmica.viajar exige um destino.');
    this.emViagem = true;

    try {
      if (this.movimentoReduzido || this.nivel === 'basico') {
        await this._fadeSimples(origem, destino);
      } else {
        await this._zoomAstronomico(origem, destino, opcoes.foco);
      }
      // O foco do teclado acompanha a viagem — quem navega por teclado ou
      // leitor de tela chega junto com a câmera (§35 itens 4 e 6).
      const alvo = destino.querySelector('[autofocus], h1, [tabindex="-1"]') || destino;
      if (!alvo.hasAttribute('tabindex') && alvo === destino) {
        destino.setAttribute('tabindex', '-1');
      }
      alvo.focus({ preventScroll: true });
    } finally {
      this.emViagem = false;
    }
  }

  /* ------------------------------------------------ fade simples (§70.2) */

  async _fadeSimples(origem, destino) {
    const d = 180;
    if (origem) {
      await origem.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: d, easing: 'linear', fill: 'forwards' },
      ).finished;
      origem.hidden = true;
    }
    destino.hidden = false;
    await destino.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: d, easing: 'linear', fill: 'forwards' },
    ).finished;
    destino.style.opacity = '';
    if (origem) origem.style.opacity = '';
  }

  /* -------------------------------------------- zoom astronômico (§71.2) */

  async _zoomAstronomico(origem, destino, foco) {
    const cx = foco?.x ?? innerWidth / 2;
    const cy = foco?.y ?? innerHeight / 2;
    const org = `${cx}px ${cy}px`;
    const metade = this.duracao / 2;

    const campo = this._abrirCampoDeEstrelas(cx, cy);

    // 1. A câmera encolhe a tela atual até virar um ponto de luz.
    //    O transformOrigin precisa valer ANTES da animação: é ele que faz o
    //    zoom sair do ponto clicado, e não do centro do elemento.
    if (origem) {
      origem.style.transformOrigin = org;
      await origem.animate([
        { transform: 'scale(1)',    opacity: 1, filter: 'blur(0px)' },
        { transform: 'scale(0.04)', opacity: 0, filter: 'blur(6px)' },
      ], {
        duration: metade, easing: this.ease, fill: 'forwards',
      }).finished;
      origem.hidden = true;
      origem.style.transform = '';
      origem.style.opacity = '';
      origem.style.filter = '';
      origem.style.transformOrigin = '';
    }

    // 2. A tela de destino cresce a partir do mesmo ponto.
    destino.hidden = false;
    destino.style.transformOrigin = org;
    await destino.animate([
      { transform: 'scale(0.04)', opacity: 0, filter: 'blur(6px)' },
      { transform: 'scale(1)',    opacity: 1, filter: 'blur(0px)' },
    ], {
      duration: metade, easing: this.ease, fill: 'forwards',
    }).finished;
    destino.style.transform = '';
    destino.style.opacity = '';
    destino.style.filter = '';
    destino.style.transformOrigin = '';

    campo.fechar();
  }

  /** O campo de estrelas que a câmera atravessa: riscos radiais saindo do
   *  ponto de foco. Canvas descartável, some ao fim da viagem. */
  _abrirCampoDeEstrelas(cx, cy) {
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
      position: 'fixed', inset: '0', zIndex: '9998',
      pointerEvents: 'none',
    });
    canvas.setAttribute('aria-hidden', 'true');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const n = this.nivel === 'economico' ? 90 : 200;
    const riscos = Array.from({ length: n }, () => {
      const ang = Math.random() * TAU;
      return {
        ang,
        d: Math.random() * 60,
        v: 6 + Math.random() * 18,
        comp: 8 + Math.random() * 26,
        alfa: 0.25 + Math.random() * 0.6,
      };
    });

    const limite = Math.hypot(innerWidth, innerHeight);
    let raf = 0;
    let vivo = true;

    const laco = () => {
      if (!vivo) return;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.lineCap = 'round';
      for (const r of riscos) {
        r.d += r.v;
        if (r.d > limite) { r.d = 0; r.ang = Math.random() * TAU; }
        const cos = Math.cos(r.ang), sin = Math.sin(r.ang);
        const x1 = cx + cos * r.d, y1 = cy + sin * r.d;
        const x2 = cx + cos * (r.d + r.comp), y2 = cy + sin * (r.d + r.comp);
        // Esmaece perto do centro: o risco nasce, não aparece pronto.
        const f = Math.min(1, r.d / 140);
        ctx.strokeStyle = `rgba(226, 236, 255, ${(r.alfa * f).toFixed(3)})`;
        ctx.lineWidth = 1 + f;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      raf = requestAnimationFrame(laco);
    };
    raf = requestAnimationFrame(laco);

    return {
      fechar() {
        vivo = false;
        cancelAnimationFrame(raf);
        canvas.animate([{ opacity: 1 }, { opacity: 0 }],
          { duration: 220, fill: 'forwards' })
          .finished.then(() => canvas.remove(), () => canvas.remove());
      },
    };
  }
}
