/* ==========================================================================
   Lumora — NOTIFICAÇÕES VIVAS (§69)
   Aprovadas pelo Fundador em 02/09/2026 ("adorei tudo"); código liberado em
   05/09/2026.

   As notificações usam a identidade do tema:
     tema Elio   -> a bolha que nasce, flutua respirando e estoura (§69.1)
     tema Aurora -> a onda de luz que assenta em faixa e sai na ventania (§69.2)

   REGRA INEGOCIÁVEL (§69.3): avisos de segurança nunca são suprimidos —
   "mudam de roupa, nunca de comportamento". Por isso a classe CRÍTICA não tem
   timeout, não estoura e não é levada pela ventania em nenhum caminho de
   código, nem no Modo Foco, nem com movimento reduzido.

   Tudo procedural (Canvas/CSS/WebAudio), zero asset, zero custo (§69).
   ========================================================================== */

'use strict';

/** Hierarquia de urgência (§69.3). */
export const URGENCIA = {
  normal:      { some: true,  timeout: 10000, aria: 'polite' },
  alta:        { some: false, timeout: 0,     aria: 'polite' },
  critica:     { some: false, timeout: 0,     aria: 'assertive' },
  excepcional: { some: true,  timeout: 0,     aria: 'assertive' },
};

/** Categorias que forçam a classe crítica (§69.3). */
const CATEGORIAS_CRITICAS = new Set(['fiscal', 'seguranca', 'lgpd', 'pagamento']);

const MAX_VISIVEIS = 5;   // §69.5: máx. 4–5 visíveis; excesso vira contador

/* --------------------------------------------------------- §69.6, adiada --
   "Snooze cósmico — adiar 30 min / 1 h / amanhã."
   "amanhã" é 8h do dia seguinte, e não "daqui a 24 horas": adiar para amanhã
   às 3 da manhã não adia nada. (AGENTE — a §69.6 nomeia as três opções e não
   diz que horas é "amanhã".)                                               */
export const ADIAMENTOS = {
  trinta: { rotulo: '30 min', ms: () => 30 * 60000 },
  hora:   { rotulo: '1 h',    ms: () => 60 * 60000 },
  amanha: {
    rotulo: 'Amanhã',
    ms: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
      return Math.max(60000, d.getTime() - Date.now());
    },
  },
};

/** §69.6: "Ações rápidas na notificação — venda → 'Ver pedido'; fiscal →
 *  'Revisar rascunho'". Os dois rótulos são do Guia; os demais, AGENTE. */
export const ROTULOS_DE_ACAO = {
  venda:      'Ver pedido',        // GUIA §69.6
  pedido:     'Ver pedido',        // GUIA §69.6
  fiscal:     'Revisar rascunho',  // GUIA §69.6
  entrega:    'Acompanhar entrega',
  pagamento:  'Ver recebimento',
  seguranca:  'Revisar acesso',
  lgpd:       'Ver solicitação',
  sistema:    'Abrir',
};

const HISTORICO_MAX = 200;
const CHAVE_ADIADAS = 'lum:notificacoes-adiadas';

export class NotificacoesVivas {
  /**
   * @param {object} [opcoes]
   * @param {'elio'|'aurora'} [opcoes.tema='elio']
   * @param {HTMLElement} [opcoes.raiz=document.body]
   * @param {object} [opcoes.som]  instância de IdentidadeSonora (opcional)
   */
  constructor(opcoes = {}) {
    this.tema = opcoes.tema === 'aurora' ? 'aurora' : 'elio';
    this.raiz = opcoes.raiz || document.body;
    this.som = opcoes.som || null;
    this.fila = [];
    this.visiveis = [];
    this._seq = 0;
    this.movimentoReduzido = typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* §69.6 — itens de infraestrutura aprovados em design, cuja priorização a
       §69.7 registrava como EM ABERTO e que o "pode fazer tudo" do Fundador
       (05/09/2026) liberou. */
    this.historico = [];                 // Centro de Notificações
    this.acoesPorCategoria = new Map();  // ações rápidas registradas
    this.libras = new Map();             // §72.1 item 5 — ver registrarLibras()
    this._adiadas = new Map();           // id -> { timer, ate, dados }

    this._montarContainers();
    this._restaurarAdiadas();
  }

  _montarContainers() {
    // Órbita de notificação: canto superior DIREITO, longe do menu-bolha que
    // fica no canto esquerdo (§69.1). Nunca sobrepõe o conteúdo central.
    this.orbita = document.createElement('div');
    this.orbita.className = 'lum-orbita';
    this.orbita.setAttribute('role', 'region');
    this.orbita.setAttribute('aria-label', 'Notificações');

    // Faixa superior horizontal do tema Aurora (§69.2)
    this.faixa = document.createElement('div');
    this.faixa.className = 'lum-faixa-aurora';
    this.faixa.setAttribute('role', 'region');
    this.faixa.setAttribute('aria-label', 'Notificações');

    this.raiz.append(this.orbita, this.faixa);
    this._aplicarTema();
  }

  _aplicarTema() {
    this.orbita.hidden = this.tema !== 'elio';
    this.faixa.hidden = this.tema !== 'aurora';
  }

  /**
   * Troca o tema. §69.5: com notificações na tela, a troca TRANSFORMA sem
   * perda — bolhas se deformam em faixa, faixa se condensa em bolhas.
   */
  definirTema(tema) {
    const novo = tema === 'aurora' ? 'aurora' : 'elio';
    if (novo === this.tema) return this;
    const vivas = this.visiveis.map((n) => n.dados);
    for (const n of this.visiveis.slice()) this._remover(n, true);
    this.tema = novo;
    this._aplicarTema();
    for (const d of vivas) this.notificar(d);   // renascem na outra matéria
    return this;
  }

  /**
   * Publica uma notificação.
   *
   * @param {object} dados
   * @param {string} dados.texto
   * @param {'normal'|'alta'|'critica'|'excepcional'} [dados.urgencia='normal']
   * @param {string} [dados.categoria='sistema']  fiscal|pedido|sistema|seguranca|lgpd|pagamento
   * @param {string} [dados.valor]  dado sensível — mascarado por padrão (§69.5)
   * @param {Function} [dados.aoAbrir]
   */
  notificar(dados) {
    const d = { ...dados };
    d.categoria = d.categoria || 'sistema';
    // §69.3: categoria crítica manda na urgência, não o chamador.
    if (CATEGORIAS_CRITICAS.has(d.categoria)) d.urgencia = 'critica';
    d.urgencia = URGENCIA[d.urgencia] ? d.urgencia : 'normal';
    d.id = d.id || `lum-n${++this._seq}`;

    // §69.6 — Centro de Notificações: o histórico nasce aqui, e nasce mesmo
    // para a notificação que vai direto para a fila. Uma notificação que a
    // pessoa nunca viu é justamente a que ela precisa achar depois.
    this._registrar(d, 'nova');

    if (this.visiveis.length >= MAX_VISIVEIS) {
      this.fila.push(d);
      this._atualizarContador();
      return d.id;
    }
    this._mostrar(d);
    return d.id;
  }

  /* --------------------------------------------------------------- render */

  _mostrar(dados) {
    const el = this.tema === 'elio' ? this._bolha(dados) : this._onda(dados);
    const n = { dados, el, timer: 0 };
    this.visiveis.push(n);

    // §69.5: preview mascarado por padrão — dados sensíveis nunca expostos.
    // O texto do leitor de tela é o mesmo texto mascarado que está na tela.
    const regra = URGENCIA[dados.urgencia];
    el.setAttribute('aria-live', regra.aria);

    // Modo Foco / Respiração do Céu (§69.5): sem som e sem háptico; a bolha
    // nasce e se dissolve. As CRÍTICAS continuam.
    const foco = document.documentElement.dataset.lumFoco === 'true';
    const critica = dados.urgencia === 'critica';
    if (!foco || critica) {
      if (this.som) this.som.tocar(dados.categoria, dados.urgencia);
      if (navigator.vibrate && !this.movimentoReduzido) {
        try { navigator.vibrate(critica ? [20, 40, 20] : 20); } catch { /* ignora */ }
      }
    }

    // §69.3: só a classe normal some sozinha. Crítica NUNCA.
    if (regra.some && regra.timeout && !critica) {
      n.timer = setTimeout(() => {
        this._registrar(dados, 'expirada');   // sai da tela, fica no Centro
        this._remover(n);
      }, regra.timeout);
    }
    return n;
  }

  _bolha(dados) {
    const el = document.createElement('div');
    el.className = `lum-bolha-notif lum-u-${dados.urgencia}`;
    el.dataset.categoria = dados.categoria;
    el.tabIndex = 0;
    el.setAttribute('role', 'status');

    el.innerHTML = `
      <span class="lum-bolha-icone" aria-hidden="true"></span>
      <span class="lum-bolha-corpo">
        <span class="lum-bolha-cat"></span>
        <span class="lum-bolha-txt"></span>
      </span>`;
    el.querySelector('.lum-bolha-cat').textContent = rotuloCategoria(dados.categoria);
    el.querySelector('.lum-bolha-txt').textContent = textoMascarado(dados);

    const abrir = () => this._abrir(dados, el);
    el.addEventListener('click', abrir);
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrir(); }
    });
    this._enfeitar(el, dados);
    this.orbita.appendChild(el);
    return el;
  }

  _onda(dados) {
    const el = document.createElement('div');
    el.className = `lum-onda-notif lum-u-${dados.urgencia}`;
    el.dataset.categoria = dados.categoria;
    el.tabIndex = 0;
    el.setAttribute('role', 'status');
    el.innerHTML = `
      <span class="lum-onda-cat"></span>
      <span class="lum-onda-txt"></span>`;
    el.querySelector('.lum-onda-cat').textContent = rotuloCategoria(dados.categoria);
    el.querySelector('.lum-onda-txt').textContent = textoMascarado(dados);

    const abrir = () => this._abrir(dados, el);
    el.addEventListener('click', abrir);
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrir(); }
    });
    this._enfeitar(el, dados);
    this.faixa.appendChild(el);
    return el;
  }

  /* ------------------------------------ §69.6 ações rápidas · §72.1(5) Libras */

  /** Acrescenta à notificação o que as duas seções pedem, nas duas matérias. */
  _enfeitar(el, dados) {
    if (dados.urgencia === 'critica') {
      const libras = this._janelaDeLibras(dados);
      if (libras) el.appendChild(libras);
      // Ausência auditável: quem conferir a tela vê que a janela de Libras
      // não foi esquecida — ela está esperando a fonte (§72.1 item 5).
      else el.dataset.lumLibras = 'ausente';
    }
    const acoes = this._acoes(dados);
    if (acoes) el.appendChild(acoes);
  }

  /**
   * Ações rápidas (§69.6). Aparecem quando há o que acionar:
   *   - `dados.acoes`, dado por quem publica a notificação;
   *   - ou a ação registrada para a categoria (`registrarAcao`);
   *   - mais "Adiar" (§69.6, snooze cósmico) e "Resolver", que este runtime
   *     resolve sozinho e por isso estão sempre disponíveis.
   *
   * O que NÃO está aqui: "Ver pedido" que de fato abre um pedido. O rótulo é
   * do Guia, o pedido é do produto — este repositório não tem pedidos.
   */
  _acoes(dados) {
    const critica = dados.urgencia === 'critica';
    const lista = [];

    for (const a of dados.acoes || []) {
      if (a && typeof a.aoAcionar === 'function') lista.push(a);
    }
    const daCategoria = this.acoesPorCategoria.get(dados.categoria);
    if (daCategoria) {
      lista.push({
        rotulo: daCategoria.rotulo || ROTULOS_DE_ACAO[dados.categoria] || 'Abrir',
        aoAcionar: daCategoria.aoAcionar,
      });
    }

    const caixa = document.createElement('span');
    caixa.className = 'lum-notif-acoes';

    for (const a of lista) {
      caixa.appendChild(this._botaoDeAcao(a.rotulo, () => {
        this._registrar(dados, 'resolvida');
        a.aoAcionar(dados);
        this.resolver(dados.id);
      }));
    }

    // §69.3: a crítica "só sai por ação explícita" — então ela ganha Resolver
    // e NÃO ganha Adiar. Adiar uma crítica é suprimir aviso de segurança, e
    // isso a §69.3 chama de inegociável.
    if (!critica) {
      caixa.appendChild(this._menuDeAdiamento(dados));
    }
    caixa.appendChild(this._botaoDeAcao('Resolver', () => this.resolver(dados.id)));

    return caixa.childElementCount ? caixa : null;
  }

  _botaoDeAcao(rotulo, aoClicar) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lum-botao lum-notif-acao';
    b.textContent = rotulo;
    // O clique na ação não pode abrir a notificação inteira: são gestos
    // diferentes no mesmo alvo.
    b.addEventListener('click', (ev) => { ev.stopPropagation(); aoClicar(); });
    b.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') ev.stopPropagation(); });
    return b;
  }

  /** Snooze cósmico (§69.6): 30 min / 1 h / amanhã. */
  _menuDeAdiamento(dados) {
    const caixa = document.createElement('span');
    caixa.className = 'lum-notif-adiar';
    caixa.setAttribute('role', 'group');
    caixa.setAttribute('aria-label', 'Adiar esta notificação');
    const rotulo = document.createElement('span');
    rotulo.className = 'lum-notif-adiar-rotulo';
    rotulo.textContent = 'Adiar';
    caixa.appendChild(rotulo);
    for (const [chave, a] of Object.entries(ADIAMENTOS)) {
      const b = this._botaoDeAcao(a.rotulo, () => this.adiar(dados.id, chave));
      b.setAttribute('aria-label', `Adiar por ${a.rotulo.toLowerCase()}`);
      caixa.appendChild(b);
    }
    return caixa;
  }

  /**
   * Janela de Libras da notificação crítica (§72.1 item 5, APROVADO:
   * "animação de mãos junto do alerta crítico (§69.3); extensão da
   * acessibilidade extrema (§60.10)").
   *
   * O MECANISMO está aqui inteiro: a janela nasce só na classe crítica, é
   * região rotulada, acompanha o alerta e some com ele.
   *
   * O CONTEÚDO — os sinais — NÃO está, e não podia estar. Libras é língua:
   * sinal inventado por quem não a conhece não é acessibilidade, é ruído
   * apresentado como acessibilidade, e o dano cai justamente sobre quem a
   * função existe para atender. Além disso §48 proíbe a plataforma de gerar
   * vídeo. Então este slot segue a mesma arquitetura da §49: a fonte é
   * REGISTRADA de fora (`registrarLibras`), e enquanto não houver registro
   * nada é desenhado — exatamente como `marca-com-alfa.js` faz quando o
   * arquivo oficial não carrega.
   *
   * A ausência fica auditável em `data-lum-libras="ausente"`, e o texto do
   * alerta continua sendo o canal garantido (§68.7).
   */
  _janelaDeLibras(dados) {
    if (dados.urgencia !== 'critica') return null;
    const fonte = this.libras.get(dados.libras || dados.categoria);
    if (!fonte) { return null; }

    const janela = document.createElement('div');
    janela.className = 'lum-libras';
    janela.setAttribute('role', 'group');
    janela.setAttribute('aria-label', 'Aviso em Libras');
    janela.dataset.lumLibras = 'presente';
    const conteudo = typeof fonte === 'function' ? fonte(dados) : fonte;
    if (conteudo instanceof Node) janela.appendChild(conteudo);
    else janela.textContent = String(conteudo);
    return janela;
  }

  /**
   * Registra a fonte de Libras de uma categoria ou mensagem.
   * @param {string} chave  categoria (`fiscal`) ou `dados.libras`
   * @param {Node|Function|string} fonte  elemento pronto, fábrica ou texto
   */
  registrarLibras(chave, fonte) {
    if (fonte == null) this.libras.delete(chave);
    else this.libras.set(chave, fonte);
    return this;
  }

  /** Registra a ação rápida padrão de uma categoria (§69.6). */
  registrarAcao(categoria, acao) {
    if (!acao || typeof acao.aoAcionar !== 'function') this.acoesPorCategoria.delete(categoria);
    else this.acoesPorCategoria.set(categoria, acao);
    return this;
  }

  _abrir(dados, el) {
    this._registrar(dados, 'aberta');
    // §69.1: "o clique abre a ação e o Fio de Ariadne registra onde o usuário
    // estava para voltar" — o evento carrega isso para quem escuta.
    el.dispatchEvent(new CustomEvent('lum:notificacao-aberta', {
      detail: { ...dados, revelado: dados.valor ?? null }, bubbles: true,
    }));
    if (typeof dados.aoAbrir === 'function') dados.aoAbrir(dados);
    const n = this.visiveis.find((x) => x.el === el);
    if (n) this._remover(n);
  }

  /* -------------------------------------------------------------- remoção */

  _remover(n, imediato = false) {
    const i = this.visiveis.indexOf(n);
    if (i < 0) return;
    this.visiveis.splice(i, 1);
    if (n.timer) clearTimeout(n.timer);

    const fim = () => {
      n.el.remove();
      this._puxarDaFila();
      this._atualizarContador();
    };

    if (imediato || this.movimentoReduzido) {
      // §69.5: com movimento reduzido, "estourar" vira fade simples e
      // "ventania" vira dissolução suave. A notificação ainda sai.
      n.el.classList.add('lum-saida-suave');
      setTimeout(fim, imediato ? 0 : 180);
      return;
    }

    if (this.tema === 'elio') {
      this._estourar(n.el);              // §69.1: 5–7 bolhinhas
      setTimeout(fim, 520);
    } else {
      n.el.classList.add('lum-ventania'); // §69.2/§69.4
      setTimeout(fim, 1000);
    }
  }

  /** §69.1: o estouro solta 5–7 bolhinhas menores que se dissipam (~0,5s). */
  _estourar(el) {
    const r = el.getBoundingClientRect();
    const n = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const b = document.createElement('span');
      b.className = 'lum-bolhinha';
      b.setAttribute('aria-hidden', 'true');
      const ang = (i / n) * Math.PI * 2 + Math.random() * 0.6;
      const dist = 30 + Math.random() * 45;
      b.style.left = `${r.left + r.width / 2}px`;
      b.style.top = `${r.top + r.height / 2}px`;
      b.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
      b.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
      b.style.setProperty('--tam', `${6 + Math.random() * 8}px`);
      document.body.appendChild(b);
      b.addEventListener('animationend', () => b.remove(), { once: true });
    }
    el.classList.add('lum-estourando');
  }

  _puxarDaFila() {
    while (this.visiveis.length < MAX_VISIVEIS && this.fila.length) {
      this._mostrar(this.fila.shift());
    }
  }

  /** §69.5: excesso vira contador ("+3") que abre o Centro. */
  _atualizarContador() {
    const alvo = this.tema === 'elio' ? this.orbita : this.faixa;
    let c = alvo.querySelector('.lum-contador');
    if (!this.fila.length) { c?.remove(); return; }
    if (!c) {
      c = document.createElement('button');
      c.className = 'lum-contador lum-botao';
      c.addEventListener('click', () => {
        alvo.dispatchEvent(new CustomEvent('lum:abrir-centro', { bubbles: true }));
      });
      alvo.appendChild(c);
    }
    c.textContent = `+${this.fila.length}`;
    c.setAttribute('aria-label',
      `Mais ${this.fila.length} notificações. Abrir o Centro de Notificações.`);
  }

  /** Limpa as não-críticas — o gesto da Ventania (§69.4). */
  ventania() {
    for (const n of this.visiveis.slice()) {
      if (n.dados.urgencia !== 'critica') this._remover(n);
    }
    this.fila = this.fila.filter((d) => d.urgencia === 'critica');
    this._atualizarContador();
    return this;
  }

  /* ------------------------------------------------------ §69.6 histórico */

  /** Uma linha por evento. Estados: nova · aberta · resolvida · adiada · expirada. */
  _registrar(dados, estado) {
    const anterior = this.historico.find((h) => h.id === dados.id);
    if (anterior) { anterior.estado = estado; anterior.mudadaEm = Date.now(); return anterior; }
    const linha = {
      id: dados.id,
      texto: dados.texto,
      categoria: dados.categoria,
      urgencia: dados.urgencia,
      em: Date.now(),
      estado,
    };
    this.historico.push(linha);
    if (this.historico.length > HISTORICO_MAX) this.historico.shift();
    return linha;
  }

  /**
   * Busca no histórico — é o que o Centro de Notificações consome (§69.6:
   * "histórico pesquisável (…) filtro por tipo").
   * @param {{texto?: string, categoria?: string, estado?: string}} [filtro]
   */
  buscar(filtro = {}) {
    const t = String(filtro.texto || '').trim().toLowerCase();
    return this.historico.filter((h) => {
      if (filtro.categoria && h.categoria !== filtro.categoria) return false;
      if (filtro.estado && h.estado !== filtro.estado) return false;
      if (t && !`${h.texto} ${rotuloCategoria(h.categoria)}`.toLowerCase().includes(t)) return false;
      return true;
    }).slice().reverse();      // mais recente primeiro
  }

  /** Marca como resolvida e tira da tela (§69.6, "ação direta: Resolver"). */
  resolver(id) {
    const n = this.visiveis.find((x) => x.dados.id === id);
    this._registrar({ id }, 'resolvida');
    this.fila = this.fila.filter((d) => d.id !== id);
    if (n) this._remover(n);
    this._atualizarContador();
    return this;
  }

  /**
   * Snooze cósmico (§69.6). A notificação sai da tela e volta sozinha.
   *
   * O adiamento é gravado em localStorage e rearmado na próxima montagem —
   * senão "adiar para amanhã" viraria "esquecer", que é o oposto do pedido.
   *
   * §69.3 é inegociável: CRÍTICA NÃO ADIA. Adiar uma crítica seria suprimir
   * aviso de segurança, e a §69.3 diz que eles "mudam de roupa, nunca de
   * comportamento".
   *
   * @param {string} id
   * @param {'trinta'|'hora'|'amanha'} [quando='trinta']
   * @returns {number|null} quando volta (epoch ms), ou null se não adiou
   */
  adiar(id, quando = 'trinta') {
    const regra = ADIAMENTOS[quando] || ADIAMENTOS.trinta;
    const n = this.visiveis.find((x) => x.dados.id === id);
    const daFila = this.fila.find((d) => d.id === id);
    const dados = n?.dados || daFila;
    if (!dados) return null;
    if (dados.urgencia === 'critica') return null;      // §69.3

    const espera = regra.ms();
    const ate = Date.now() + espera;
    this.fila = this.fila.filter((d) => d.id !== id);
    if (n) this._remover(n);
    this._registrar(dados, 'adiada');
    this._agendar({ ...dados, aoAbrir: undefined }, ate, espera);
    this._salvarAdiadas();
    this._atualizarContador();
    return ate;
  }

  _agendar(dados, ate, espera) {
    const timer = setTimeout(() => {
      this._adiadas.delete(dados.id);
      this._salvarAdiadas();
      this._mostrar({ ...dados });
      this._registrar(dados, 'nova');
    }, Math.max(0, Math.min(espera, 2 ** 31 - 1)));
    this._adiadas.set(dados.id, { timer, ate, dados });
  }

  _salvarAdiadas() {
    try {
      const lista = [...this._adiadas.values()].map(({ ate, dados }) => ({
        ate, dados: { ...dados, aoAbrir: undefined, acoes: undefined },
      }));
      localStorage.setItem(CHAVE_ADIADAS, JSON.stringify(lista));
    } catch { /* modo privado: o adiamento vale só nesta sessão */ }
  }

  /** Rearma o que foi adiado antes de a página fechar; o que já venceu volta. */
  _restaurarAdiadas() {
    let lista = [];
    try { lista = JSON.parse(localStorage.getItem(CHAVE_ADIADAS) || '[]'); }
    catch { return; }
    if (!Array.isArray(lista)) return;
    for (const item of lista) {
      const d = item?.dados;
      if (!d || !d.id || !d.texto) continue;
      const espera = (item.ate || 0) - Date.now();
      if (espera <= 0) { this.notificar({ ...d, id: undefined }); continue; }
      this._registrar(d, 'adiada');
      this._agendar(d, item.ate, espera);
    }
    this._salvarAdiadas();
  }

  /**
   * Resumo em constelação (§69.6): "consolidação do dia (N eventos + link
   * para o Replay do Dia §61)".
   *
   * Devolve o número, não desenha o céu: quem desenha a Constelação do Dia é
   * o Céu Vivo (§71.1), e `Lumora.resumoDoDia()` amarra os dois. Aqui só se
   * conta o que aconteceu, porque é aqui que está o histórico.
   */
  resumoEmConstelacao(desde = inicioDoDia()) {
    const doDia = this.historico.filter((h) => h.em >= desde);
    const porCategoria = {};
    for (const h of doDia) porCategoria[h.categoria] = (porCategoria[h.categoria] || 0) + 1;
    const pendentes = doDia.filter((h) => h.estado === 'nova' || h.estado === 'adiada').length;
    return {
      total: doDia.length,
      pendentes,
      porCategoria,
      // (AGENTE — a §69.6 pede a consolidação e não escreve a frase.)
      texto: doDia.length
        ? `${doDia.length} evento${doDia.length > 1 ? 's' : ''} hoje` +
          (pendentes ? `, ${pendentes} ainda em aberto.` : ', tudo resolvido.')
        : 'Nenhum evento hoje ainda.',
      replayDoDia: '§61',   // o Replay é do produto; aqui fica o vínculo
    };
  }

  destruir() {
    for (const n of this.visiveis) if (n.timer) clearTimeout(n.timer);
    for (const { timer } of this._adiadas.values()) clearTimeout(timer);
    this._adiadas.clear();
    this.orbita.remove();
    this.faixa.remove();
  }
}

/** Meia-noite local de hoje. */
function inicioDoDia() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/* ------------------------------------------------------------------ apoio */

function rotuloCategoria(cat) {
  return {
    fiscal: 'Fiscal', pedido: 'Pedido', sistema: 'Sistema',
    seguranca: 'Segurança', lgpd: 'LGPD', pagamento: 'Pagamento',
    entrega: 'Entrega', venda: 'Venda',
  }[cat] || 'Sistema';
}

/** §69.5 — privacidade LGPD: "Pagamento recebido — R$ **".
 *  O valor só é revelado ao abrir. */
function textoMascarado(dados) {
  if (!dados.valor) return dados.texto;
  return `${dados.texto} — ${String(dados.valor).replace(/[\d.,]+/g, '**')}`;
}

/* =========================================================================
   BÓLIDO (§67.5 / §69.3) — a classe EXCEPCIONAL
   Meteoro de vidro e luz atravessando a tela em 2,3s. Não é notificação
   cotidiana: incidentes de segurança e falha crítica.
   ========================================================================= */

export class Bolido {
  constructor(opcoes = {}) {
    this.duracao = opcoes.duracao ?? 2300;    // §67.5: 2,3 s
    this.movimentoReduzido = typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * @param {object} dados
   * @param {string} dados.texto
   * @param {Function} [dados.aoAbrir]
   */
  lancar(dados) {
    // §67.5: com prefers-reduced-motion, vira TOAST SIMPLES — o aviso não
    // desaparece, só perde o gesto.
    if (this.movimentoReduzido) return this._toast(dados);

    const canvas = document.createElement('canvas');
    canvas.className = 'lum-bolido-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // O rótulo clicável acompanha o meteoro — o bólido é clicável (§67.5)
    const alvo = this._toast(dados, true);

    const x0 = -innerWidth * 0.12, y0 = -innerHeight * 0.10;
    const x1 = innerWidth * 1.12, y1 = innerHeight * 0.92;
    const inicio = performance.now();
    let raf = 0;

    const laco = (agora) => {
      const t = Math.min(1, (agora - inicio) / this.duracao);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      const e = t * t * (3 - 2 * t);              // smoothstep
      const x = x0 + (x1 - x0) * e, y = y0 + (y1 - y0) * e;
      const fade = t < 0.1 ? t / 0.1 : t > 0.85 ? (1 - t) / 0.15 : 1;

      // Cauda de vidro e luz
      const comp = 260;
      const dx = (x1 - x0), dy = (y1 - y0);
      const n = Math.hypot(dx, dy);
      const ux = dx / n, uy = dy / n;
      const g = ctx.createLinearGradient(x - ux * comp, y - uy * comp, x, y);
      g.addColorStop(0, 'rgba(176,29,255,0)');
      g.addColorStop(0.55, `rgba(176,29,255,${(0.35 * fade).toFixed(3)})`);
      g.addColorStop(1, `rgba(255,255,255,${(0.85 * fade).toFixed(3)})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - ux * comp, y - uy * comp);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Cabeça
      const gh = ctx.createRadialGradient(x, y, 0, x, y, 26);
      gh.addColorStop(0, `rgba(255,255,255,${fade})`);
      gh.addColorStop(0.3, `rgba(215,180,255,${0.7 * fade})`);
      gh.addColorStop(1, 'rgba(0,114,255,0)');
      ctx.fillStyle = gh;
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fill();

      if (t < 1) { raf = requestAnimationFrame(laco); }
      else { cancelAnimationFrame(raf); canvas.remove(); }
    };
    raf = requestAnimationFrame(laco);
    return alvo;
  }

  _toast(dados, comBolido = false) {
    const el = document.createElement('div');
    el.className = 'lum-bolido-toast' + (comBolido ? ' lum-bolido-toast--anim' : '');
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');   // §69.5: crítica é assertive
    el.tabIndex = 0;
    el.innerHTML = '<strong>Alerta</strong> <span></span>' +
                   '<button class="lum-bolido-fechar" aria-label="Dispensar alerta">✕</button>';
    el.querySelector('span').textContent = dados.texto;

    const sair = () => el.remove();
    el.querySelector('.lum-bolido-fechar').addEventListener('click', (ev) => {
      ev.stopPropagation();
      sair();
    });
    el.addEventListener('click', () => {
      if (typeof dados.aoAbrir === 'function') dados.aoAbrir(dados);
      sair();
    });
    document.body.appendChild(el);
    el.focus({ preventScroll: true });
    // §69.3: a excepcional "pode sumir, mas com confirmação" — sem timeout.
    return el;
  }
}

/* =========================================================================
   IDENTIDADE SONORA POR CATEGORIA (§72.1 item 3, APROVADO)
   "notas procedurais WebAudio (fiscal/pedido/sistema), zero arquivo".
   §45: som NUNCA é canal único — o texto já está na tela em paralelo.
   ========================================================================= */

const NOTAS = {
  fiscal:    [523.25, 659.25],          // dó–mi, sóbrio
  pagamento: [523.25, 659.25],
  seguranca: [440.00, 415.30],          // meio-tom descendente, tenso
  lgpd:      [440.00, 415.30],
  pedido:    [587.33, 880.00],          // ré–lá, ascendente
  venda:     [587.33, 880.00],
  entrega:   [659.25, 987.77],
  sistema:   [349.23, 523.25],          // fá–dó, neutro
};

export class IdentidadeSonora {
  constructor() {
    this.ctx = null;
    this.mudo = false;
    this.categoriasMudas = new Set();   // §20: mutar tudo ou por categoria
  }

  _ativar() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  /** Toca a assinatura da categoria. Silencia com prefers-reduced-motion
   *  (§45) e respeita o mute global e por categoria (§20). */
  tocar(categoria = 'sistema', urgencia = 'normal') {
    if (this.mudo || this.categoriasMudas.has(categoria)) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = this._ativar();
    if (!ctx) return;

    const notas = NOTAS[categoria] || NOTAS.sistema;
    const t0 = ctx.currentTime;
    const ganhoMestre = ctx.createGain();
    ganhoMestre.gain.value = urgencia === 'critica' ? 0.16 : 0.10;
    ganhoMestre.connect(ctx.destination);

    notas.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const ini = t0 + i * 0.11;
      g.gain.setValueAtTime(0, ini);
      g.gain.linearRampToValueAtTime(1, ini + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ini + 0.42);
      osc.connect(g); g.connect(ganhoMestre);
      osc.start(ini);
      osc.stop(ini + 0.45);
    });
  }

  mutar(valor = true) { this.mudo = !!valor; return this; }
  mutarCategoria(cat, valor = true) {
    valor ? this.categoriasMudas.add(cat) : this.categoriasMudas.delete(cat);
    return this;
  }
}
