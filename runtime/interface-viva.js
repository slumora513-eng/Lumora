/* ==========================================================================
   Lumora — INTERFACE VIVA (§67 e §68)
   Aprovada pelo Fundador em 01/09/2026; código liberado em 05/09/2026.

   §67: "a interface é o maior diferencial da Lumora — exclusiva, com
   identidade visual própria, inexistente em qualquer outro sistema."

   Gestos deste módulo:
     §67.1  Nebulosa de Ações   comando universal Ctrl+K
     §67.2  Rastro de Aurora    fio de luz de 4px durante processamento
     §67.4  Sismógrafo Vivo     faixa de 64px com a atividade em tempo real
     §67.6  Estrela do Usuário  perfil e contexto
     §67.7  Clima do Dia        badge de contexto
     §68.2  Poeira de Interação partículas no toque/clique
     §68.3  Fio de Ariadne      trilha de navegação em migalhas de luz
     §68.4  Estrelinha          favoritos celestes
     §68.5  Comandos de Voz     Web Speech nativo, offline, sem custo

   §67.9/§68.7: tudo CSS/JS procedural, zero asset, 60fps,
   prefers-reduced-motion sempre respeitado.
   ========================================================================== */

'use strict';

const TAU = Math.PI * 2;

/* =========================================================================
   §67.1 — NEBULOSA DE AÇÕES (Ctrl+K)
   "Overlay central em forma de nebulosa que dissolve a tela aberta.
    Digitar filtra ações/abas; ↑/↓ navega, Enter executa, Esc dissolve."
   ========================================================================= */

export class NebulosaDeAcoes {
  /**
   * @param {object} opcoes
   * @param {Array} opcoes.acoes  [{ id, rotulo, grupo?, executar() }]
   */
  constructor(opcoes = {}) {
    this.acoes = opcoes.acoes || [];
    this.aberta = false;
    this.indice = 0;
    this.filtradas = [];
    this._montar();
    this._onAtalho = (ev) => {
      // Ctrl+K (ou ⌘K) abre de qualquer lugar — "qualquer tela em 2 teclas".
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        this.aberta ? this.fechar() : this.abrir();
      }
    };
    document.addEventListener('keydown', this._onAtalho);
  }

  _montar() {
    this.el = document.createElement('div');
    this.el.className = 'lum-nebulosa';
    this.el.hidden = true;
    this.el.innerHTML = `
      <div class="lum-nebulosa-caixa" role="dialog" aria-modal="true"
           aria-label="Nebulosa de Ações">
        <input class="lum-nebulosa-campo lum-campo" type="text"
               role="combobox" aria-expanded="true" aria-autocomplete="list"
               aria-controls="lum-nebulosa-lista"
               placeholder="o que você quer fazer?">
        <ul class="lum-nebulosa-lista" id="lum-nebulosa-lista" role="listbox"></ul>
      </div>`;
    this.campo = this.el.querySelector('.lum-nebulosa-campo');
    this.lista = this.el.querySelector('.lum-nebulosa-lista');
    document.body.appendChild(this.el);

    this.campo.addEventListener('input', () => { this.indice = 0; this._filtrar(); });
    this.campo.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown') { ev.preventDefault(); this._mover(1); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); this._mover(-1); }
      else if (ev.key === 'Enter') { ev.preventDefault(); this._executar(); }
      else if (ev.key === 'Escape') { ev.preventDefault(); this.fechar(); }
    });
    this.el.addEventListener('pointerdown', (ev) => {
      if (ev.target === this.el) this.fechar();
    });
  }

  definirAcoes(acoes) { this.acoes = acoes; return this; }

  abrir() {
    this.aberta = true;
    this._focoAnterior = document.activeElement;
    this.el.hidden = false;
    this.campo.value = '';
    this.indice = 0;
    this._filtrar();
    this.campo.focus();
    return this;
  }

  fechar() {
    this.aberta = false;
    this.el.hidden = true;
    // Devolve o foco a quem o tinha: quem usa teclado não se perde.
    this._focoAnterior?.focus?.({ preventScroll: true });
    return this;
  }

  _filtrar() {
    const q = this.campo.value.trim().toLowerCase();
    this.filtradas = !q ? this.acoes.slice(0, 12)
      : this.acoes.filter((a) => a.rotulo.toLowerCase().includes(q)
                              || (a.grupo || '').toLowerCase().includes(q))
                  .slice(0, 12);
    this.lista.replaceChildren();
    this.filtradas.forEach((a, i) => {
      const li = document.createElement('li');
      li.className = 'lum-nebulosa-item';
      li.id = `lum-neb-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === this.indice));
      if (i === this.indice) li.classList.add('lum-nebulosa-item--foco');
      li.innerHTML = '<span class="lum-neb-rotulo"></span>' +
                     '<span class="lum-neb-grupo"></span>';
      li.querySelector('.lum-neb-rotulo').textContent = a.rotulo;
      li.querySelector('.lum-neb-grupo').textContent = a.grupo || '';
      li.addEventListener('click', () => { this.indice = i; this._executar(); });
      this.lista.appendChild(li);
    });
    this.campo.setAttribute('aria-activedescendant',
      this.filtradas.length ? `lum-neb-${this.indice}` : '');
  }

  _mover(p) {
    if (!this.filtradas.length) return;
    this.indice = (this.indice + p + this.filtradas.length) % this.filtradas.length;
    this._filtrar();
  }

  _executar() {
    const a = this.filtradas[this.indice];
    if (!a) return;
    this.fechar();
    a.executar?.();
  }

  destruir() {
    document.removeEventListener('keydown', this._onAtalho);
    this.el.remove();
  }
}

/* =========================================================================
   §67.2 — RASTRO DE AURORA
   "Fio de luz de 4px estilo aurora varre o topo da tela durante
    processamento. Feedback assíncrono sem spinner genérico."
   ========================================================================= */

export class RastroDeAurora {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'lum-rastro';
    this.el.hidden = true;
    // O rastro é decorativo; quem informa o estado é o texto em aria-live.
    this.el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.el);
    this._contador = 0;
  }

  /** Suporta chamadas aninhadas: só some quando a última terminar. */
  iniciar() {
    this._contador++;
    this.el.hidden = false;
    return this;
  }

  parar() {
    this._contador = Math.max(0, this._contador - 1);
    if (!this._contador) this.el.hidden = true;
    return this;
  }

  /** Envolve uma promessa: o rastro acompanha exatamente o processamento. */
  async durante(promessa) {
    this.iniciar();
    try { return await promessa; }
    finally { this.parar(); }
  }

  destruir() { this.el.remove(); }
}

/* =========================================================================
   §67.4 — SISMÓGRAFO VIVO
   "Faixa na base da tela desenha linha sísmica em tempo real; cada evento
    real (venda, pedido, clique) injeta um pulso na onda."
   Canvas de 64px, 60fps.
   ========================================================================= */

export class SismografoVivo {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} [opcoes]
   * @param {number} [opcoes.altura=64]
   */
  constructor(canvas, opcoes = {}) {
    if (!canvas?.getContext) throw new TypeError('SismografoVivo exige um <canvas>.');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.altura = opcoes.altura ?? 64;
    if (!canvas.style.inlineSize) canvas.style.inlineSize = '100%';
    if (!canvas.style.blockSize) canvas.style.blockSize = `${this.altura}px`;
    if (!canvas.style.display) canvas.style.display = 'block';

    this.amostras = [];
    this.impulso = 0;
    this.rodando = false;
    this._raf = 0;
    this.movimentoReduzido = typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._onResize = () => this.redimensionar();
    addEventListener('resize', this._onResize, { passive: true });
    this.redimensionar();
  }

  redimensionar() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = this.canvas.getBoundingClientRect();
    this.L = Math.max(1, Math.round(r.width));
    this.A = Math.max(1, Math.round(r.height || this.altura));
    this.canvas.width = Math.round(this.L * dpr);
    this.canvas.height = Math.round(this.A * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.ceil(this.L / 2);
    while (this.amostras.length < n) this.amostras.push(0);
    if (this.amostras.length > n) this.amostras = this.amostras.slice(-n);
    return this;
  }

  /** Um evento real do sistema injeta um pulso na onda.
   *  @param {number} [forca=1] 0..1 — venda grande sacode mais que um clique */
  pulso(forca = 1) {
    this.impulso = Math.min(1.6, this.impulso + Math.max(0.05, forca));
    return this;
  }

  iniciar() {
    if (this.rodando) return this;
    // Com movimento reduzido a faixa não anima; desenha o traço parado.
    if (this.movimentoReduzido) { this._quadro(); return this; }
    this.rodando = true;
    const laco = () => {
      if (!this.rodando) return;
      this._passo();
      this._quadro();
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

  _passo() {
    // Ruído de base + o impulso decaindo: a linha "sente" a atividade.
    const base = (Math.random() - 0.5) * 0.06;
    const v = base + (Math.random() - 0.5) * this.impulso;
    this.impulso *= 0.90;
    this.amostras.push(Math.max(-1, Math.min(1, v)));
    this.amostras.shift();
  }

  _quadro() {
    const ctx = this.ctx, L = this.L, A = this.A;
    ctx.clearRect(0, 0, L, A);
    const meio = A / 2;

    // Linha de referência
    ctx.strokeStyle = 'rgba(90, 107, 140, .35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, meio);
    ctx.lineTo(L, meio);
    ctx.stroke();

    // O traço sísmico
    const g = ctx.createLinearGradient(0, 0, L, 0);
    g.addColorStop(0, 'rgba(43, 207, 146, .25)');
    g.addColorStop(0.5, 'rgba(29, 143, 197, .85)');
    g.addColorStop(1, 'rgba(176, 29, 255, .95)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < this.amostras.length; i++) {
      const x = (i / (this.amostras.length - 1)) * L;
      const y = meio - this.amostras[i] * (meio - 4);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  destruir() {
    this.parar();
    removeEventListener('resize', this._onResize);
  }
}

/* =========================================================================
   §68.2 — POEIRA DE INTERAÇÃO
   "Ao clicar/tocar em qualquer lugar, uma névoa de partículas de luz se
    dispersa do ponto (canvas translúcido por cima do céu)."
   §68.2: desligada com prefers-reduced-motion.
   ========================================================================= */

export class PoeiraDeInteracao {
  constructor(opcoes = {}) {
    this.nivel = opcoes.nivel || 'pleno';
    this.movimentoReduzido = typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'lum-poeira';
    this.canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.particulas = [];
    this._raf = 0;

    this._onResize = () => this._dimensionar();
    this._onClique = (ev) => this.espalhar(ev.clientX, ev.clientY);
    addEventListener('resize', this._onResize, { passive: true });
    if (!this.movimentoReduzido && this.nivel !== 'basico') {
      addEventListener('pointerdown', this._onClique, { passive: true });
    }
    this._dimensionar();
  }

  _dimensionar() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = innerWidth * dpr;
    this.canvas.height = innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  espalhar(x, y) {
    if (this.movimentoReduzido || this.nivel === 'basico') return;
    const n = this.nivel === 'economico' ? 8 : 16;
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * TAU;
      const vel = 0.6 + Math.random() * 2.4;
      this.particulas.push({
        x, y,
        vx: Math.cos(ang) * vel,
        vy: Math.sin(ang) * vel - 0.4,
        vida: 1,
        r: 0.8 + Math.random() * 1.8,
      });
    }
    if (!this._raf) this._laco();
  }

  _laco() {
    const passo = () => {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = this.particulas.length - 1; i >= 0; i--) {
        const p = this.particulas[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.03;                 // gravidade leve: a poeira assenta
        p.vx *= 0.98; p.vy *= 0.98;
        p.vida -= 0.022;
        if (p.vida <= 0) { this.particulas.splice(i, 1); continue; }
        ctx.fillStyle = `rgba(215, 200, 255, ${(p.vida * 0.75).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.vida, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      if (this.particulas.length) this._raf = requestAnimationFrame(passo);
      else { this._raf = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    };
    this._raf = requestAnimationFrame(passo);
  }

  destruir() {
    if (this._raf) cancelAnimationFrame(this._raf);
    removeEventListener('resize', this._onResize);
    removeEventListener('pointerdown', this._onClique);
    this.canvas.remove();
  }
}

/* =========================================================================
   §68.3 — FIO DE ARIADNE
   "Chips de luz no topo registram o caminho percorrido; clicar volta direto.
    O usuário nunca se perde no cosmos — retorno em 1 toque."
   ========================================================================= */

export class FioDeAriadne {
  constructor(opcoes = {}) {
    this.limite = opcoes.limite ?? 6;
    this.trilha = [];
    this.el = document.createElement('nav');
    this.el.className = 'lum-fio';
    this.el.setAttribute('aria-label', 'Caminho percorrido');
    (opcoes.raiz || document.body).appendChild(this.el);
  }

  /** @param {{id:string, rotulo:string, voltar?:Function}} passo */
  registrar(passo) {
    const i = this.trilha.findIndex((p) => p.id === passo.id);
    // Voltar a um lugar já visitado poda o que veio depois, em vez de repetir.
    if (i >= 0) this.trilha = this.trilha.slice(0, i + 1);
    else this.trilha.push(passo);
    if (this.trilha.length > this.limite) this.trilha.shift();
    this._render();
    return this;
  }

  limpar() { this.trilha = []; this._render(); return this; }

  _render() {
    this.el.replaceChildren();
    this.el.hidden = this.trilha.length < 2;
    this.trilha.forEach((p, i) => {
      const b = document.createElement('button');
      b.className = 'lum-fio-chip';
      b.textContent = p.rotulo;
      if (i === this.trilha.length - 1) {
        b.classList.add('lum-fio-chip--atual');
        b.setAttribute('aria-current', 'page');
      }
      b.addEventListener('click', () => {
        this.trilha = this.trilha.slice(0, i + 1);
        this._render();
        p.voltar?.(p);
      });
      this.el.appendChild(b);
    });
  }

  destruir() { this.el.remove(); }
}

/* =========================================================================
   §68.4 — ESTRELINHA (favoritos celestes)
   "Cada card/item tem uma estrelinha para marcar como favorito, com contador
    no topo." Substitui "curtir/pin" genérico.
   ========================================================================= */

export class Estrelinha {
  constructor(opcoes = {}) {
    this.chave = opcoes.chave || 'lum:estrelinhas';
    this.favoritos = new Set(this._ler());
    this.aoMudar = opcoes.aoMudar || (() => {});
  }

  _ler() {
    try { return JSON.parse(localStorage.getItem(this.chave) || '[]'); }
    catch { return []; }     // modo privado, site data bloqueado: segue vazio
  }

  _gravar() {
    try { localStorage.setItem(this.chave, JSON.stringify([...this.favoritos])); }
    catch { /* conveniência por dispositivo; perder não quebra nada */ }
  }

  /** Liga a estrelinha a todo [data-lum-estrelinha] dentro da raiz. */
  aplicar(raiz = document) {
    for (const alvo of raiz.querySelectorAll('[data-lum-estrelinha]')) {
      if (alvo.dataset.lumEstrelinhaPronta) continue;
      alvo.dataset.lumEstrelinhaPronta = '1';
      const id = alvo.dataset.lumEstrelinha;
      const b = document.createElement('button');
      b.className = 'lum-estrelinha';
      b.type = 'button';
      const pintar = () => {
        const on = this.favoritos.has(id);
        b.setAttribute('aria-pressed', String(on));
        // §35 item 3: o estado não é só a cor — o rótulo diz o que é.
        b.setAttribute('aria-label',
          on ? 'Remover dos favoritos' : 'Marcar como favorito');
        b.textContent = on ? '★' : '☆';
      };
      b.addEventListener('click', () => {
        this.favoritos.has(id) ? this.favoritos.delete(id) : this.favoritos.add(id);
        this._gravar();
        pintar();
        this.aoMudar(this.favoritos);
      });
      pintar();
      alvo.appendChild(b);
    }
    return this;
  }

  get total() { return this.favoritos.size; }
}

/* =========================================================================
   §68.5 — COMANDOS DE VOZ
   "Web Speech API nativa do navegador — processa no aparelho, sem API
    externa, sem custo, offline. Navegadores sem suporte: o botão avisa e
    se desliga."
   REGRA (§68.5): "som nunca é canal único — o resultado sempre aparece
   também em texto/toast."
   ========================================================================= */

export class ComandosDeVoz {
  /**
   * @param {object} opcoes
   * @param {Object<string,Function>} opcoes.comandos  { "venda": fn, ... }
   * @param {Function} [opcoes.aoResultado] (texto, reconhecido) => void
   */
  constructor(opcoes = {}) {
    this.comandos = opcoes.comandos || {};
    this.aoResultado = opcoes.aoResultado || (() => {});
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.suportado = !!SR;
    this.ouvindo = false;
    if (!this.suportado) return;

    this.rec = new SR();
    this.rec.lang = opcoes.idioma || 'pt-BR';
    this.rec.continuous = false;
    this.rec.interimResults = false;
    this.rec.onresult = (ev) => {
      const texto = ev.results[0][0].transcript.trim().toLowerCase();
      const chave = Object.keys(this.comandos).find((c) => texto.includes(c));
      // O resultado SEMPRE volta como texto, reconhecido ou não (§68.5).
      this.aoResultado(texto, !!chave);
      if (chave) this.comandos[chave](texto);
    };
    this.rec.onend = () => { this.ouvindo = false; };
    this.rec.onerror = () => { this.ouvindo = false; };
  }

  ouvir() {
    if (!this.suportado || this.ouvindo) return this;
    this.ouvindo = true;
    try { this.rec.start(); } catch { this.ouvindo = false; }
    return this;
  }

  parar() {
    if (this.suportado && this.ouvindo) this.rec.stop();
    return this;
  }
}

/* =========================================================================
   §67.6 — ESTRELA DO USUÁRIO · §67.7 — CLIMA DO DIA
   Dois badges de contexto. Dados locais (IndexedDB/localStorage), sem rede:
   §67.7 registra que a API de clima é OPT-IN (§52) e que o fallback offline
   é o clima do negócio, determinístico.
   ========================================================================= */

export function estrelaDoUsuario(dados = {}) {
  const b = document.createElement('button');
  b.className = 'lum-estrela-usuario';
  b.type = 'button';
  b.innerHTML = '<span class="lum-eu-astro" aria-hidden="true"></span>' +
                '<span class="lum-eu-nome"></span>';
  b.querySelector('.lum-eu-nome').textContent = dados.nome || 'Você';
  b.setAttribute('aria-label',
    `Perfil de ${dados.nome || 'usuário'}` +
    (dados.nivel ? `, nível ${dados.nivel}` : '') +
    (dados.plano ? `, plano ${dados.plano}` : ''));
  return b;
}

export function climaDoDia(estado = {}) {
  const el = document.createElement('span');
  el.className = 'lum-clima';
  // §35 item 3: ícone + texto, nunca só a cor.
  const icones = { bom: '☀', neutro: '☁', atencao: '⛈' };
  const chave = icones[estado.tipo] ? estado.tipo : 'neutro';
  el.innerHTML = '<span aria-hidden="true"></span><span class="lum-clima-txt"></span>';
  el.firstElementChild.textContent = icones[chave];
  el.querySelector('.lum-clima-txt').textContent = estado.texto || 'dia estável';
  el.dataset.tipo = chave;
  return el;
}
