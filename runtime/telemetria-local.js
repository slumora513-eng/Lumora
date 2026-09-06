/* ==========================================================================
   Lumora — TELEMETRIA LOCAL DE DESEMPENHO (§72.1 item 4, APROVADO em
   02/09/2026: "fps/IndexedDB medidos no aparelho, sem analytics externo
   (LGPD); alimenta a otimização adaptativa §36")

   A §36 pede três coisas que só existiam pela metade no runtime:

     1. "A medição é contínua (FPS, long tasks, tempo de resposta)"
        -> o Céu Vivo media só FPS, e só enquanto estivesse desenhando.
     2. "se o aparelho sofrer, o sistema rebaixa o nível automaticamente
         COM AVISO DISCRETO"
        -> o rebaixamento existia; o aviso, não.
     3. "se sobrar recurso, PODE SUBIR"
        -> não existia. O Céu Vivo rebaixa uma vez e nunca mais volta.

   Aqui estão as três, mais a medição de armazenamento que a §72.1 item 4
   nomeia junto do fps.

   O QUE NÃO ACONTECE AQUI, e é o ponto da função: nada sai do aparelho.
   Não há fetch, XHR, sendBeacon, WebSocket nem imagem-pixel neste arquivo.
   A medida nasce, vive e morre no aparelho de quem usa (LGPD, §26/§37) — e
   `exportar()` existe para que a pessoa leve a própria medida embora, que é o
   Cofre de Portabilidade da §59.8 aplicado à telemetria.
   ========================================================================== */

'use strict';

/** Ordem dos níveis da §36, do mais leve ao mais completo. */
export const NIVEIS = ['basico', 'economico', 'pleno'];

const BANCO = 'lumora-telemetria';
const LOJA = 'medidas';

/* Histerese: descer é barato, subir é caro. Um aparelho que oscila em volta
   do limiar não pode ficar trocando de nível — a troca custa mais que o
   ganho. Por isso subir exige uma janela longa e limpa, e descer não. */
const PISO = { basico: 0, economico: 30, pleno: 45 };   // fps mínimo por nível
const JANELA_SUBIDA_MS = 30000;
const AMOSTRAS_PARA_SUBIR = 8;

export class TelemetriaLocal {
  /**
   * @param {object} [opcoes]
   * @param {string} [opcoes.nivel='pleno']       nível corrente (§36)
   * @param {string} [opcoes.tetoDoAparelho]      nível detectado na entrada;
   *        a subida nunca passa dele — o aparelho não melhora sozinho.
   * @param {HTMLElement} [opcoes.alvo=document.documentElement]
   *        onde os eventos `lum:nivel` e `lum:nivel-aviso` são despachados.
   * @param {boolean} [opcoes.persistir=true]     grava em IndexedDB local
   */
  constructor(opcoes = {}) {
    this.nivel = NIVEIS.includes(opcoes.nivel) ? opcoes.nivel : 'pleno';
    this.teto = NIVEIS.includes(opcoes.tetoDoAparelho) ? opcoes.tetoDoAparelho : this.nivel;
    this.alvo = opcoes.alvo || document.documentElement;
    this.persistirEmDisco = opcoes.persistir !== false;

    this.fps = null;
    this.amostras = [];            // { fps, em }
    this.longTasks = 0;
    this.piorLongTask = 0;
    this.armazenamento = null;     // { usoMb, cotaMb, fracao }
    this.aparelho = lerAparelho();
    this.trocas = [];              // histórico de mudanças de nível

    this._obs = null;
    this._raf = 0;
    this._quadros = [];
    this._boaDesde = 0;
  }

  /* ------------------------------------------------------------- medição */

  /** Liga a medição contínua: long tasks agora, fps quando houver quadros. */
  iniciar() {
    if (typeof PerformanceObserver === 'function') {
      try {
        this._obs = new PerformanceObserver((lista) => {
          for (const e of lista.getEntries()) {
            this.longTasks += 1;
            this.piorLongTask = Math.max(this.piorLongTask, Math.round(e.duration));
          }
        });
        this._obs.observe({ type: 'longtask', buffered: true });
      } catch { this._obs = null; }   // navegador sem longtask: segue sem ela
    }
    this.medirArmazenamento();
    return this;
  }

  /** Mede fps por conta própria, para telas que não têm Céu Vivo desenhando. */
  observarQuadros() {
    if (this._raf || typeof requestAnimationFrame !== 'function') return this;
    const laco = (t) => {
      this._quadros.push(t);
      if (this._quadros.length >= 60) {
        const janela = t - this._quadros[0];
        if (janela > 0) this.registrarFps((this._quadros.length - 1) / (janela / 1000));
        this._quadros.length = 0;
      }
      this._raf = requestAnimationFrame(laco);
    };
    this._raf = requestAnimationFrame(laco);
    return this;
  }

  /**
   * Registra uma medida de fps vinda de qualquer desenhista (o Céu Vivo é o
   * principal). É aqui que a §36 decide subir ou descer.
   * @param {number} fps
   * @returns {string|null} novo nível, se mudou
   */
  registrarFps(fps) {
    if (!Number.isFinite(fps) || fps <= 0) return null;
    this.fps = Math.round(fps);
    const em = agora();
    this.amostras.push({ fps: this.fps, em });
    if (this.amostras.length > 120) this.amostras.shift();

    const abaixo = NIVEIS.filter((n) => n !== 'basico' && fps < PISO[n]);
    if (abaixo.includes(this.nivel)) {
      this._boaDesde = 0;
      const i = NIVEIS.indexOf(this.nivel);
      return this._mudar(NIVEIS[Math.max(0, i - 1)], `fps ${this.fps}`);
    }

    // Subir: só se o aparelho sustentar o piso do nível ACIMA, por uma janela
    // longa e com amostras suficientes — e nunca acima do teto do aparelho.
    const i = NIVEIS.indexOf(this.nivel);
    const acima = NIVEIS[i + 1];
    if (!acima || NIVEIS.indexOf(acima) > NIVEIS.indexOf(this.teto)) { this._boaDesde = 0; return null; }
    if (fps < PISO[acima] + 10) { this._boaDesde = 0; return null; }   // margem, não empate
    if (!this._boaDesde) { this._boaDesde = em; return null; }
    const boas = this.amostras.filter((a) => a.em >= this._boaDesde && a.fps >= PISO[acima] + 10);
    if (em - this._boaDesde < JANELA_SUBIDA_MS || boas.length < AMOSTRAS_PARA_SUBIR) return null;
    this._boaDesde = 0;
    return this._mudar(acima, `fps estável em ${this.fps}`);
  }

  /** §72.1 item 4 nomeia o IndexedDB junto do fps: quanto o aparelho aguenta. */
  async medirArmazenamento() {
    try {
      const e = await navigator.storage?.estimate?.();
      if (!e) return null;
      this.armazenamento = {
        usoMb: Math.round((e.usage || 0) / 1048576),
        cotaMb: Math.round((e.quota || 0) / 1048576),
        fracao: e.quota ? Number(((e.usage || 0) / e.quota).toFixed(4)) : null,
      };
      return this.armazenamento;
    } catch { return null; }
  }

  /* -------------------------------------------------------------- nível */

  /** Troca de nível com o aviso discreto que a §36 exige. */
  _mudar(novo, motivo) {
    if (novo === this.nivel || !NIVEIS.includes(novo)) return null;
    const antes = this.nivel;
    const subiu = NIVEIS.indexOf(novo) > NIVEIS.indexOf(antes);
    this.nivel = novo;
    this.trocas.push({ de: antes, para: novo, motivo, em: agora() });
    if (this.trocas.length > 40) this.trocas.shift();
    document.documentElement.dataset.lumNivel = novo;

    const detalhe = { nivel: novo, anterior: antes, subiu, motivo, fps: this.fps };
    this.alvo.dispatchEvent(new CustomEvent('lum:nivel', { detail: detalhe, bubbles: true }));
    // §36: "rebaixa o nível automaticamente com aviso discreto". Discreto é
    // adjetivo de forma, não licença para calar: quem escuta este evento
    // anuncia em texto, porque efeito visual sozinho não é aviso (§35 item 3).
    this.alvo.dispatchEvent(new CustomEvent('lum:nivel-aviso', {
      detail: { ...detalhe, texto: textoDoAviso(novo, subiu) }, bubbles: true,
    }));
    this.persistir();
    return novo;
  }

  /* ------------------------------------------------------------ relatório */

  relatorio() {
    const f = this.amostras.map((a) => a.fps);
    return {
      versao: 1,
      em: new Date().toISOString(),
      nivel: this.nivel,
      teto: this.teto,
      fps: { atual: this.fps, minimo: f.length ? Math.min(...f) : null, mediana: mediana(f), amostras: f.length },
      longTasks: { total: this.longTasks, pior: this.piorLongTask },
      armazenamento: this.armazenamento,
      aparelho: this.aparelho,
      trocas: this.trocas.slice(),
    };
  }

  /** LGPD/§59.8: a medida é da pessoa, e ela leva embora se quiser. */
  exportar() { return JSON.stringify(this.relatorio(), null, 2); }

  /* -------------------------------------------------------------- disco */

  async persistir() {
    if (!this.persistirEmDisco) return false;
    try {
      const db = await abrirBanco();
      if (!db) return false;
      await escrever(db, this.relatorio());
      db.close();
      return true;
    } catch { return false; }   // modo privado, cota estourada: segue medindo
  }

  /** Últimas medidas guardadas no aparelho. Nunca saiu daqui. */
  async historico(limite = 20) {
    try {
      const db = await abrirBanco();
      if (!db) return [];
      const tudo = await ler(db);
      db.close();
      return tudo.slice(-limite);
    } catch { return []; }
  }

  async limpar() {
    try {
      const db = await abrirBanco();
      if (!db) return false;
      await new Promise((ok, erro) => {
        const t = db.transaction(LOJA, 'readwrite');
        t.objectStore(LOJA).clear();
        t.oncomplete = ok; t.onerror = () => erro(t.error);
      });
      db.close();
      return true;
    } catch { return false; }
  }

  destruir() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    try { this._obs?.disconnect(); } catch { /* já desconectado */ }
    this._obs = null;
  }
}

/* ------------------------------------------------------------------ apoio */

const agora = () => (typeof performance === 'object' ? performance.now() : Date.now());

function mediana(v) {
  if (!v.length) return null;
  const s = v.slice().sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

/** Só as pistas locais que a §36 nomeia. Nenhuma delas identifica alguém. */
function lerAparelho() {
  return {
    nucleos: navigator.hardwareConcurrency || null,
    memoriaGb: navigator.deviceMemory || null,
    economiaDeDados: navigator.connection?.saveData ?? null,
    tipoDeRede: navigator.connection?.effectiveType ?? null,
    movimentoReduzido: typeof matchMedia === 'function'
      ? matchMedia('(prefers-reduced-motion: reduce)').matches : null,
  };
}

/** (AGENTE — a §36 pede "aviso discreto" e não escreve o texto dele.) */
function textoDoAviso(nivel, subiu) {
  const nome = { basico: 'básico', economico: 'econômico', pleno: 'pleno' }[nivel] || nivel;
  return subiu
    ? `Sobrou fôlego no aparelho: os efeitos voltaram ao nível ${nome}.`
    : `Aliviei os efeitos para o nível ${nome} — o aparelho estava sofrendo.`;
}

/* ------------------------------------------------------------- IndexedDB */

function abrirBanco() {
  if (typeof indexedDB !== 'object' || !indexedDB) return Promise.resolve(null);
  return new Promise((ok) => {
    let p;
    try { p = indexedDB.open(BANCO, 1); } catch { ok(null); return; }
    p.onupgradeneeded = () => {
      const db = p.result;
      if (!db.objectStoreNames.contains(LOJA)) {
        db.createObjectStore(LOJA, { keyPath: 'id', autoIncrement: true });
      }
    };
    p.onsuccess = () => ok(p.result);
    p.onerror = () => ok(null);
    p.onblocked = () => ok(null);
  });
}

function escrever(db, registro) {
  return new Promise((ok, erro) => {
    const t = db.transaction(LOJA, 'readwrite');
    t.objectStore(LOJA).add(registro);
    t.oncomplete = ok;
    t.onerror = () => erro(t.error);
  });
}

function ler(db) {
  return new Promise((ok, erro) => {
    const t = db.transaction(LOJA, 'readonly');
    const p = t.objectStore(LOJA).getAll();
    p.onsuccess = () => ok(p.result || []);
    p.onerror = () => erro(p.error);
  });
}
