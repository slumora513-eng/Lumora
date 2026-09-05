/* ==========================================================================
   Lumora — Fase 3A, passo 3: 💬 SOTAQUE CÓSMICO (textos)
   §70.3 / §71.3. Liberado pelo "pode ir" do Fundador (05/09/2026).

   §71.3: "Pop, agro, Globo, cosmos — o texto é metade da estética."

   DUAS REGRAS QUE ESTE MÓDULO IMPÕE NO CÓDIGO, NÃO NA DOCUMENTAÇÃO:

   1. §70.3 — "humor leve NUNCA em contexto de erro crítico ou fiscal".
      Contextos críticos (fiscal, financeiro, LGPD, segurança, pagamento)
      recebem registro neutro. Não é uma convenção que alguém possa esquecer:
      `frase()` troca o catálogo sozinha quando o contexto é crítico.

   2. §71.3 — "i18n (en/es) traduz o tom, não tradução literal."
      Cada idioma tem catálogo próprio, recriado. Não há tradução automática.

   PROCEDÊNCIA DE CADA FRASE
   As marcadas GUIA são textuais do Guia (§70.3/§71.3) e não devem ser
   reescritas. As marcadas AGENTE são default deste agente, escritas no mesmo
   tom, e NÃO constam do Guia — §72.1 item 1 aprovou "estados vazios e de erro
   com identidade" como função, mas não fixou as frases.
   ========================================================================== */

'use strict';

/** Contextos em que o Sotaque Cósmico se cala (§70.3). */
export const CONTEXTOS_CRITICOS = new Set([
  'fiscal', 'financeiro', 'lgpd', 'seguranca', 'pagamento', 'erro-critico',
]);

const CATALOGO = {
  'pt-BR': {
    cosmico: {
      carregando:  'acertando em cheio o seu nicho',                              // GUIA
      vazio:       'nenhuma estrela acesa por aqui ainda… vamos acender a primeira?', // GUIA
      erro:        'uma nebulosa engoliu isso, tenta de novo',                    // GUIA
      metaBatida:  'sua empresa brilhou hoje',                                    // GUIA
      salvando:    'guardando no cofre estelar…',                                 // AGENTE
      salvo:       'guardado com segurança',                                      // AGENTE
      semResultado:'vasculhamos o setor inteiro e não achamos nada',              // AGENTE
      semConexao:  'perdemos o sinal da base — trabalhando offline por enquanto', // AGENTE
      rotaPerdida: 'rota perdida — essa tela não existe mais',                    // AGENTE (§72.1 item 1)
      sincronizando:'sincronizando com a base…',                                  // AGENTE
    },
    neutro: {
      carregando:  'Carregando…',
      vazio:       'Nenhum registro encontrado.',
      erro:        'Não foi possível concluir. Tente novamente.',
      metaBatida:  'Meta atingida.',
      salvando:    'Salvando…',
      salvo:       'Salvo.',
      semResultado:'Nenhum resultado para esta busca.',
      semConexao:  'Sem conexão. Trabalhando offline.',
      rotaPerdida: 'Página não encontrada.',
      sincronizando:'Sincronizando…',
    },
  },

  /* en/es: o tom é recriado, não traduzido ao pé da letra (§71.3).
     (AGENTE — nenhuma string em outro idioma consta do Guia.) */
  'en': {
    cosmico: {
      carregando:  'locking onto your niche',
      vazio:       'no stars lit here yet… shall we light the first one?',
      erro:        'a nebula swallowed that one — give it another go',
      metaBatida:  'your business shone today',
      salvando:    'stowing it in the stellar vault…',
      salvo:       'safely stowed',
      semResultado:'we swept the whole sector and found nothing',
      semConexao:  'lost signal from base — working offline for now',
      rotaPerdida: 'route lost — this screen is no longer here',
      sincronizando:'syncing with base…',
    },
    neutro: {
      carregando: 'Loading…', vazio: 'No records found.',
      erro: 'Could not complete. Please try again.', metaBatida: 'Target reached.',
      salvando: 'Saving…', salvo: 'Saved.',
      semResultado: 'No results for this search.',
      semConexao: 'No connection. Working offline.',
      rotaPerdida: 'Page not found.', sincronizando: 'Syncing…',
    },
  },

  'es': {
    cosmico: {
      carregando:  'apuntando justo a tu nicho',
      vazio:       'ninguna estrella encendida por aquí todavía… ¿encendemos la primera?',
      erro:        'una nebulosa se tragó eso, inténtalo de nuevo',
      metaBatida:  'tu empresa brilló hoy',
      salvando:    'guardando en la bóveda estelar…',
      salvo:       'guardado con seguridad',
      semResultado:'rastreamos el sector entero y no encontramos nada',
      semConexao:  'perdimos la señal de la base — trabajando sin conexión',
      rotaPerdida: 'ruta perdida — esta pantalla ya no existe',
      sincronizando:'sincronizando con la base…',
    },
    neutro: {
      carregando: 'Cargando…', vazio: 'No se encontraron registros.',
      erro: 'No se pudo completar. Inténtalo de nuevo.', metaBatida: 'Meta alcanzada.',
      salvando: 'Guardando…', salvo: 'Guardado.',
      semResultado: 'Sin resultados para esta búsqueda.',
      semConexao: 'Sin conexión. Trabajando sin conexión.',
      rotaPerdida: 'Página no encontrada.', sincronizando: 'Sincronizando…',
    },
  },
};

/** Saudação Viva (§68.1) — muda conforme a hora real do aparelho.
 *  As quatro faixas são as do Guia; o texto de cada uma é AGENTE. */
const SAUDACOES = {
  'pt-BR': {
    madrugada: 'Boa madrugada — o céu está profundo por aqui.',
    manha:     'Bom dia — o céu abriu.',
    tarde:     'Boa tarde — as estrelas do meio-dia ainda queimam.',
    noite:     'Boa noite — a constelação de hoje está se formando.',
  },
  'en': {
    madrugada: 'Good small hours — the sky runs deep right now.',
    manha:     'Good morning — the sky has opened.',
    tarde:     'Good afternoon — the midday stars are still burning.',
    noite:     'Good evening — today’s constellation is taking shape.',
  },
  'es': {
    madrugada: 'Buena madrugada — el cielo está profundo por aquí.',
    manha:     'Buenos días — el cielo se abrió.',
    tarde:     'Buenas tardes — las estrellas del mediodía siguen ardiendo.',
    noite:     'Buenas noches — la constelación de hoy se está formando.',
  },
};

export class SotaqueCosmico {
  /**
   * @param {object}  [opcoes]
   * @param {string}  [opcoes.idioma='pt-BR']
   * @param {boolean} [opcoes.ligado=true] o usuário pode desligar a
   *   personalidade — §21: "a Comunidade tem personalidade forte, mas o
   *   usuário pode desligar". Desligado, tudo cai no registro neutro.
   */
  constructor(opcoes = {}) {
    this.idioma = CATALOGO[opcoes.idioma] ? opcoes.idioma : 'pt-BR';
    this.ligado = opcoes.ligado !== false;
  }

  definirIdioma(idioma) {
    if (!CATALOGO[idioma]) throw new RangeError(`Idioma sem catálogo: ${idioma}`);
    this.idioma = idioma;
    return this;
  }

  /**
   * @param {string} chave    ex.: 'carregando', 'vazio', 'erro'
   * @param {string} [contexto='geral']  se crítico, o tom cai para neutro
   * @returns {string}
   */
  frase(chave, contexto = 'geral') {
    const cat = CATALOGO[this.idioma];
    const neutro = this.ehCritico(contexto) || !this.ligado;
    const banco = neutro ? cat.neutro : cat.cosmico;
    return banco[chave] ?? cat.neutro[chave] ?? '';
  }

  /** §70.3 — o humor não entra aqui. */
  ehCritico(contexto) {
    return CONTEXTOS_CRITICOS.has(String(contexto).toLowerCase());
  }

  /** Saudação Viva (§68.1). */
  saudacao(agora = new Date()) {
    const h = agora.getHours();
    const faixa = h < 6 ? 'madrugada' : h < 12 ? 'manha' : h < 18 ? 'tarde' : 'noite';
    return (SAUDACOES[this.idioma] || SAUDACOES['pt-BR'])[faixa];
  }

  /**
   * Aplica os microtextos ao DOM: todo elemento com [data-lum-texto] recebe a
   * frase da sua chave, respeitando [data-lum-contexto].
   *   <p data-lum-texto="vazio"></p>
   *   <p data-lum-texto="erro" data-lum-contexto="fiscal"></p>
   */
  aplicar(raiz = document) {
    for (const el of raiz.querySelectorAll('[data-lum-texto]')) {
      el.textContent = this.frase(
        el.dataset.lumTexto,
        el.dataset.lumContexto || 'geral',
      );
    }
    return this;
  }
}

export { CATALOGO, SAUDACOES };
