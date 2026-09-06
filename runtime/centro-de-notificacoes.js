/* ==========================================================================
   Lumora — CENTRO DE NOTIFICAÇÕES (§69.6, primeiro item)
   "Histórico pesquisável dentro da Nebulosa de Ações (Ctrl+K); filtro por
    tipo + ação direta (Resolver, Abrir, Adiar)."

   Aprovado em design na §69.6; a §69.7 registrava a priorização como EM
   ABERTO, e o "pode fazer tudo" do Fundador (05/09/2026) liberou o código.

   O Centro é a outra metade do contador "+3" que a §69.5 já tinha: sem ele, o
   excesso de notificação simplesmente sumia, e o botão que dizia "abrir o
   Centro" não abria nada.

   Duas decisões de acessibilidade que não são enfeite:

   - A LISTA É UM `<ul>` DE VERDADE, e cada ação é `<button>`. Um painel de
     histórico é onde se navega mais por teclado, não menos.
   - O FOCO É CAPTURADO E DEVOLVIDO. Painel modal que solta o foco no `<body>`
     manda quem navega por teclado para o começo do documento sem aviso — é a
     mesma regra que o Atlas Estelar já segue.
   ========================================================================== */

'use strict';

import { estadoVivo } from './estados-vivos.js';
import { ADIAMENTOS } from './notificacoes-vivas.js';

const ROTULOS = {
  fiscal: 'Fiscal', pedido: 'Pedido', sistema: 'Sistema', seguranca: 'Segurança',
  lgpd: 'LGPD', pagamento: 'Pagamento', entrega: 'Entrega', venda: 'Venda',
};

const ESTADOS = {
  nova: 'não lida', aberta: 'aberta', resolvida: 'resolvida',
  adiada: 'adiada', expirada: 'expirou',
};

export class CentroDeNotificacoes {
  /**
   * @param {import('./notificacoes-vivas.js').NotificacoesVivas} notificacoes
   * @param {object} [opcoes]
   * @param {HTMLElement} [opcoes.raiz=document.body]
   */
  constructor(notificacoes, opcoes = {}) {
    if (!notificacoes) throw new TypeError('O Centro precisa das Notificações Vivas');
    this.notificacoes = notificacoes;
    this.raiz = opcoes.raiz || document.body;
    this.aberto = false;
    this._devolverFoco = null;
    this._montar();

    // §69.5: o contador "+3" abre o Centro. O evento já era despachado; o
    // ouvinte é que faltava.
    this._onAbrirCentro = () => this.abrir();
    this.raiz.addEventListener('lum:abrir-centro', this._onAbrirCentro);
  }

  _montar() {
    const el = document.createElement('div');
    el.className = 'lum-centro';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Centro de Notificações');
    el.innerHTML = `
      <div class="lum-centro-topo">
        <h2 class="lum-centro-titulo">Centro de Notificações</h2>
        <button type="button" class="lum-botao lum-centro-fechar" aria-label="Fechar o Centro">Fechar</button>
      </div>
      <div class="lum-centro-filtros">
        <label class="lum-centro-campo">
          <span>Buscar</span>
          <input type="search" class="lum-campo lum-centro-busca" placeholder="texto ou categoria">
        </label>
        <label class="lum-centro-campo">
          <span>Tipo</span>
          <select class="lum-campo lum-centro-tipo"><option value="">todos</option></select>
        </label>
      </div>
      <p class="lum-centro-resumo" aria-live="polite"></p>
      <ul class="lum-centro-lista"></ul>`;

    this.el = el;
    this.elBusca = el.querySelector('.lum-centro-busca');
    this.elTipo = el.querySelector('.lum-centro-tipo');
    this.elLista = el.querySelector('.lum-centro-lista');
    this.elResumo = el.querySelector('.lum-centro-resumo');

    for (const [valor, rotulo] of Object.entries(ROTULOS)) {
      const o = document.createElement('option');
      o.value = valor; o.textContent = rotulo;
      this.elTipo.appendChild(o);
    }

    el.querySelector('.lum-centro-fechar').addEventListener('click', () => this.fechar());
    this.elBusca.addEventListener('input', () => this.render());
    this.elTipo.addEventListener('change', () => this.render());
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { ev.stopPropagation(); this.fechar(); }
    });

    this.raiz.appendChild(el);
  }

  /* ------------------------------------------------------------- abertura */

  abrir() {
    if (this.aberto) return this;
    this._devolverFoco = document.activeElement;
    this.aberto = true;
    this.el.hidden = false;
    this.render();
    this.elBusca.focus();
    return this;
  }

  fechar() {
    if (!this.aberto) return this;
    this.aberto = false;
    this.el.hidden = true;
    // Quem entra com foco aqui dentro sai com foco de onde entrou.
    this._devolverFoco?.focus?.();
    this._devolverFoco = null;
    return this;
  }

  alternar() { return this.aberto ? this.fechar() : this.abrir(); }

  /* --------------------------------------------------------------- render */

  render() {
    const linhas = this.notificacoes.buscar({
      texto: this.elBusca.value,
      categoria: this.elTipo.value || undefined,
    });

    const resumo = this.notificacoes.resumoEmConstelacao();
    this.elResumo.textContent = `${resumo.texto} · ${linhas.length} na lista.`;

    this.elLista.replaceChildren();
    if (!linhas.length) {
      const vazio = document.createElement('li');
      vazio.className = 'lum-centro-vazio';
      // A tela vazia do Centro é a mesma tela vazia do resto do sistema
      // (§72.1 item 1) — não uma frase solta escrita aqui.
      estadoVivo(vazio, { estado: this.elBusca.value ? 'semResultado' : 'vazio' });
      this.elLista.appendChild(vazio);
      return this;
    }

    for (const h of linhas) this.elLista.appendChild(this._linha(h));
    return this;
  }

  _linha(h) {
    const li = document.createElement('li');
    li.className = 'lum-centro-linha';
    li.dataset.categoria = h.categoria;
    li.dataset.estado = h.estado;

    const cab = document.createElement('p');
    cab.className = 'lum-centro-cab';
    // O estado entra como TEXTO, não só como cor da linha (§35 item 3).
    cab.textContent = `${ROTULOS[h.categoria] || 'Sistema'} · ${ESTADOS[h.estado] || h.estado} · ${hora(h.em)}`;

    const texto = document.createElement('p');
    texto.className = 'lum-centro-texto';
    texto.textContent = h.texto || '';

    const acoes = document.createElement('div');
    acoes.className = 'lum-centro-acoes';

    const naTela = this.notificacoes.visiveis.some((n) => n.dados.id === h.id)
      || this.notificacoes.fila.some((d) => d.id === h.id);
    const encerrada = h.estado === 'resolvida' || h.estado === 'expirada';

    acoes.appendChild(this._botao('Abrir', () => {
      this.el.dispatchEvent(new CustomEvent('lum:centro-abrir-item', { detail: h, bubbles: true }));
      this.notificacoes._registrar({ id: h.id }, 'aberta');
      this.render();
    }));

    if (!encerrada) {
      acoes.appendChild(this._botao('Resolver', () => {
        this.notificacoes.resolver(h.id);
        this.render();
      }));
    }

    // §69.3: crítica não adia, nem daqui. E adiar só faz sentido para o que
    // ainda está de pé.
    if (naTela && h.urgencia !== 'critica') {
      for (const [chave, a] of Object.entries(ADIAMENTOS)) {
        const b = this._botao(a.rotulo, () => { this.notificacoes.adiar(h.id, chave); this.render(); });
        b.setAttribute('aria-label', `Adiar "${h.texto}" por ${a.rotulo.toLowerCase()}`);
        acoes.appendChild(b);
      }
    }

    li.append(cab, texto, acoes);
    return li;
  }

  _botao(rotulo, aoClicar) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lum-botao lum-centro-acao';
    b.textContent = rotulo;
    b.addEventListener('click', aoClicar);
    return b;
  }

  /** Ação para pendurar na Nebulosa de Ações (§67.1), que é o Ctrl+K da §69.6. */
  comoAcaoDaNebulosa() {
    return { id: 'centro-notificacoes', rotulo: 'Centro de Notificações', executar: () => this.abrir() };
  }

  destruir() {
    this.raiz.removeEventListener('lum:abrir-centro', this._onAbrirCentro);
    this.el.remove();
  }
}

function hora(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
