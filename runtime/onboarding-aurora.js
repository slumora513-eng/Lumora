/* ==========================================================================
   Lumora — ONBOARDING NARRADO PELA AURORA (§72.1 item 6, APROVADO pelo
   Fundador em 02/09/2026)

   A §68.6 listava isto como ideia futura: "a Aurora narra a primeira
   configuração em voz + texto paralelo, respeitando a regra dos 10s (§16)".
   A §72.1 item 6 promoveu a ideia a função aprovada. Este é o código dela.

   AS DUAS REGRAS QUE MANDAM AQUI, E QUE O MÓDULO NÃO DELEGA:

   1. §68.7 — "Voz nunca é o único canal (texto em paralelo)."
      A narração é enfeite; o texto é a informação. Se `speechSynthesis` não
      existir, se a pessoa silenciar, se a voz falhar no meio — o onboarding
      funciona igual. Nada do que a Aurora fala deixa de estar escrito.
      Por isso a fala sai de `speechSynthesis` lendo o MESMO nó de texto que
      está na tela, e não de um roteiro paralelo que poderia divergir dele.

   2. §16 — A REGRA DOS 10s. "O botão de aceite só libera após 10 segundos de
      espera. O sistema registra data, hora e versão dos termos aceitos."
      Os 10 segundos são de espera real: o botão nasce desabilitado, mostra o
      tempo que falta, e a contagem NÃO é acelerável por clique, por Enter nem
      por trocar de passo e voltar. Aceitar depressa é exatamente o que a
      regra existe para impedir.

   Zero rede, zero asset, zero dependência: a voz é a nativa do sistema
   operacional (Web Speech), a mesma escolha que a §68.5 já fez para os
   Comandos de Voz — "nativo, offline".
   ========================================================================== */

'use strict';

import { SotaqueCosmico } from './sotaque-cosmico.js';

/** §16: o aceite só libera depois disto. Não é configurável de fora. */
export const ESPERA_DOS_TERMOS_MS = 10000;

/**
 * Roteiro padrão. Os NOMES dos passos são do Guia — "Criando o seu novo
 * mundo" é o título da §2 e "Otimizando o sistema para você" o da §36, ambos
 * verbatim. As FALAS são deste agente (AGENTE), no tom que a §1 descreve para
 * a Aurora: guardiã, calorosa, nunca infantil.
 */
export const ROTEIRO_PADRAO = [
  {
    id: 'boas-vindas',
    titulo: 'Bem-vindo à Lumora',
    fala: 'Eu sou a Aurora. Vou ficar com você nesta primeira configuração — '
        + 'são quatro passos, e você pode voltar em qualquer um deles.',
  },
  {
    id: 'nicho',
    titulo: 'Criando o seu novo mundo',        // §2, título verbatim
    fala: 'Primeiro o seu ramo. É com ele que a Lumora escolhe os nomes dos '
        + 'módulos, as etapas do fluxo e os campos que você vai ver todo dia. '
        + 'Trocar de ramo depois é ilimitado e gratuito.',
  },
  {
    id: 'otimizar',
    titulo: 'Otimizando o sistema para você',  // §36, título verbatim
    fala: 'Agora eu meço este aparelho aqui mesmo, sem mandar nada para lugar '
        + 'nenhum, e escolho o nível de efeitos que ele aguenta sem engasgar. '
        + 'Se sobrar fôlego depois, eu subo sozinha.',
  },
  {
    id: 'termos',
    titulo: 'Como eu e o Elio falamos com você',
    termos: true,                              // §16: aqui vale a regra dos 10s
    fala: 'Eu e o Elio temos personalidade forte: eu sou calorosa, ele é '
        + 'direto e frio. Você pode desligar isso nas configurações quando '
        + 'quiser, e nós dois passamos a falar no tom neutro. Leia com calma — '
        + 'o botão de aceite libera em dez segundos.',
  },
];

export class OnboardingAurora {
  /**
   * @param {HTMLElement} raiz
   * @param {object} [opcoes]
   * @param {Array}  [opcoes.roteiro=ROTEIRO_PADRAO]
   * @param {string} [opcoes.idioma='pt-BR']
   * @param {string} [opcoes.versaoDosTermos='v3']  §16 registra a versão aceita
   * @param {boolean}[opcoes.voz=true]              narração ligada de saída
   * @param {Function}[opcoes.aoConcluir]  recebe o registro do aceite (§16)
   * @param {Function}[opcoes.anunciar]    canal aria-live de quem integra
   */
  constructor(raiz, opcoes = {}) {
    if (!raiz) throw new TypeError('OnboardingAurora precisa de um elemento raiz');
    this.raiz = raiz;
    this.roteiro = (opcoes.roteiro || ROTEIRO_PADRAO).slice();
    this.idioma = opcoes.idioma || 'pt-BR';
    this.versaoDosTermos = opcoes.versaoDosTermos || 'v3';
    this.aoConcluir = opcoes.aoConcluir;
    this.anunciar = opcoes.anunciar;
    this.sotaque = opcoes.sotaque || new SotaqueCosmico({ idioma: this.idioma });
    this.indice = 0;
    this.aceite = null;
    this.movimentoReduzido = typeof matchMedia === 'function'
      && matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.vozDisponivel = typeof speechSynthesis === 'object'
      && typeof SpeechSynthesisUtterance === 'function';
    this.voz = opcoes.voz !== false && this._lerPreferenciaDeVoz();

    this._liberadoEm = 0;      // quando o aceite liberou (ou 0)
    this._tickTermos = 0;

    this._montar();
    this._mostrar(0);
  }

  /* --------------------------------------------------------------- montagem */

  _montar() {
    const el = document.createElement('section');
    el.className = 'lum-onboarding';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'lum-onb-titulo');
    el.innerHTML = `
      <p class="lum-onb-quem"><span class="lum-onb-aurora" aria-hidden="true"></span>Aurora</p>
      <h2 class="lum-onb-titulo" id="lum-onb-titulo"></h2>
      <p class="lum-onb-fala" aria-live="polite"></p>
      <div class="lum-onb-corpo"></div>
      <div class="lum-onb-rodape">
        <button type="button" class="lum-botao lum-onb-voltar">Voltar</button>
        <p class="lum-onb-passo" aria-live="polite"></p>
        <button type="button" class="lum-botao lum-onb-avancar"></button>
      </div>
      <button type="button" class="lum-botao lum-onb-silenciar" aria-pressed="false"></button>`;

    this.el = el;
    this.elTitulo = el.querySelector('.lum-onb-titulo');
    this.elFala = el.querySelector('.lum-onb-fala');
    this.elCorpo = el.querySelector('.lum-onb-corpo');
    this.elPasso = el.querySelector('.lum-onb-passo');
    this.btVoltar = el.querySelector('.lum-onb-voltar');
    this.btAvancar = el.querySelector('.lum-onb-avancar');
    this.btSilenciar = el.querySelector('.lum-onb-silenciar');

    this.btVoltar.addEventListener('click', () => this.anterior());
    this.btAvancar.addEventListener('click', () => this.avancar());
    this.btSilenciar.addEventListener('click', () => this.definirVoz(!this.voz));
    this._rotularSilenciar();

    if (this.movimentoReduzido) el.dataset.lumMovimento = 'reduzido';
    this.raiz.appendChild(el);
  }

  /* ------------------------------------------------------------ navegação */

  _mostrar(i) {
    this.indice = Math.max(0, Math.min(i, this.roteiro.length - 1));
    const passo = this.roteiro[this.indice];
    const ultimo = this.indice === this.roteiro.length - 1;

    this.el.dataset.lumPasso = passo.id;
    this.elTitulo.textContent = passo.titulo;
    this.elFala.textContent = passo.fala;
    this.elCorpo.replaceChildren();
    if (typeof passo.montar === 'function') passo.montar(this.elCorpo, this);

    this.elPasso.textContent = `Passo ${this.indice + 1} de ${this.roteiro.length}`;
    this.btVoltar.disabled = this.indice === 0;
    this.btAvancar.textContent = ultimo ? 'Aceitar e começar' : 'Continuar';

    this._pararEspera();
    if (passo.termos) this._armarEspera();
    else this.btAvancar.disabled = false;

    // A fala sai DO MESMO NÓ que está na tela (§68.7): o que se ouve e o que
    // se lê não podem divergir, porque são a mesma string.
    this._falar(`${this.elTitulo.textContent}. ${this.elFala.textContent}`);
    this.elTitulo.setAttribute('tabindex', '-1');
    this.elTitulo.focus?.({ preventScroll: true });
    return passo;
  }

  avancar() {
    const passo = this.roteiro[this.indice];
    if (passo.termos) return this.aceitar();
    if (this.indice >= this.roteiro.length - 1) return this.aceitar();
    this._mostrar(this.indice + 1);
    return null;
  }

  anterior() {
    if (this.indice === 0) return this;
    this._mostrar(this.indice - 1);
    return this;
  }

  /* ---------------------------------------------------- §16, a regra dos 10s */

  /** Arma a espera obrigatória. Se já foi cumprida uma vez nesta sessão do
   *  onboarding, não reinicia — a regra é esperar dez segundos lendo, não
   *  esperar dez segundos toda vez que se volta um passo. */
  _armarEspera() {
    if (this._liberadoEm) { this.btAvancar.disabled = false; this._rotularAceite(0); return; }
    const inicio = Date.now();
    this.btAvancar.disabled = true;
    const tick = () => {
      const falta = Math.max(0, ESPERA_DOS_TERMOS_MS - (Date.now() - inicio));
      this._rotularAceite(falta);
      if (falta > 0) return;
      this._pararEspera();
      this._liberadoEm = Date.now();
      this.btAvancar.disabled = false;
      this.anunciar?.('O botão de aceite está liberado.', 'polite');
    };
    tick();
    this._tickTermos = setInterval(tick, 250);
  }

  _pararEspera() {
    if (this._tickTermos) clearInterval(this._tickTermos);
    this._tickTermos = 0;
  }

  _rotularAceite(faltaMs) {
    const s = Math.ceil(faltaMs / 1000);
    this.btAvancar.textContent = s > 0 ? `Aceitar e começar (${s}s)` : 'Aceitar e começar';
    // O tempo restante não pode ser só o número mudando dentro do botão: um
    // leitor de tela não repete o rótulo de um botão desabilitado.
    this.btAvancar.setAttribute('aria-label', s > 0
      ? `Aceitar e começar. Disponível em ${s} segundos.`
      : 'Aceitar e começar.');
  }

  /**
   * Conclui. §16: "O sistema registra data, hora e versão dos termos aceitos."
   * O registro é DEVOLVIDO, não gravado: onde ele mora é decisão do produto
   * (auditoria append-only, §37), e inventar um destino aqui seria inventar
   * infraestrutura que este repositório não tem.
   *
   * @returns {{aceitoEm: string, versao: string, esperaCumpridaMs: number}|null}
   */
  aceitar() {
    const passo = this.roteiro[this.indice];
    if (passo.termos && this.btAvancar.disabled) return null;   // ainda na espera
    this.aceite = {
      aceitoEm: new Date().toISOString(),
      versao: this.versaoDosTermos,
      esperaCumpridaMs: ESPERA_DOS_TERMOS_MS,
      idioma: this.idioma,
    };
    this._calar();
    this.el.dispatchEvent(new CustomEvent('lum:onboarding-concluido', {
      detail: this.aceite, bubbles: true,
    }));
    this.aoConcluir?.(this.aceite);
    return this.aceite;
  }

  /* ------------------------------------------------------------------ voz */

  /** @param {boolean} ligada */
  definirVoz(ligada) {
    this.voz = !!ligada && this.vozDisponivel;
    try { localStorage.setItem('lum:onboarding-voz', this.voz ? '1' : '0'); } catch { /* privado */ }
    this._rotularSilenciar();
    if (!this.voz) this._calar();
    else this._falar(`${this.elTitulo.textContent}. ${this.elFala.textContent}`);
    return this;
  }

  _rotularSilenciar() {
    this.btSilenciar.hidden = !this.vozDisponivel;
    this.btSilenciar.textContent = this.voz ? 'Silenciar a narração' : 'Ouvir a narração';
    this.btSilenciar.setAttribute('aria-pressed', this.voz ? 'true' : 'false');
  }

  _lerPreferenciaDeVoz() {
    if (!this.vozDisponivel) return false;
    try {
      const v = localStorage.getItem('lum:onboarding-voz');
      return v === null ? true : v === '1';
    } catch { return true; }
  }

  _falar(texto) {
    if (!this.voz || !this.vozDisponivel || !texto) return false;
    try {
      this._calar();
      const f = new SpeechSynthesisUtterance(texto);
      f.lang = this.idioma;
      f.rate = 0.98;
      const voz = speechSynthesis.getVoices?.().find((v) => v.lang?.startsWith(this.idioma.slice(0, 2)));
      if (voz) f.voice = voz;
      speechSynthesis.speak(f);
      return true;
    } catch { return false; }   // sem voz o texto continua na tela: §68.7
  }

  _calar() {
    try { speechSynthesis?.cancel?.(); } catch { /* já calado */ }
  }

  destruir() {
    this._pararEspera();
    this._calar();
    this.el.remove();
  }
}
