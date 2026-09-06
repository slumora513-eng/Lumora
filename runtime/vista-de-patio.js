/* ==========================================================================
   Lumora — VISTA DE PÁTIO (§65.4, criatividade 3 da §61)

   §65.4, verbatim: "Ao clicar em 'Vista de Pátio', a interface gira (rotação
   3D suave) e faz zoom de distância, revelando o título 'Veja o seu negócio
   inteiro'. Em seguida abre a dashboard panorâmica — como o negócio está, o
   que poderia mudar, etc. — dentro de uma bolha. É a visão-geral do sistema,
   com entrada dramática e retorno ao girar de volta."

   Os quatro tempos estão aqui: gira, afasta, anuncia, abre — e desfaz na
   ordem inversa. O que este módulo NÃO faz é a dashboard: "como o negócio
   está, o que poderia mudar" é conteúdo de produto, e este repositório não
   tem negócio nenhum. A bolha recebe o painel que quem integra entrega.

   TRÊS COISAS QUE O MÓDULO IMPÕE, EM VEZ DE CONFIAR EM QUEM USA:

   1. ENTRADA DRAMÁTICA NÃO PODE SER O ÚNICO CAMINHO. Com
      `prefers-reduced-motion` a rotação não acontece — mas a Vista abre
      igual, com o título e o painel no lugar. §35 item 8: reduz gesto, nunca
      informação. Mesma coisa no nível básico da §36.
   2. O FOCO ENTRA E VOLTA. A Vista é modal; quem abre com teclado entra nela
      e volta para o botão que abriu. É a mesma regra do Atlas e do Centro.
   3. O TÍTULO É TEXTO, NÃO PIXEL. "Veja o seu negócio inteiro" é `<h2>` de
      verdade, e a bolha é `role="dialog"` rotulada por ele.

   Meio: Web Animations API + CSS 3D nas superfícies — que é exatamente o que
   a §65.5 reserva para o CSS ("apenas superfícies e microinterações").
   ========================================================================== */

'use strict';

/** §65.4, verbatim. Não é microtexto de agente. */
export const TITULO = 'Veja o seu negócio inteiro';

/* (AGENTE — a §65.4 diz "rotação 3D suave" e "zoom de distância" e não fixa
   ângulo, distância nem duração.) */
const GIRO_GRAUS = 14;
const AFASTAMENTO = 0.86;
const DURACAO = 720;
const EASE = 'cubic-bezier(.22, 1, .36, 1)';

export class VistaDePatio {
  /**
   * @param {object} [opcoes]
   * @param {HTMLElement} [opcoes.cena=document.body]  o que gira e se afasta
   * @param {HTMLElement} [opcoes.raiz=document.body]  onde a bolha nasce
   * @param {string} [opcoes.nivel='pleno']  §36
   */
  constructor(opcoes = {}) {
    this.cena = opcoes.cena || document.body;
    this.raiz = opcoes.raiz || document.body;
    this.nivel = opcoes.nivel || 'pleno';
    this.aberta = false;
    this._devolverFoco = null;
    this.movimentoReduzido = typeof matchMedia === 'function'
      && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._montar();
  }

  /** A cena gira? Só quando há gesto a gastar. */
  get comGesto() { return !this.movimentoReduzido && this.nivel !== 'basico'; }

  _montar() {
    const bolha = document.createElement('div');
    bolha.className = 'lum-patio';
    bolha.hidden = true;
    bolha.setAttribute('role', 'dialog');
    bolha.setAttribute('aria-modal', 'true');
    bolha.setAttribute('aria-labelledby', 'lum-patio-titulo');
    bolha.innerHTML = `
      <h2 class="lum-patio-titulo" id="lum-patio-titulo" tabindex="-1"></h2>
      <div class="lum-patio-painel"></div>
      <button type="button" class="lum-botao lum-patio-voltar">Voltar</button>`;
    bolha.querySelector('.lum-patio-titulo').textContent = TITULO;

    this.el = bolha;
    this.elTitulo = bolha.querySelector('.lum-patio-titulo');
    this.elPainel = bolha.querySelector('.lum-patio-painel');
    bolha.querySelector('.lum-patio-voltar').addEventListener('click', () => this.fechar());
    bolha.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { ev.stopPropagation(); this.fechar(); }
    });
    this.raiz.appendChild(bolha);
  }

  /**
   * Abre a Vista de Pátio.
   * @param {HTMLElement|Node} [painel]  a dashboard panorâmica de quem integra
   * @returns {Promise<VistaDePatio>}
   */
  async abrir(painel) {
    if (this.aberta) return this;
    this.aberta = true;
    this._devolverFoco = document.activeElement;

    if (painel instanceof Node) this.elPainel.replaceChildren(painel);
    this.el.hidden = false;
    this.cena.dataset.lumPatio = 'aberta';

    // 1 e 2 — a interface gira e se afasta. Só o gesto; a informação não
    // depende dele em momento nenhum.
    if (this.comGesto) await this._girar(false);

    // 3 e 4 — o título e a bolha. O foco vai para o título, que é o que
    // nomeia a Vista para quem chega por teclado ou leitor de tela.
    this.elTitulo.focus({ preventScroll: true });
    this.el.dispatchEvent(new CustomEvent('lum:patio-aberto', { bubbles: true }));
    return this;
  }

  /** "Retorno ao girar de volta" (§65.4). */
  async fechar() {
    if (!this.aberta) return this;
    this.aberta = false;
    this.el.hidden = true;
    if (this.comGesto) await this._girar(true);
    delete this.cena.dataset.lumPatio;
    this._devolverFoco?.focus?.();
    this._devolverFoco = null;
    this.el.dispatchEvent(new CustomEvent('lum:patio-fechado', { bubbles: true }));
    return this;
  }

  alternar(painel) { return this.aberta ? this.fechar() : this.abrir(painel); }

  _girar(voltando) {
    const longe = `perspective(1400px) rotateY(${GIRO_GRAUS}deg) rotateX(3deg) scale(${AFASTAMENTO})`;
    const perto = 'perspective(1400px) rotateY(0deg) rotateX(0deg) scale(1)';
    const quadros = voltando
      ? [{ transform: longe }, { transform: perto }]
      : [{ transform: perto }, { transform: longe }];
    if (typeof this.cena.animate !== 'function') {
      this.cena.style.transform = voltando ? '' : longe;
      return Promise.resolve();
    }
    const a = this.cena.animate(quadros, { duration: DURACAO, easing: EASE, fill: 'forwards' });
    return a.finished.catch(() => {}).then(() => {
      if (voltando) { a.cancel(); this.cena.style.transform = ''; }
    });
  }

  destruir() {
    this.cena.style.transform = '';
    delete this.cena.dataset.lumPatio;
    this.el.remove();
  }
}
