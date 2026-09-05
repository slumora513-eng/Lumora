/* ==========================================================================
   Lumora — NAVEGAÇÃO EM BOLHAS (§65.3) e EM ONDAS (§66)
   Aprovadas pelo Fundador em 01/09/2026; código liberado em 05/09/2026.

   §66.3 — qual vale quando:
     padrão do sistema / tema Elio  -> BOLHAS
     tema Aurora (ou IA Aurora ativa) -> ONDAS
   O usuário escolhe o tema; a navegação acompanha o tema.

   §65.3 — "Não há menu lateral sólido." Há uma bolha-âncora no canto superior
   esquerdo que expande num mapa mental. Ao focar uma aba, as irmãs ESTOURAM;
   ao fechar, voltam a orbitar.

   §65.3 — A REGRA DO GEOMÉTRICO x BOLHA, que este módulo respeita:
   "o que precisa ser forma geométrica é; o que não precisa, é bolha
   translúcida". Campos, tabelas e inputs nunca viram bolha (tokens.css).

   ACESSIBILIDADE (§65.3 e §66.2), tratada como requisito e não como extra:
   Esc fecha; foco visível; leitor de tela anuncia a hierarquia; teclado
   completo (setas, Enter, Esc); prefers-reduced-motion reduz a expansão e a
   varredura a fade simples, e o fallback funcional é a listagem em bolhas.
   §35 item 4: nenhum gesto de arrastar é obrigatório.
   ========================================================================== */

'use strict';

export class Navegacao {
  /**
   * @param {object} opcoes
   * @param {Array}  opcoes.abas   [{ id, rotulo, sub: [{ id, rotulo }] }]
   * @param {'elio'|'aurora'} [opcoes.tema='elio']
   * @param {HTMLElement} [opcoes.raiz=document.body]
   * @param {Function} [opcoes.aoEscolher]  (aba, sub|null) => void
   */
  constructor(opcoes) {
    if (!Array.isArray(opcoes?.abas) || !opcoes.abas.length) {
      throw new TypeError('Navegacao exige `abas` com ao menos um item.');
    }
    this.abas = opcoes.abas;
    this.tema = opcoes.tema === 'aurora' ? 'aurora' : 'elio';
    this.raiz = opcoes.raiz || document.body;
    this.aoEscolher = opcoes.aoEscolher || (() => {});

    this.aberto = false;
    this.abaFocada = null;
    this.indice = 0;
    this._acumuloScroll = 0;

    this.movimentoReduzido = typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._montar();
  }

  /* ---------------------------------------------------------------- montar */

  _montar() {
    // A bolha-âncora: canto superior esquerdo (§65.3)
    this.ancora = document.createElement('button');
    this.ancora.className = 'lum-ancora lum-bolha';
    this.ancora.setAttribute('aria-expanded', 'false');
    this.ancora.setAttribute('aria-haspopup', 'menu');
    this.ancora.setAttribute('aria-label', 'Abrir navegação');
    this.ancora.innerHTML = '<span class="lum-ancora-nucleo" aria-hidden="true"></span>';
    this.ancora.addEventListener('click', () => this.alternar());

    this.painel = document.createElement('div');
    this.painel.className = 'lum-nav';
    this.painel.dataset.modo = this.tema === 'aurora' ? 'ondas' : 'bolhas';
    this.painel.hidden = true;
    this.painel.setAttribute('role', 'menu');
    this.painel.setAttribute('aria-label', 'Navegação principal');

    this.raiz.append(this.ancora, this.painel);

    this._onTecla = (ev) => this._tecla(ev);
    this._onForaClique = (ev) => {
      if (!this.aberto) return;
      if (!this.painel.contains(ev.target) && ev.target !== this.ancora
          && !this.ancora.contains(ev.target)) this.fechar();
    };
    this._onRoda = (ev) => this._roda(ev);

    document.addEventListener('keydown', this._onTecla);
    document.addEventListener('pointerdown', this._onForaClique);
    this.painel.addEventListener('wheel', this._onRoda, { passive: false });
  }

  /* ---------------------------------------------------------------- estado */

  alternar() { return this.aberto ? this.fechar() : this.abrir(); }

  abrir() {
    if (this.aberto) return this;
    this.aberto = true;
    this.abaFocada = null;
    this.indice = 0;
    this._acumuloScroll = 0;
    this.painel.hidden = false;
    this.ancora.setAttribute('aria-expanded', 'true');
    this.ancora.setAttribute('aria-label', 'Fechar navegação');
    this._render();
    // O foco entra no menu: quem navega por teclado chega junto.
    const primeiro = this.painel.querySelector('[role="menuitem"]');
    primeiro?.focus({ preventScroll: true });
    return this;
  }

  fechar() {
    if (!this.aberto) return this;
    this.aberto = false;
    this.abaFocada = null;
    this.painel.hidden = true;
    this.painel.replaceChildren();
    this.ancora.setAttribute('aria-expanded', 'false');
    this.ancora.setAttribute('aria-label', 'Abrir navegação');
    this.ancora.focus({ preventScroll: true });
    return this;
  }

  /** §66.3 — a navegação acompanha o tema. */
  definirTema(tema) {
    this.tema = tema === 'aurora' ? 'aurora' : 'elio';
    this.painel.dataset.modo = this.tema === 'aurora' ? 'ondas' : 'bolhas';
    if (this.aberto) this._render();
    return this;
  }

  /* --------------------------------------------------------------- teclado */

  _tecla(ev) {
    if (!this.aberto) return;
    switch (ev.key) {
      case 'Escape':
        ev.preventDefault();
        // Esc volta um nível: da sub-navegação para as irmãs; depois fecha.
        if (this.abaFocada) { this.abaFocada = null; this._render(); }
        else this.fechar();
        break;
      case 'ArrowRight': case 'ArrowDown':
        ev.preventDefault(); this._mover(1); break;
      case 'ArrowLeft': case 'ArrowUp':
        ev.preventDefault(); this._mover(-1); break;
      case 'Home':
        ev.preventDefault(); this.indice = 0; this._render(true); break;
      case 'End':
        ev.preventDefault(); this.indice = this._lista().length - 1; this._render(true); break;
    }
  }

  _lista() {
    return this.abaFocada ? (this.abaFocada.sub || []) : this.abas;
  }

  _mover(passo) {
    const n = this._lista().length;
    if (!n) return;
    this.indice = (this.indice + passo + n) % n;
    this._render(true);
  }

  /** §66.1 — "o scroll do mouse percorre as abas ao longo da crista".
   *  Vale só no modo ondas; nas bolhas o scroll é da página. */
  _roda(ev) {
    if (this.tema !== 'aurora' || !this.aberto) return;
    ev.preventDefault();
    this._acumuloScroll += ev.deltaY;
    // Limiar evita que um toque de trackpad pule várias abas de uma vez.
    const limiar = 60;
    while (Math.abs(this._acumuloScroll) >= limiar) {
      const dir = Math.sign(this._acumuloScroll);
      this._acumuloScroll -= dir * limiar;
      this._mover(dir);
    }
  }

  /* ---------------------------------------------------------------- render */

  _render(manterFoco = false) {
    this.painel.replaceChildren();
    if (this.tema === 'aurora') this._renderOndas();
    else this._renderBolhas();
    if (manterFoco) {
      this.painel.querySelectorAll('[role="menuitem"]')[this.indice]
        ?.focus({ preventScroll: true });
    }
  }

  /* --- §65.3 — mapa mental de bolhas orbitando ---------------------------- */

  _renderBolhas() {
    const itens = this._lista();
    const centro = document.createElement('div');
    centro.className = 'lum-mapa';

    // A bolha grande do centro: o contexto atual.
    const nucleo = document.createElement('div');
    nucleo.className = 'lum-mapa-nucleo lum-bolha';
    nucleo.setAttribute('aria-hidden', 'true');
    nucleo.textContent = this.abaFocada ? this.abaFocada.rotulo : 'Lumora';
    centro.appendChild(nucleo);

    // Trilha de volta (§68.3, Fio de Ariadne) quando há aba focada
    if (this.abaFocada) {
      const voltar = document.createElement('button');
      voltar.className = 'lum-voltar lum-botao';
      voltar.textContent = '← todas as abas';
      voltar.addEventListener('click', () => {
        this.abaFocada = null; this.indice = 0; this._render(true);
      });
      centro.appendChild(voltar);
    }

    // As bolhas pequenas orbitando (§65.3)
    const N = itens.length;
    itens.forEach((item, i) => {
      const ang = (i / N) * Math.PI * 2 - Math.PI / 2;
      const b = document.createElement('button');
      b.className = 'lum-orbe lum-bolha';
      b.setAttribute('role', 'menuitem');
      b.tabIndex = i === this.indice ? 0 : -1;
      b.textContent = item.rotulo;
      b.style.setProperty('--x', `${Math.cos(ang) * 42}%`);
      b.style.setProperty('--y', `${Math.sin(ang) * 42}%`);
      b.style.setProperty('--atraso', `${i * 45}ms`);
      if (i === this.indice) b.classList.add('lum-orbe--foco');

      // O leitor de tela anuncia a hierarquia (§65.3)
      if (!this.abaFocada && item.sub?.length) {
        b.setAttribute('aria-haspopup', 'menu');
        b.setAttribute('aria-label',
          `${item.rotulo}, ${item.sub.length} sub-abas`);
      }

      b.addEventListener('click', () => this._escolher(item, i));
      b.addEventListener('focus', () => { this.indice = i; });
      centro.appendChild(b);
    });

    this.painel.appendChild(centro);
  }

  /* --- §66 — a onda que atravessa a tela --------------------------------- */

  _renderOndas() {
    const itens = this._lista();
    const nivel2 = !!this.abaFocada;
    // §66.2: amplitude 64px no nível 1, 34px nas mini-ondas;
    //        step 240px / 150px.
    const amplitude = nivel2 ? 34 : 64;
    const step = nivel2 ? 150 : 240;

    const crista = document.createElement('div');
    crista.className = 'lum-crista';
    if (nivel2) crista.classList.add('lum-crista--mini');

    if (nivel2) {
      const voltar = document.createElement('button');
      voltar.className = 'lum-voltar lum-botao';
      voltar.textContent = `← ${this.abaFocada.rotulo}`;   // §66.1: breadcrumb
      voltar.addEventListener('click', () => {
        this.abaFocada = null; this.indice = 0; this._render(true);
      });
      this.painel.appendChild(voltar);
    }

    const N = itens.length;
    itens.forEach((item, i) => {
      // §66.2 — crista senoidal: y = sin(i/N · 2π) · amplitude
      const y = Math.sin((i / N) * Math.PI * 2) * amplitude;
      const x = (i - this.indice) * step;

      const b = document.createElement('button');
      b.className = 'lum-crista-item';
      b.setAttribute('role', 'menuitem');
      b.tabIndex = i === this.indice ? 0 : -1;
      b.textContent = item.rotulo;
      // Só transform e opacity — nada de layout (§66.2), para 60fps.
      b.style.setProperty('--x', `${x}px`);
      b.style.setProperty('--y', `${y}px`);
      b.style.setProperty('--atraso', `${Math.min(Math.abs(i - this.indice), 6) * 40}ms`);
      if (i === this.indice) b.classList.add('lum-crista-item--foco');
      // Fora da tela não é anunciado como se estivesse visível.
      if (Math.abs(i - this.indice) > 3) b.setAttribute('aria-hidden', 'true');

      if (!nivel2 && item.sub?.length) {
        b.setAttribute('aria-haspopup', 'menu');
        b.setAttribute('aria-label', `${item.rotulo}, ${item.sub.length} sub-funções`);
      }

      b.addEventListener('click', () => this._escolher(item, i));
      b.addEventListener('focus', () => { this.indice = i; this._render(); });
      crista.appendChild(b);
    });

    this.painel.appendChild(crista);
  }

  /* -------------------------------------------------------------- escolha */

  _escolher(item, i) {
    this.indice = i;
    // §65.3/§66.1: ao focar uma aba, as irmãs estouram (bolhas) ou somem
    // (ondas) e abrem as sub-abas. Sem sub-abas, executa direto.
    if (!this.abaFocada && item.sub?.length) {
      this.abaFocada = item;
      this.indice = 0;
      this._render(true);
      return;
    }
    const aba = this.abaFocada || item;
    const sub = this.abaFocada ? item : null;
    this.aoEscolher(aba, sub);
    this.fechar();
  }

  destruir() {
    document.removeEventListener('keydown', this._onTecla);
    document.removeEventListener('pointerdown', this._onForaClique);
    this.painel.removeEventListener('wheel', this._onRoda);
    this.ancora.remove();
    this.painel.remove();
  }
}
