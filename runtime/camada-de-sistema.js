/* ==========================================================================
   Lumora — 🛰 CAMADA DE SISTEMA
   A "camada complementar" que a §65.1 põe SOBRE o Céu Vivo, por sistema.

   POR QUE ISTO EXISTE — e por que resolve parte da ESCALACOES.md §6

   A §65.6 registra três "amostras conceituais" aprovadas em 01/09/2026 que
   nunca chegaram a este repositório: o fundo do RotaCerta ("GPS espacial"), o
   fundo do Hub ("Núcleo de Controle") e o tema Aurora. Elas ficavam listadas
   como pendência.

   Só que a própria §65.1 diz o que essas amostras são: **direção, não asset
   final** — "a renderização final será procedural (canvas/WebGL), NUNCA imagem
   estática". E a direção já está escrita, em docs/04-identidade-por-sistema.md:

     RotaCerta  "malha de rotas luminosas (teal + âmbar) ligando waypoints em
                 forma de constelação, com leve rastro de navegação"
     Hub        "núcleo de luz + anéis orbitais + satélites-bolha"
     Business   "céu estrelado puro (Céu Vivo padrão) (...) sem motivo extra"

   Faltava a implementação, não a direção. Até aqui esses motivos existiam
   apenas como ABERTURA (animação de entrada, slot §49), nunca como ambiente
   permanente de uso. É esse ambiente que este arquivo entrega.

   O QUE ESTE ARQUIVO NÃO FAZ

   - Não inventa assinatura para sistema nenhum: cada uma vem citada acima.
   - Não desenha logo, wordmark ou a L (regra 14). São motivos de ambiente.
   - Não é imagem: Canvas 2D, como a §65.1 exige e como o Céu Vivo já faz.
   - Não substitui o Céu Vivo: desenha POR CIMA dele, num canvas próprio com
     alfa. O Céu Vivo continua sendo o fundo de todos os sistemas, igual para
     todo mundo, mudando só por horário.

   REGRAS QUE ELE CUMPRE SOZINHO, EM VEZ DE DELEGAR

   - As cores saem dos tokens CSS (--lum-*), então **as seis paletas de alto
     contraste valem aqui também**. Em `preto-branco` a camada se desliga: essa
     paleta existe para clareza máxima, e ambiente decorativo trabalha contra.
     Em paleta clara ela escurece em vez de sumir — o problema que
     acessibilidade-bonita.css registrava e deixava "para quem integra".
   - `prefers-reduced-motion` desenha um quadro estático. O ambiente não some;
     só para de se mexer (§35 item 8).
   - `data-lum-nivel` (§36) reduz densidade e corta o rastro no nível básico.
   - Geometria DETERMINÍSTICA: o mesmo sistema cai sempre no mesmo lugar, para
     que a memória espacial de quem usa valha alguma coisa. Mesma regra do
     Atlas Estelar e da constelação dos documentos.
   ========================================================================== */

'use strict';

import { hash32, prng } from './documentos-com-alma.js';

/** Sistemas com assinatura registrada (§65.1, docs/04). */
export const SISTEMAS = ['business', 'rotacerta', 'ecossistema', 'comunidade', 'hub'];

/**
 * Sistemas cuja camada é deliberadamente VAZIA — e o motivo de cada um.
 * Vazio aqui é decisão registrada, não implementação faltando.
 */
export const SEM_CAMADA = {
  business: 'céu estrelado puro, sem motivo extra — a própria §65.1 decide assim',
  comunidade: 'o Atlas Estelar (§16) já É a camada da Comunidade',
  // A §65.1 lista assinatura para TRÊS produtos: Business, RotaCerta e Hub.
  // Não há assinatura decidida para o Ecossistema. A versão anterior deste
  // arquivo desenhava aqui o núcleo do Hub em intensidade reduzida — o que
  // contraria a §17/§34: o Hub é interno da equipe e nunca compõe produto do
  // catálogo. E o Ecossistema é RotaCerta + Business (§27), não Hub.
  ecossistema: 'a §65.1 não define assinatura para o Ecossistema; o núcleo do Hub não entra em produto comercial (§17/§34)',
};

const DENSIDADE = { pleno: 1, economico: 0.6, basico: 0.35 };

function lerToken(nome, alternativa) {
  if (typeof getComputedStyle !== 'function') return alternativa;
  const v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  return v || alternativa;
}

/** Interpola dois pontos. */
const lerp = (a, b, t) => a + (b - a) * t;

export class CamadaDeSistema {
  /**
   * @param {HTMLCanvasElement} canvas  canvas próprio, POR CIMA do Céu Vivo
   * @param {object} [opcoes]
   * @param {string} [opcoes.sistema='business']
   * @param {string} [opcoes.nivel='pleno']  §36
   */
  constructor(canvas, opcoes = {}) {
    if (!canvas || !canvas.getContext) {
      throw new TypeError('CamadaDeSistema exige um <canvas>.');
    }
    this.canvas = canvas;
    // alpha: true — esta camada precisa deixar o Céu Vivo aparecer por baixo.
    this.ctx = canvas.getContext('2d');

    // Mesma armadilha do Céu Vivo: <canvas> é elemento substituído e não
    // estica só com inset:0. Sem isto, redimensionar() realimenta o layout.
    if (!canvas.style.inlineSize) canvas.style.inlineSize = '100%';
    if (!canvas.style.blockSize) canvas.style.blockSize = '100%';
    if (!canvas.style.display) canvas.style.display = 'block';

    this.sistema = SISTEMAS.includes(opcoes.sistema) ? opcoes.sistema : 'business';
    this.nivel = opcoes.nivel || 'pleno';
    this.movimentoReduzido = typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.rodando = false;
    this._raf = 0;
    this._t = 0;
    this.waypoints = [];
    this.aneis = [];
    this.satelites = [];

    this._lerTokens();
    this._onResize = () => this.redimensionar();
    addEventListener('resize', this._onResize, { passive: true });
    this.redimensionar();
  }

  /* --------------------------------------------------------------- ciclo */

  iniciar() {
    if (this.rodando || !this.temCamada()) return this;
    if (this.movimentoReduzido) { this._quadro(0); return this; }
    this.rodando = true;
    let ultimo = performance.now();
    const laco = (t) => {
      if (!this.rodando) return;
      // O timestamp que o rAF entrega é o do INÍCIO do quadro corrente, que
      // pode ser anterior ao performance.now() lido aqui em iniciar(). Sem o
      // max(0), dt sai negativo no primeiro quadro, _t fica negativo, e como o
      // % do JavaScript herda o sinal do dividendo o índice do rastro vira
      // negativo — wp[-1] é undefined.
      const dt = Math.min(Math.max(0, (t - ultimo) / 16.667), 3);
      ultimo = t;
      this._t += dt;
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
    removeEventListener('resize', this._onResize);
    this._limpar();
    return this;
  }

  /* ----------------------------------------------------------- API curta */

  /** Este sistema tem camada, ou o vazio é a decisão? */
  temCamada() {
    return !(this.sistema in SEM_CAMADA) && !this.desligada;
  }

  /** Por que a camada está vazia, quando está. Para depuração honesta. */
  motivoDoVazio() {
    if (this.desligada) return 'paleta preto/branco: ambiente decorativo desligado';
    return SEM_CAMADA[this.sistema] || null;
  }

  definirSistema(nome) {
    if (!SISTEMAS.includes(nome)) return this;
    this.sistema = nome;
    this._semear();
    if (!this.temCamada()) { this._limpar(); this.parar(); return this; }
    if (!this.rodando && !this.movimentoReduzido) this.iniciar();
    else this._quadro(0);
    return this;
  }

  definirNivel(nivel) {
    this.nivel = nivel;
    this._semear();
    return this;
  }

  /** Rechama depois de trocar a paleta: as cores vêm dos tokens. */
  atualizarPaleta() {
    this._lerTokens();
    if (!this.temCamada()) { this._limpar(); this.parar(); return this; }
    if (!this.rodando && !this.movimentoReduzido) this.iniciar();
    else this._quadro(0);
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

  _lerTokens() {
    const paleta = typeof document !== 'undefined'
      ? document.documentElement.dataset.lumPaleta : null;

    // Preto/branco existe para clareza máxima. Ambiente decorativo ali só
    // atrapalha — e com todos os tokens em #FFFFFF a camada não teria nem
    // cor própria para desenhar.
    this.desligada = paleta === 'preto-branco';

    // Paleta clara: o problema que acessibilidade-bonita.css registrava
    // ("o canvas some") resolvido aqui, escurecendo em vez de sumir.
    this.claro = paleta === 'aurora-dia';

    this.cor = {
      rota:     lerToken('--lum-aurora-teal', '#1D8FC5'),
      waypoint: lerToken('--lum-rotacerta-ambar', '#FFA238'),
      nucleo:   lerToken('--lum-violeta', '#B01DFF'),
      orbita:   lerToken('--lum-azul', '#0072FF'),
    };
    // Sobre papel claro a mesma linha precisa de mais corpo para existir.
    this.forca = this.claro ? 1.7 : 1;
  }

  _limpar() {
    this.ctx.clearRect(0, 0, this.largura, this.altura);
  }

  _semear() {
    const rnd = prng(hash32(`lumora:camada:${this.sistema}`));
    const d = DENSIDADE[this.nivel] ?? 1;
    const W = this.largura || 1;
    const H = this.altura || 1;

    this.waypoints = [];
    this.aneis = [];
    this.satelites = [];
    this.nucleo = null;

    if (this.sistema === 'rotacerta') {
      // Waypoints "em forma de constelação": pontos espalhados e depois
      // ligados pelo vizinho mais próximo — a mesma regra da Constelação do
      // Dia e da constelação dos documentos, para que a "letra" seja a mesma.
      const n = Math.max(3, Math.round(9 * d));
      const pontos = [];
      for (let i = 0; i < n; i++) {
        pontos.push({ x: lerp(0.08, 0.92, rnd()) * W, y: lerp(0.12, 0.88, rnd()) * H });
      }
      const restantes = pontos.slice(1);
      const ordem = [pontos[0]];
      let atual = pontos[0];
      while (restantes.length) {
        let melhor = 0, menor = Infinity;
        for (let i = 0; i < restantes.length; i++) {
          const dd = (restantes[i].x - atual.x) ** 2 + (restantes[i].y - atual.y) ** 2;
          if (dd < menor) { menor = dd; melhor = i; }
        }
        atual = restantes.splice(melhor, 1)[0];
        ordem.push(atual);
      }
      this.waypoints = ordem;
    }

    if (this.sistema === 'hub') {
      // Núcleo de luz + anéis orbitais. O núcleo fica fora do centro exato
      // para não brigar com o conteúdo, que costuma ocupar o meio.
      this.nucleo = { x: 0.74 * W, y: 0.30 * H, raio: Math.min(W, H) * 0.16 };
      const n = 3;
      for (let i = 0; i < n; i++) {
        this.aneis.push({
          rx: this.nucleo.raio * (1.7 + i * 0.85),
          ry: this.nucleo.raio * (0.55 + i * 0.28),
          giro: lerp(-0.5, 0.5, rnd()) + i * 0.4,
          velocidade: (0.0035 + rnd() * 0.0025) * (i % 2 ? -1 : 1),
        });
      }
      const sats = Math.max(1, Math.round(4 * d));
      for (let i = 0; i < sats; i++) {
        this.satelites.push({
          anel: i % this.aneis.length,
          fase: rnd() * Math.PI * 2,
          raio: 2.2 + rnd() * 1.6,
        });
      }
    }
  }

  _quadro() {
    if (!this.temCamada()) { this._limpar(); return; }
    const ctx = this.ctx;
    this._limpar();
    ctx.save();
    // Ambiente nunca compete com o conteúdo: tudo entra com alfa baixo.
    // Sobre fundo escuro a luz soma; sobre papel claro somar clareia até
    // sumir, então ali a camada pinta normal.
    ctx.globalCompositeOperation = this.claro ? 'source-over' : 'lighter';

    if (this.waypoints.length) this._desenharRotas(ctx);
    if (this.aneis.length) this._desenharNucleo(ctx);

    ctx.restore();
  }

  /** RotaCerta: rotas teal + waypoints âmbar + rastro de navegação. */
  _desenharRotas(ctx) {
    const wp = this.waypoints;

    // As rotas
    ctx.strokeStyle = this.cor.rota;
    ctx.globalAlpha = 0.16 * this.forca;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(wp[0].x, wp[0].y);
    for (let i = 1; i < wp.length; i++) ctx.lineTo(wp[i].x, wp[i].y);
    ctx.stroke();

    // Os waypoints, em âmbar
    ctx.fillStyle = this.cor.waypoint;
    for (let i = 0; i < wp.length; i++) {
      ctx.globalAlpha = 0.30 * this.forca;
      ctx.beginPath();
      ctx.arc(wp[i].x, wp[i].y, 1.9, 0, Math.PI * 2);
      ctx.fill();
    }

    // O rastro de navegação: um ponto que percorre a rota e desbota atrás.
    // No nível básico ele não existe — é o elemento mais caro e o menos
    // informativo (§36).
    if (this.nivel === 'basico' || this.movimentoReduzido) return;

    const total = wp.length - 1;
    if (total < 1) return;                       // rota de um ponto só não anda
    // Módulo sempre positivo: (x % n + n) % n. Não depende de _t se comportar.
    const passo = (((this._t * 0.004) % total) + total) % total;
    const i = Math.min(total - 1, Math.floor(passo));
    const f = passo - i;
    const cauda = 0.55;
    for (let k = 0; k < 14; k++) {
      const p = Math.max(0, passo - k * (cauda / 14));
      const j = Math.floor(p);
      const g = p - j;
      if (j >= total) continue;
      const x = lerp(wp[j].x, wp[j + 1].x, g);
      const y = lerp(wp[j].y, wp[j + 1].y, g);
      ctx.globalAlpha = (0.34 - k * 0.023) * this.forca;
      if (ctx.globalAlpha <= 0) break;
      ctx.beginPath();
      ctx.arc(x, y, 2.4 - k * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    // A cabeça do rastro, mais viva
    const x = lerp(wp[i].x, wp[i + 1].x, f);
    const y = lerp(wp[i].y, wp[i + 1].y, f);
    ctx.globalAlpha = 0.5 * this.forca;
    ctx.beginPath();
    ctx.arc(x, y, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Hub: núcleo de luz + anéis orbitais + satélites-bolha. */
  _desenharNucleo(ctx) {
    const { x, y, raio } = this.nucleo;

    // O núcleo
    const g = ctx.createRadialGradient(x, y, 0, x, y, raio);
    g.addColorStop(0, this.cor.nucleo);
    g.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.16 * this.forca;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, raio, 0, Math.PI * 2);
    ctx.fill();

    // Os anéis orbitais
    ctx.strokeStyle = this.cor.orbita;
    ctx.lineWidth = 1;
    for (const a of this.aneis) {
      const giro = a.giro + (this.movimentoReduzido ? 0 : this._t * a.velocidade * 0.12);
      ctx.globalAlpha = 0.17 * this.forca;
      ctx.beginPath();
      ctx.ellipse(x, y, a.rx, a.ry, giro, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Os satélites-bolha, correndo sobre os anéis
    ctx.fillStyle = this.cor.orbita;
    for (const s of this.satelites) {
      const a = this.aneis[s.anel];
      const giro = a.giro + (this.movimentoReduzido ? 0 : this._t * a.velocidade * 0.12);
      const ang = s.fase + (this.movimentoReduzido ? 0 : this._t * a.velocidade);
      // ponto na elipse, depois rotacionado pelo giro do anel
      const ex = Math.cos(ang) * a.rx;
      const ey = Math.sin(ang) * a.ry;
      const px = x + ex * Math.cos(giro) - ey * Math.sin(giro);
      const py = y + ex * Math.sin(giro) + ey * Math.cos(giro);
      ctx.globalAlpha = 0.42 * this.forca;
      ctx.beginPath();
      ctx.arc(px, py, s.raio, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
