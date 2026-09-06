/* ==========================================================================
   Lumora — Fase 3A: bootstrap
   Amarra os cinco módulos liberados pelo "pode ir" do Fundador (05/09/2026)
   e aplica as regras transversais que valem para todos eles.

   Ordem de implementação decidida em §71 e seguida aqui:
     1. ✨ Formas que Sentem   -> formas-que-sentem.css + o respingo daqui
     2. 🌌 Céu Vivo            -> ceu-vivo.js
     3. 💬 Sotaque Cósmico     -> sotaque-cosmico.js
     4. 🚀 Viagem Cósmica      -> viagem-cosmica.js
     5. 📜 Documentos com Alma -> documentos-com-alma.{css,js}
     6. 🌈 Acessibilidade Bonita -> acessibilidade-bonita.css (6 paletas, verificadas)

   REGRAS TRANSVERSAIS APLICADAS AQUI, NÃO DELEGADAS À DISCIPLINA DE QUEM USA:
     - prefers-reduced-motion desliga gesto, nunca informação (§35 item 8)
     - som nunca é canal único (§45/§68.5/§69.5)
     - telemetria de desempenho é local, sem analytics externo (§72.1 item 4)
     - custo zero: nenhuma rede, nenhuma dependência (§65.5, §71)
   ========================================================================== */

'use strict';

import { CeuVivo } from './ceu-vivo.js';
import { SotaqueCosmico } from './sotaque-cosmico.js';
import { ViagemCosmica } from './viagem-cosmica.js';
import { aplicarConstelacoes } from './documentos-com-alma.js';
import { aplicarMarcas, marcaComAlfa } from './marca-com-alfa.js';
import { CamadaDeSistema, SISTEMAS, SEM_CAMADA } from './camada-de-sistema.js';
import { Animacoes } from './animacoes.js';
import { NotificacoesVivas, Bolido, IdentidadeSonora } from './notificacoes-vivas.js';
import { Navegacao } from './navegacao.js';
import { AtlasEstelar } from './atlas-estelar.js';
import {
  NebulosaDeAcoes, RastroDeAurora, SismografoVivo,
  PoeiraDeInteracao, FioDeAriadne, Estrelinha, ComandosDeVoz,
} from './interface-viva.js';
import { CentroDeNotificacoes } from './centro-de-notificacoes.js';
import { VistaDePatio, TITULO as TITULO_PATIO } from './vista-de-patio.js';
import { TelemetriaLocal, NIVEIS } from './telemetria-local.js';
import { estadoVivo, aplicarEstados, rotaPerdida, ESTADOS } from './estados-vivos.js';
import { OnboardingAurora, ROTEIRO_PADRAO, ESPERA_DOS_TERMOS_MS } from './onboarding-aurora.js';

const PALETAS_VALIDAS = new Set([
  'padrao', 'preto-branco', 'daltonismo',
  // As três da §70.6, com valores definidos e contraste calculado. Verificadas
  // sob protanopia, deuteranopia e tritanopia por
  // ferramentas/verificar_daltonismo.py — o menor contraste de texto em todo o
  // sistema é 6,21:1, acima de AA. Ver ESCALACOES.md §7.
  'fogo-de-nebulosa', 'aurora-dia', 'aurora-noite',
]);

export class Lumora {
  /**
   * @param {object} [opcoes]
   * @param {HTMLCanvasElement} [opcoes.canvasCeu]  canvas do Céu Vivo
   * @param {HTMLElement} [opcoes.raiz=document.body]
   * @param {string} [opcoes.idioma='pt-BR']
   * @param {boolean} [opcoes.sotaque=true]  personalidade ligada (§21)
   * @param {'elio'|'aurora'} [opcoes.tema='elio']  §66.3
   * @param {HTMLCanvasElement} [opcoes.canvasSismografo]  §67.4
   * @param {Array} [opcoes.abas]    navegação §65.3/§66
   * @param {Array} [opcoes.acoes]   Nebulosa de Ações §67.1
   * @param {HTMLCanvasElement} [opcoes.canvasCamada]  camada do sistema §65.1
   * @param {string} [opcoes.sistema='business']  qual assinatura desenhar
   */
  constructor(opcoes = {}) {
    this.raiz = opcoes.raiz || document.body;
    this.movimentoReduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.nivel = this._detectarNivel();
    this.tema = opcoes.tema === 'aurora' ? 'aurora' : 'elio';
    document.documentElement.dataset.lumNivel = this.nivel;
    document.documentElement.dataset.lumTema = this.tema;

    this.sotaque = new SotaqueCosmico({
      idioma: opcoes.idioma,
      ligado: opcoes.sotaque !== false,
    });
    this.viagem = new ViagemCosmica({ nivel: this.nivel });
    this.animacoes = new Animacoes({ nivel: this.nivel });

    this.ceu = opcoes.canvasCeu
      ? new CeuVivo(opcoes.canvasCeu, { nivel: this.nivel })
      : null;

    // A camada complementar do sistema (§65.1), POR CIMA do Céu Vivo e num
    // canvas próprio: o céu continua igual para todos os sistemas.
    this.camada = opcoes.canvasCamada
      ? new CamadaDeSistema(opcoes.canvasCamada, {
          sistema: opcoes.sistema, nivel: this.nivel,
        })
      : null;

    // Interface Viva (§67/§68)
    this.som = new IdentidadeSonora();                      // §72.1 item 3
    this.notificacoes = new NotificacoesVivas({             // §69
      tema: this.tema, raiz: this.raiz, som: this.som,
    });
    this.bolido = new Bolido();                             // §67.5
    this.rastro = new RastroDeAurora();                     // §67.2
    this.poeira = new PoeiraDeInteracao({ nivel: this.nivel }); // §68.2
    this.fio = new FioDeAriadne({ raiz: this.raiz });        // §68.3
    this.estrelinha = new Estrelinha();                      // §68.4
    this.nebulosa = new NebulosaDeAcoes({ acoes: opcoes.acoes || [] }); // §67.1

    // §69.6 — o Centro de Notificações, que é o destino do contador "+3" que
    // a §69.5 já despachava e ninguém escutava. Entra na Nebulosa (Ctrl+K),
    // que é onde a §69.6 manda ele morar.
    this.centro = new CentroDeNotificacoes(this.notificacoes, { raiz: this.raiz });
    this.nebulosa.definirAcoes([...(opcoes.acoes || []), this.centro.comoAcaoDaNebulosa()]);

    // §65.4 — Vista de Pátio, criatividade 3 da §61. Gira, afasta, anuncia e
    // abre a dashboard dentro de uma bolha. O painel é de quem integra.
    this.patio = new VistaDePatio({
      cena: opcoes.cenaDoPatio || this.raiz, raiz: this.raiz, nivel: this.nivel,
    });

    // §72.1 item 4 — telemetria local. O nível detectado na entrada vira o
    // TETO: o aparelho pode recuperar fôlego, não pode virar outro aparelho.
    this.telemetria = new TelemetriaLocal({
      nivel: this.nivel, tetoDoAparelho: this.nivel, alvo: document.documentElement,
    }).iniciar();
    this._ligarTelemetria();

    this.sismografo = opcoes.canvasSismografo                // §67.4
      ? new SismografoVivo(opcoes.canvasSismografo)
      : null;

    this.navegacao = opcoes.abas?.length                     // §65.3 / §66
      ? new Navegacao({
          abas: opcoes.abas, tema: this.tema, raiz: this.raiz,
          aoEscolher: (aba, sub) => {
            this.fio.registrar({ id: (sub || aba).id, rotulo: (sub || aba).rotulo });
            opcoes.aoNavegar?.(aba, sub);
          },
        })
      : null;

    this._ligarRespingo();
    this._ligarMudancaDePreferencia();
    this.sotaque.aplicar(this.raiz);
    aplicarConstelacoes(this.raiz);
    // A L canônica com alfa verdadeiro (ESCALACOES.md §3). Assíncrono de
    // propósito: se o oficial não carregar, a área fica reservada e vazia e o
    // resto da interface não espera nem quebra.
    aplicarMarcas(this.raiz).catch(() => { /* área segue reservada */ });
    this.estrelinha.aplicar(this.raiz);
    if (this.ceu) this.ceu.iniciar();
    if (this.camada) this.camada.iniciar();
    if (this.sismografo) this.sismografo.iniciar();
  }

  /* -------------------------------------------------------- API pública */

  /** Acende uma estrela por ação real do negócio (§70.1).
   *  A mesma ação também injeta um pulso no Sismógrafo Vivo (§67.4): a tela
   *  inteira "sente" a atividade, que é o que a §67.4 pede.
   *  @param {object} dados venda, entrega, pedido, lançamento… */
  acenderEstrela(dados = {}) {
    this.sismografo?.pulso(dados.forca ?? 1);
    return this.ceu ? this.ceu.acenderEstrela(dados) : null;
  }

  /** Publica uma notificação viva (§69). */
  notificar(dados) { return this.notificacoes.notificar(dados); }

  /** Lança o Bólido — classe EXCEPCIONAL (§67.5/§69.3): incidentes de
   *  segurança e falha crítica. Não é notificação cotidiana. */
  lancarBolido(dados) { return this.bolido.lancar(dados); }

  /** Toca a animação de um slot da §49 (§18). */
  tocarAnimacao(slot, canvas, opcoes) {
    return this.animacoes.tocar(slot, canvas, opcoes);
  }

  /** Abre o Atlas Estelar (§16) num elemento.
   *  O nível §36 e o narrador já entram amarrados: a narração da Aurora sai
   *  pelo mesmo canal aria-live de todo o resto (§45, som nunca é único). */
  abrirAtlas(raiz, opcoes = {}) {
    this.atlas?.destruir();
    this.atlas = new AtlasEstelar(raiz, {
      nivel: this.nivel,
      narrar: (texto) => anunciar(texto),
      ...opcoes,
    });
    return this.atlas;
  }

  /** Troca o tema. §66.3: a navegação acompanha o tema; §69.5: as
   *  notificações na tela se transformam sem perda. */
  definirTema(tema) {
    this.tema = tema === 'aurora' ? 'aurora' : 'elio';
    document.documentElement.dataset.lumTema = this.tema;
    this.notificacoes.definirTema(this.tema);
    this.navegacao?.definirTema(this.tema);
    return this;
  }

  /** Troca a assinatura de sistema desenhada sobre o Céu Vivo (§65.1).
   *  'business' e 'comunidade' têm camada vazia POR DECISÃO — ver SEM_CAMADA. */
  definirSistema(nome) {
    this.camada?.definirSistema(nome);
    return this;
  }

  /** Desenha a Constelação do Dia (§71.1). */
  constelacaoDoDia() {
    return this.ceu ? this.ceu.constelacaoDoDia() : null;
  }

  /**
   * Resumo em constelação (§69.6): consolidação do dia. Conta os eventos no
   * histórico das notificações E desenha a Constelação do Dia (§71.1) — é o
   * mesmo dia visto pelos dois lados, e por isso é uma chamada só.
   */
  resumoDoDia() {
    const resumo = this.notificacoes.resumoEmConstelacao();
    resumo.constelacao = this.constelacaoDoDia();
    anunciar(resumo.texto);
    return resumo;
  }

  /** Estado vazio ou de erro com identidade (§72.1 item 1). */
  estado(alvo, opcoes = {}) {
    return estadoVivo(alvo, { sotaque: this.sotaque, ...opcoes });
  }

  /**
   * Onboarding narrado pela Aurora (§72.1 item 6).
   * A narração usa a voz nativa; o anúncio de acessibilidade usa o mesmo
   * canal aria-live de todo o resto (§68.7: voz nunca é canal único).
   */
  onboarding(raiz = this.raiz, opcoes = {}) {
    this.onb?.destruir();
    this.onb = new OnboardingAurora(raiz, {
      idioma: this.sotaque.idioma,
      sotaque: this.sotaque,
      anunciar: (texto, urgencia) => anunciar(texto, urgencia),
      ...opcoes,
    });
    return this.onb;
  }

  /** Relatório da telemetria local (§72.1 item 4). Nada disto saiu daqui. */
  relatorioDeDesempenho() { return this.telemetria.relatorio(); }

  /** Modo Foco / Respiração do Céu (§13 + §67.3).
   *  Além de desacelerar as estrelas, marca o documento para que as
   *  notificações saibam que estão em não-perturbe (§69.5). */
  modoFoco(ligado = true) {
    document.documentElement.dataset.lumFoco = ligado ? 'true' : 'false';
    if (this.ceu) this.ceu.respiracaoDoCeu(ligado);
    return this;
  }

  /** Viagem Cósmica entre telas ou sistemas (§70.2). */
  viajar(origem, destino, opcoes) {
    return this.viagem.viajar(origem, destino, opcoes);
  }

  /** Troca a paleta de alto contraste (§35 item 7 / §70.6). */
  definirPaleta(nome) {
    if (!PALETAS_VALIDAS.has(nome)) {
      throw new RangeError(`Paleta desconhecida: ${nome}`);
    }
    document.documentElement.dataset.lumPaleta = nome;
    try { localStorage.setItem('lum:paleta', nome); } catch { /* modo privado */ }
    // A camada do sistema tira as cores dos tokens: trocada a paleta, ela
    // precisa reler. É assim que as seis paletas alcançam o ambiente também.
    this.camada?.atualizarPaleta();
    return this;
  }

  /** Idioma da interface — o tom é recriado, não traduzido (§71.3). */
  definirIdioma(idioma) {
    this.sotaque.definirIdioma(idioma);
    this.sotaque.aplicar(this.raiz);
    document.documentElement.lang = idioma;
    return this;
  }

  destruir() {
    this.onb?.destruir();
    this.patio.destruir();
    this.centro.destruir();
    this.telemetria.destruir();
    document.documentElement.removeEventListener('lum:nivel-aviso', this._onAviso);
    document.documentElement.removeEventListener('lum:nivel', this._onNivel);
    this.atlas?.destruir();
    this.camada?.destruir();
    this.raiz.removeEventListener('pointerdown', this._onRespingo);
    if (this._mqMovimento) {
      this._mqMovimento.removeEventListener('change', this._onPreferencia);
    }
    this.ceu?.destruir();
    this.sismografo?.destruir();
    this.navegacao?.destruir();
    this.notificacoes.destruir();
    this.nebulosa.destruir();
    this.rastro.destruir();
    this.poeira.destruir();
    this.fio.destruir();
    this.animacoes.parar();
  }

  /* ------------------------------------------------------------ interno */

  /** Nível inicial da otimização adaptativa (§36).
   *  Só pistas locais do aparelho — nada sai daqui (LGPD, §72.1 item 4).
   *  O Céu Vivo rebaixa sozinho depois, se o fps medido não sustentar. */
  _detectarNivel() {
    const nucleos = navigator.hardwareConcurrency || 4;
    const memoria = navigator.deviceMemory || 4;
    const conexao = navigator.connection?.saveData;
    if (conexao || nucleos <= 2 || memoria <= 2) return 'basico';
    if (nucleos <= 4 || memoria <= 4) return 'economico';
    return 'pleno';
  }

  /**
   * Amarra a Telemetria Local (§72.1 item 4) à Otimização Adaptativa (§36).
   *
   * Três fios:
   *   1. o Céu Vivo entrega cada medida de fps à telemetria;
   *   2. a telemetria decide o nível — e é a única que sabe SUBIR;
   *   3. o "aviso discreto" que a §36 exige vira texto anunciado, porque
   *      efeito visual sozinho não é aviso (§35 item 3).
   */
  _ligarTelemetria() {
    if (this.ceu) this.ceu.aoMedirFps = (fps) => this.telemetria.registrarFps(fps);
    else this.telemetria.observarQuadros();

    this._onNivel = (ev) => this._aplicarNivel(ev.detail?.nivel);
    this._onAviso = (ev) => { if (ev.detail?.texto) anunciar(ev.detail.texto); };
    document.documentElement.addEventListener('lum:nivel', this._onNivel);
    document.documentElement.addEventListener('lum:nivel-aviso', this._onAviso);
  }

  /** Espalha o nível §36 por todos os módulos que desenham. */
  _aplicarNivel(nivel) {
    if (!NIVEIS.includes(nivel) || nivel === this.nivel) return this;
    this.nivel = nivel;
    document.documentElement.dataset.lumNivel = nivel;
    this.ceu?.definirNivel(nivel);
    this.camada?.definirNivel(nivel);
    this.viagem.nivel = nivel;
    this.animacoes.nivel = nivel;
    this.poeira.nivel = nivel;
    return this;
  }

  /** Respingo de vidro líquido no clique (§70.4, passo 1 da Fase 3A).
   *  Delegado na raiz: funciona para botões criados depois. */
  _ligarRespingo() {
    this._onRespingo = (ev) => {
      if (this.movimentoReduzido || this.nivel === 'basico') return;
      const botao = ev.target.closest?.('.lum-botao');
      if (!botao) return;

      const r = botao.getBoundingClientRect();
      const tam = Math.max(r.width, r.height) * 2;
      const gota = document.createElement('span');
      gota.className = 'lum-respingo';
      gota.setAttribute('aria-hidden', 'true');
      gota.style.setProperty('--lum-respingo-tam', `${tam}px`);
      gota.style.insetInlineStart = `${ev.clientX - r.left}px`;
      gota.style.insetBlockStart = `${ev.clientY - r.top}px`;
      botao.appendChild(gota);
      gota.addEventListener('animationend', () => gota.remove(), { once: true });
    };
    this.raiz.addEventListener('pointerdown', this._onRespingo, { passive: true });
  }

  /** A preferência de movimento pode mudar com o sistema rodando.
   *  §35 item 8 não admite "só vale se recarregar". */
  _ligarMudancaDePreferencia() {
    this._mqMovimento = matchMedia('(prefers-reduced-motion: reduce)');
    this._onPreferencia = (ev) => {
      this.movimentoReduzido = ev.matches;
      this.viagem.movimentoReduzido = ev.matches;
      if (this.ceu) {
        this.ceu.movimentoReduzido = ev.matches;
        if (ev.matches) { this.ceu.parar(); this.ceu._quadro(0); }
        else this.ceu.iniciar();
      }
    };
    this._mqMovimento.addEventListener('change', this._onPreferencia);
  }
}

/**
 * Anuncia uma mensagem a leitores de tela.
 * §69.5: aria-live "polite" no normal, "assertive" no crítico.
 * §45/§68.5: o som nunca é canal único — por isso este canal de texto existe
 * separado, e é ele que carrega a informação.
 *
 * @param {string} texto
 * @param {'polite'|'assertive'} [urgencia='polite']
 */
export function anunciar(texto, urgencia = 'polite') {
  const id = `lum-vivo-${urgencia}`;
  let regiao = document.getElementById(id);
  if (!regiao) {
    regiao = document.createElement('div');
    regiao.id = id;
    regiao.setAttribute('aria-live', urgencia);
    regiao.setAttribute('aria-atomic', 'true');
    // Fora da tela, mas nunca display:none — leitor de tela ignora o que
    // está escondido de verdade.
    Object.assign(regiao.style, {
      position: 'absolute', inlineSize: '1px', blockSize: '1px',
      overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap',
    });
    document.body.appendChild(regiao);
  }
  regiao.textContent = '';
  requestAnimationFrame(() => { regiao.textContent = texto; });
}

/** Restaura a paleta que o usuário escolheu antes de sair. */
export function restaurarPaleta() {
  try {
    const p = localStorage.getItem('lum:paleta');
    if (p && PALETAS_VALIDAS.has(p)) document.documentElement.dataset.lumPaleta = p;
  } catch { /* modo privado: segue no padrão */ }
}

export {
  CeuVivo, SotaqueCosmico, ViagemCosmica, PALETAS_VALIDAS,
  Animacoes, NotificacoesVivas, Bolido, IdentidadeSonora, Navegacao,
  NebulosaDeAcoes, RastroDeAurora, SismografoVivo, PoeiraDeInteracao,
  FioDeAriadne, Estrelinha, ComandosDeVoz,
  aplicarMarcas, marcaComAlfa,
  CamadaDeSistema, SISTEMAS, SEM_CAMADA,
  CentroDeNotificacoes, TelemetriaLocal, NIVEIS, VistaDePatio, TITULO_PATIO,
  estadoVivo, aplicarEstados, rotaPerdida, ESTADOS,
  OnboardingAurora, ROTEIRO_PADRAO, ESPERA_DOS_TERMOS_MS,
};
