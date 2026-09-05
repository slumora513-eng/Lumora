/* ==========================================================================
   Lumora — ANIMAÇÕES DOS SLOTS (§18 / §49)
   Liberadas pelo Fundador em 05/09/2026: "o pode ir vale pras animações
   também, pode fazer tudo".

   ---------------------------------------------------------------------------
   FORMA DA ENTREGA — leia antes de mexer
   ---------------------------------------------------------------------------
   §48 proíbe uma coisa específica: "nenhuma nova GERAÇÃO DE IMAGEM, VÍDEO OU
   ÁUDIO será feita pela plataforma". Nenhum arquivo de mídia foi gerado aqui.

   O que existe neste arquivo são CENAS PROCEDURAIS em Canvas 2D — código, no
   mesmo meio que a §65.5 decidiu para toda a estética ("Canvas 2D + WebGL...
   física de bolhas em JS puro, sem bibliotecas") e que a §71 exige por leveza
   ("tudo em CSS/JS e texto, sem gerar novos assets de mídia").

   Elas entram no sistema de slots da §49 como a versão "1", com
   `fonte: "procedural-lumora"`. Quando o profissional contratado entregar os
   vídeos finais (§48/§64.2), eles entram como versão superior no manifest e
   passam a ativos — SEM tocar em uma linha de código, que é exatamente o que
   a §49.3 desenhou ("troca sem deploy"). A versão procedural continua como o
   fallback obrigatório que a §49.3 exige.

   Ou seja: isto não substitui o profissional. É o slot preenchido e vivo até
   ele chegar, e a rede de segurança depois que chegar.

   ---------------------------------------------------------------------------
   BRIEFINGS — todos textuais do Guia (§18 / §49.1)
   ---------------------------------------------------------------------------
   abertura.elio        bolhinhas se juntando até formar a bolha principal
   abertura.aurora      a noite chega e a aurora boreal se forma e se move
   abertura.rotacerta   horizonte com veículos em silhueta azul e zoom out
   abertura.business    céu estrelado puro, sem motivo extra (Fundador, 05/09/2026)
   abertura.ecossistema versão épica unindo os sistemas
   abertura.hub         bolha central com conexões no estilo de neurônios
   loading.criar_mundo  "criando o seu novo mundo" — bolha vira planeta
   loading.otimizar     "otimizando o seu sistema" — bolha vira engrenagens
   loading.migra_elio   bolha puxa pastas/papéis/dados com efeito splash
   loading.migra_aurora informações nadando em rio de aurora boreal
   loading.nicho        "acertando em cheio o seu nicho" — bola entrando no gol

   §35 item 8: nada pisca mais de 3x por segundo em nenhuma destas cenas.
   §49.3: com prefers-reduced-motion, mostra o PÔSTER ESTÁTICO (quadro final).
   ========================================================================== */

'use strict';

const TAU = Math.PI * 2;
const ease = (t) => 1 - Math.pow(1 - t, 3);            // cubic-out
const easeInOut = (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
const clamp01 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
/** Progresso de um trecho da cena: 0 antes de `de`, 1 depois de `ate`. */
const trecho = (t, de, ate) => clamp01((t - de) / (ate - de));

/* Cores da identidade — medidas nos assets oficiais (docs/10-paleta.md). */
const C = {
  fundo: '#00040F',
  violeta: '#B01DFF',
  azul: '#0072FF',
  auroraVerde: '#2BCF92',
  auroraTeal: '#1D8FC5',
  auroraVioleta: '#8541FA',
  businessVerde: '#16E793',
  rotaAmbar: '#FFA238',
  texto: '#FFFFFF',
};

/* ---------------------------------------------------------------- pincéis */

function limpar(ctx, L, A, cor = C.fundo) {
  ctx.fillStyle = cor;
  ctx.fillRect(0, 0, L, A);
}

/** Campo de estrelas determinístico — a mesma abertura sempre tem o mesmo céu. */
function estrelas(ctx, L, A, n, semente = 1, alfa = 1) {
  let s = semente;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) {
    const x = r() * L, y = r() * A, raio = r() * 1.1 + 0.3;
    ctx.fillStyle = `rgba(226,236,255,${(alfa * (0.25 + r() * 0.5)).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, raio, 0, TAU);
    ctx.fill();
  }
}

/** Bolha Liquid Glass (§65: "bolhas translúcidas com a estética Liquid Glass
 *  / luz / espaço").
 *
 *  Vidro, não planeta: o corpo é quase transparente — o céu tem que continuar
 *  visível ATRAVÉS da bolha. O que a torna legível é o aro de refração (mais
 *  aceso na borda oposta à luz) e um especular pequeno e suave, não um
 *  preenchimento opaco. */
function bolha(ctx, x, y, raio, alfa = 1, corA = C.violeta, corB = C.azul) {
  if (raio <= 0.2 || alfa <= 0) return;
  ctx.save();
  ctx.globalAlpha = alfa;

  // 1. Corpo: quase transparente, com a cor concentrada na borda (o miolo do
  //    vidro é o que menos desvia a luz).
  const corpo = ctx.createRadialGradient(x, y, raio * 0.05, x, y, raio);
  corpo.addColorStop(0, hexA(corA, 0.05));
  corpo.addColorStop(0.62, hexA(corA, 0.09));
  corpo.addColorStop(0.88, hexA(corB, 0.20));
  corpo.addColorStop(1, hexA(corB, 0.30));
  ctx.fillStyle = corpo;
  ctx.beginPath();
  ctx.arc(x, y, raio, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // 2. Aro de refração: fino, e mais aceso embaixo-à-direita, onde a luz
  //    atravessa e sai — é isso que dá volume sem fechar o vidro.
  const aro = ctx.createLinearGradient(x - raio, y - raio, x + raio, y + raio);
  aro.addColorStop(0, 'rgba(255,255,255,0.30)');
  aro.addColorStop(0.45, hexA(corA, 0.28));
  aro.addColorStop(1, 'rgba(255,255,255,0.85)');
  ctx.strokeStyle = aro;
  ctx.lineWidth = Math.max(0.8, raio * 0.030);
  ctx.beginPath();
  ctx.arc(x, y, raio * 0.985, 0, TAU);
  ctx.stroke();

  // 3. Especular: pequeno e com queda suave, nunca um disco branco chapado.
  const ex = x - raio * 0.36, ey = y - raio * 0.42;
  const esp = ctx.createRadialGradient(ex, ey, 0, ex, ey, raio * 0.30);
  esp.addColorStop(0, 'rgba(255,255,255,0.80)');
  esp.addColorStop(0.45, 'rgba(255,255,255,0.22)');
  esp.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = esp;
  ctx.beginPath();
  ctx.ellipse(ex, ey, raio * 0.30, raio * 0.21, -0.6, 0, TAU);
  ctx.fill();

  // 4. Contraluz: um fio de luz na borda inferior — a "gota" de vidro.
  const cl = ctx.createRadialGradient(
    x + raio * 0.30, y + raio * 0.44, 0, x + raio * 0.30, y + raio * 0.44, raio * 0.42);
  cl.addColorStop(0, hexA(corB, 0.42));
  cl.addColorStop(1, hexA(corB, 0));
  ctx.fillStyle = cl;
  ctx.beginPath();
  ctx.arc(x, y, raio, 0, TAU);
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16),
        g = parseInt(h.slice(2, 4), 16),
        b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/** Cortina vertical de aurora — mesma matéria da Aurora (§65.2, nunca bolha). */
function cortinaAurora(ctx, L, A, cx, larg, cor, fase, alfa, topo, base) {
  const g = ctx.createLinearGradient(0, topo, 0, base);
  g.addColorStop(0, hexA(cor, 0));
  g.addColorStop(0.30, hexA(cor, 0.34 * alfa));
  g.addColorStop(0.65, hexA(cor, 0.16 * alfa));
  g.addColorStop(1, hexA(cor, 0));
  ctx.fillStyle = g;
  const desl = (y) => Math.sin(y / 120 + fase) * larg * 0.5
                    + Math.sin(y / 44 + fase * 1.6) * larg * 0.13;
  ctx.beginPath();
  for (let y = topo; y <= base; y += 8) {
    const f = (y - topo) / (base - topo);
    const x = cx + desl(y) - larg * (0.45 + f * 0.35);
    if (y === topo) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  for (let y = base; y >= topo; y -= 8) {
    const f = (y - topo) / (base - topo);
    ctx.lineTo(cx + desl(y) + larg * (0.45 + f * 0.35), y);
  }
  ctx.closePath();
  ctx.fill();
}

function texto(ctx, txt, x, y, tam, alfa, peso = '600') {
  if (alfa <= 0) return;
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.fillStyle = C.texto;
  ctx.font = `${peso} ${tam}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, x, y);
  ctx.restore();
}

/* =========================================================================
   CENAS — cada uma recebe (ctx, t, L, A) com t de 0 a 1
   ========================================================================= */

const CENAS = {

  /* ---- abertura.elio — "bolhinhas se juntando até formar a bolha principal"
     §18/§49.1. Fala ao final: "Olá, eu sou o Elio." (a voz é do profissional
     contratado, §48 — aqui só a legenda, que §45 exige em paralelo ao som). */
  'abertura.elio'(ctx, t, L, A) {
    limpar(ctx, L, A);
    estrelas(ctx, L, A, 90, 7, trecho(t, 0, 0.3));

    const cx = L / 2, cy = A * 0.46;
    const raioFinal = Math.min(L, A) * 0.17;
    const N = 14;
    const conv = ease(trecho(t, 0.05, 0.62));   // convergência
    const fusao = ease(trecho(t, 0.55, 0.80));  // fusão na bolha principal

    // As bolhinhas vêm de fora e convergem
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * TAU + i * 0.7;
      const distIni = Math.min(L, A) * (0.55 + (i % 4) * 0.11);
      const dist = distIni * (1 - conv);
      const r = raioFinal * (0.16 + (i % 3) * 0.05) * (1 - fusao * 0.85);
      if (r <= 0.3) continue;
      // leve órbita enquanto viaja: inércia líquida (§70.2)
      const giro = ang + conv * 1.1;
      bolha(ctx, cx + Math.cos(giro) * dist, cy + Math.sin(giro) * dist,
            r, 1 - fusao * 0.6);
    }

    // A bolha principal nasce da fusão e assenta respirando
    if (fusao > 0) {
      const respira = 1 + Math.sin(t * TAU * 1.6) * 0.03 * trecho(t, 0.8, 1);
      bolha(ctx, cx, cy, raioFinal * fusao * respira, 1);
    }

    // Halo de assentamento
    const halo = trecho(t, 0.72, 0.92);
    if (halo > 0 && halo < 1) {
      ctx.strokeStyle = hexA(C.violeta, 0.5 * (1 - halo));
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, raioFinal * (1 + halo * 1.6), 0, TAU);
      ctx.stroke();
    }

    texto(ctx, 'Olá, eu sou o Elio.', cx, cy + raioFinal + A * 0.14,
          Math.max(15, A * 0.045), ease(trecho(t, 0.80, 0.97)));
  },

  /* ---- abertura.aurora — "a noite chega e a aurora se forma e se move"
     §1/§18. Aurora é aurora boreal, NUNCA bolha (§60.11). */
  'abertura.aurora'(ctx, t, L, A) {
    // A noite chegando: o céu escurece de um azul crepuscular ao Deep Space
    const noite = ease(trecho(t, 0, 0.34));
    const g = ctx.createLinearGradient(0, 0, 0, A);
    g.addColorStop(0, misturar('#0E2A47', '#00040F', noite));
    g.addColorStop(1, misturar('#061726', '#000006', noite));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L, A);

    estrelas(ctx, L, A, 130, 13, ease(trecho(t, 0.18, 0.55)));

    // A aurora se forma e se move
    const forma = ease(trecho(t, 0.28, 0.72));
    if (forma > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const cores = [C.auroraVerde, C.auroraTeal, C.auroraVioleta];
      for (let c = 0; c < 3; c++) {
        const fase = t * 5 + c * 2.2;
        const cx = L * (0.26 + c * 0.24) + Math.sin(t * 3 + c) * L * 0.05;
        cortinaAurora(ctx, L, A, cx, L * 0.16, cores[c], fase,
                      forma, A * 0.04, A * 0.66);
      }
      ctx.restore();
    }

    texto(ctx, 'Olá, eu sou Aurora.', L / 2, A * 0.78,
          Math.max(15, A * 0.045), ease(trecho(t, 0.62, 0.80)));
    texto(ctx, 'Que minha luz domine o seu negócio.', L / 2, A * 0.86,
          Math.max(13, A * 0.036), ease(trecho(t, 0.74, 0.92)), '400');
  },

  /* ---- abertura.rotacerta — "horizonte com veículos em silhueta azul e
     zoom out" §18/§49.1. Complementa a assinatura GPS espacial (§65.1). */
  'abertura.rotacerta'(ctx, t, L, A) {
    limpar(ctx, L, A);
    const zoom = ease(trecho(t, 0.15, 0.9));      // câmera afastando
    const escala = 1.9 - zoom * 0.9;

    estrelas(ctx, L, A, 120, 21, ease(trecho(t, 0.35, 0.85)));

    ctx.save();
    ctx.translate(L / 2, A * 0.62);
    ctx.scale(escala, escala);
    ctx.translate(-L / 2, -A * 0.62);

    // Brilho do horizonte
    const hy = A * 0.62;
    const gh = ctx.createLinearGradient(0, hy - A * 0.20, 0, hy + A * 0.06);
    gh.addColorStop(0, hexA(C.azul, 0));
    gh.addColorStop(0.75, hexA(C.azul, 0.30));
    gh.addColorStop(1, hexA('#7FD8FF', 0.55));
    ctx.fillStyle = gh;
    ctx.fillRect(0, hy - A * 0.20, L, A * 0.26);

    // Linha do horizonte
    ctx.strokeStyle = hexA('#9FE4FF', 0.85);
    ctx.lineWidth = 1.4 / escala;
    ctx.beginPath();
    ctx.moveTo(0, hy);
    ctx.lineTo(L, hy);
    ctx.stroke();

    // Veículos em silhueta azul, cruzando o horizonte
    const veic = [
      { x: 0.28, w: 0.085, h: 0.042, v: 0.16 },
      { x: 0.52, w: 0.105, h: 0.050, v: 0.11 },
      { x: 0.74, w: 0.072, h: 0.036, v: 0.20 },
    ];
    for (const vc of veic) {
      const px = ((vc.x + t * vc.v) % 1.25 - 0.12) * L;
      const w = vc.w * L, h = vc.h * A;
      ctx.fillStyle = hexA('#1B4C8F', 0.95);
      // corpo + cabine, silhueta simples
      ctx.beginPath();
      ctx.roundRect(px, hy - h, w, h, h * 0.22);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(px + w * 0.58, hy - h * 1.55, w * 0.34, h * 0.60, h * 0.18);
      ctx.fill();
      // rastro de navegação (§65.1)
      const gt = ctx.createLinearGradient(px - w * 0.9, 0, px, 0);
      gt.addColorStop(0, hexA(C.rotaAmbar, 0));
      gt.addColorStop(1, hexA(C.rotaAmbar, 0.55));
      ctx.fillStyle = gt;
      ctx.fillRect(px - w * 0.9, hy - h * 0.42, w * 0.9, h * 0.10);
    }
    ctx.restore();

    // Rota luminosa ligando waypoints em constelação (§65.1)
    const rota = ease(trecho(t, 0.55, 0.95));
    if (rota > 0) {
      const pts = [[0.16, 0.30], [0.34, 0.22], [0.52, 0.31], [0.70, 0.21], [0.86, 0.28]];
      ctx.save();
      ctx.strokeStyle = hexA(C.rotaAmbar, 0.75);
      ctx.lineWidth = 1.6;
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      const total = pts.length - 1;
      ctx.moveTo(pts[0][0] * L, pts[0][1] * A);
      for (let i = 1; i <= total; i++) {
        const f = clamp01(rota * total - (i - 1));
        const a = pts[i - 1], b = pts[i];
        ctx.lineTo((a[0] + (b[0] - a[0]) * f) * L, (a[1] + (b[1] - a[1]) * f) * A);
        if (f < 1) break;
      }
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i <= total * rota; i++) {
        ctx.fillStyle = hexA(C.rotaAmbar, 0.95);
        ctx.beginPath();
        ctx.arc(pts[i][0] * L, pts[i][1] * A, 3, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    texto(ctx, 'RotaCerta', L / 2, A * 0.84, Math.max(17, A * 0.055),
          ease(trecho(t, 0.68, 0.92)));
  },

  /* ---- abertura.business — "céu estrelado puro"
     BRIEFING OFICIAL, definido pelo Fundador em 05/09/2026, resolvendo a
     ESCALACOES §5. Substitui o original ("gota de aquarela se espalhando
     formando o nome"), revogado com a aquarela em §60.1.

     A cena É o Céu Vivo do Business: estrelas, partículas e constelações
     (§65.1), SEM MOTIVO EXTRA. Por isso nada voa, converge nem se monta —
     um movimento de montagem seria justamente o "motivo extra" que a §65.1
     exclui. O que acontece é o que o céu já faz: as estrelas acendem onde
     estão (§70.1, "cada ação acende uma estrela") e a constelação se desenha
     entre elas (§71.1, a Constelação do Dia).

     Fixa, sem variação por horário: §44 registra que a animação de
     inicialização de um sistema é sempre a mesma. */
  'abertura.business'(ctx, t, L, A) {
    limpar(ctx, L, A);
    const cx = L / 2;

    // 1. O céu se revela — as estrelas de fundo acendem onde já estão.
    estrelas(ctx, L, A, 160, 5, ease(trecho(t, 0, 0.45)));

    // 2. Partículas do Céu Vivo, à deriva (§65.1: "estrelas, partículas").
    const part = ease(trecho(t, 0.15, 0.55));
    if (part > 0) {
      let s = 421;
      const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 22; i++) {
        const x = rnd() * L;
        const y = (rnd() * A + t * A * 0.10) % A;
        const a = part * (0.25 + rnd() * 0.45);
        ctx.fillStyle = hexA(C.businessVerde, a * 0.55);
        ctx.beginPath();
        ctx.arc(x, y, 0.9 + rnd() * 1.5, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. As estrelas da constelação acendem UMA A UMA, nos lugares delas.
    // Espaçamento irregular de propósito: constelação real não é zigue-zague
    // de passo uniforme, e o céu do Business não deve parecer um gráfico.
    const pontos = [[0.28, 0.31], [0.37, 0.49], [0.46, 0.27], [0.58, 0.44], [0.72, 0.35]]
      .map(([px, py]) => [px * L, py * A]);

    const acende = trecho(t, 0.30, 0.68);
    pontos.forEach(([x, y], i) => {
      const f = clamp01(acende * pontos.length - i);
      if (f <= 0) return;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
      g.addColorStop(0, hexA('#FFFFFF', f));
      g.addColorStop(0.30, hexA(C.businessVerde, 0.55 * f));
      g.addColorStop(1, hexA(C.businessVerde, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, TAU);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${f.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, TAU);
      ctx.fill();
    });

    // 4. A constelação se desenha entre elas.
    const liga = ease(trecho(t, 0.58, 0.86));
    if (liga > 0) {
      ctx.strokeStyle = hexA(C.businessVerde, 0.55);
      ctx.lineWidth = 1.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const total = pontos.length - 1;
      ctx.moveTo(pontos[0][0], pontos[0][1]);
      for (let i = 1; i <= total; i++) {
        const f = clamp01(liga * total - (i - 1));
        const a = pontos[i - 1], b = pontos[i];
        ctx.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f);
        if (f < 1) break;
      }
      ctx.stroke();
    }

    texto(ctx, 'Lumora Business', cx, A * 0.80, Math.max(17, A * 0.055),
          ease(trecho(t, 0.70, 0.94)));
  },

  /* ---- abertura.ecossistema — "versão épica unindo os sistemas" §18.
     O Ecossistema NÃO é soma de logos: os três sistemas orbitam e são
     recolhidos por uma bolha única. */
  'abertura.ecossistema'(ctx, t, L, A) {
    limpar(ctx, L, A);
    estrelas(ctx, L, A, 150, 33, ease(trecho(t, 0, 0.25)));

    const cx = L / 2, cy = A * 0.46;
    const R = Math.min(L, A) * 0.26;
    const orbita = ease(trecho(t, 0.05, 0.55));
    const recolhe = ease(trecho(t, 0.52, 0.82));
    const sistemas = [
      { cor: C.businessVerde, ang: 0 },
      { cor: C.rotaAmbar, ang: TAU / 3 },
      { cor: C.auroraVioleta, ang: (TAU / 3) * 2 },
    ];

    // Anéis orbitais
    ctx.save();
    ctx.globalAlpha = orbita * (1 - recolhe);
    ctx.strokeStyle = hexA(C.violeta, 0.28);
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 1.2 + i * 1.05);
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 1.05, R * 0.40, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // Os três sistemas convergem para o centro
    for (const sis of sistemas) {
      const ang = sis.ang + t * 2.4;
      const raio = R * orbita * (1 - recolhe);
      const x = cx + Math.cos(ang) * raio, y = cy + Math.sin(ang) * raio * 0.55;
      const r = Math.min(L, A) * 0.045 * orbita;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4);
      g.addColorStop(0, hexA('#FFFFFF', 0.9));
      g.addColorStop(0.35, hexA(sis.cor, 0.75));
      g.addColorStop(1, hexA(sis.cor, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.4, 0, TAU);
      ctx.fill();
    }

    // A bolha única que recolhe tudo — integração, não justaposição
    if (recolhe > 0) {
      bolha(ctx, cx, cy, Math.min(L, A) * 0.20 * recolhe, 1);
    }

    texto(ctx, 'Lumora Ecossistema', cx, A * 0.82, Math.max(17, A * 0.055),
          ease(trecho(t, 0.76, 0.96)));
  },

  /* ---- abertura.hub — "bolha central com conexões no estilo de neurônios"
     §18. Uso INTERNO (§17): o Hub nunca é produto do catálogo. */
  'abertura.hub'(ctx, t, L, A) {
    limpar(ctx, L, A);
    const cx = L / 2, cy = A * 0.47;
    const R = Math.min(L, A) * 0.15;
    const cresce = ease(trecho(t, 0.05, 0.45));
    const rede = ease(trecho(t, 0.30, 0.85));

    // Nós da rede neural
    const N = 12;
    const nos = [];
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * TAU + 0.4;
      const d = R * (2.1 + (i % 3) * 0.55);
      nos.push([cx + Math.cos(ang) * d, cy + Math.sin(ang) * d * 0.78]);
    }

    // Conexões crescendo do núcleo para fora
    ctx.lineWidth = 1;
    for (let i = 0; i < N; i++) {
      const f = clamp01(rede * 1.5 - i * 0.045);
      if (f <= 0) continue;
      const [nx, ny] = nos[i];
      ctx.strokeStyle = hexA(C.auroraTeal, 0.45 * f);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + (nx - cx) * f, cy + (ny - cy) * f);
      ctx.stroke();
      // conexões laterais entre nós — o "estilo de neurônios"
      if (f > 0.9 && i % 2 === 0) {
        const [mx, my] = nos[(i + 3) % N];
        ctx.strokeStyle = hexA(C.auroraVioleta, 0.22);
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(mx, my);
        ctx.stroke();
      }
      // satélite-bolha na ponta (§65.1: "satélites-bolha")
      if (f > 0.85) bolha(ctx, nx, ny, R * 0.16, (f - 0.85) / 0.15);
    }

    // Núcleo de luz (§65.1: "um núcleo de luz na base")
    if (cresce > 0) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 2.2 * cresce);
      g.addColorStop(0, hexA('#FFFFFF', 0.85));
      g.addColorStop(0.25, hexA(C.auroraVioleta, 0.55));
      g.addColorStop(1, hexA(C.auroraTeal, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 2.2 * cresce, 0, TAU);
      ctx.fill();
      bolha(ctx, cx, cy, R * cresce, 1, C.auroraVioleta, C.auroraTeal);
    }

    texto(ctx, 'Lumora Hub', cx, A * 0.84, Math.max(16, A * 0.05),
          ease(trecho(t, 0.70, 0.92)));
    texto(ctx, 'uso interno', cx, A * 0.90, Math.max(11, A * 0.030),
          ease(trecho(t, 0.78, 0.96)) * 0.75, '400');
  },

  /* ---- loading.criar_mundo — "bolha vira planeta" §2/§49.1 */
  'loading.criar_mundo'(ctx, t, L, A) {
    limpar(ctx, L, A);
    estrelas(ctx, L, A, 70, 3, 0.7);
    const cx = L / 2, cy = A * 0.45, R = Math.min(L, A) * 0.17;
    const vira = easeInOut(clamp01(t * 1.4));

    bolha(ctx, cx, cy, R, 1 - vira * 0.55);

    if (vira > 0.1) {
      ctx.save();
      ctx.globalAlpha = vira;
      // corpo do planeta
      const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
      g.addColorStop(0, '#7FD8FF');
      g.addColorStop(0.55, C.azul);
      g.addColorStop(1, '#0A1F5C');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.fill();
      // faixas do planeta, recortadas no disco
      ctx.save();
      ctx.clip();
      ctx.fillStyle = hexA(C.businessVerde, 0.32);
      for (let i = -2; i <= 2; i++) {
        const y = cy + i * R * 0.34 + Math.sin(t * 4 + i) * R * 0.04;
        ctx.fillRect(cx - R, y, R * 2, R * 0.16);
      }
      ctx.restore();
      // anel
      ctx.strokeStyle = hexA(C.violeta, 0.65);
      ctx.lineWidth = Math.max(1.5, R * 0.07);
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 1.55, R * 0.40, -0.42 + t * 0.4, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    texto(ctx, 'criando o seu novo mundo', cx, A * 0.80,
          Math.max(13, A * 0.042), 0.9, '500');
  },

  /* ---- loading.otimizar — "bolha vira engrenagens" §36/§49.1 */
  'loading.otimizar'(ctx, t, L, A) {
    limpar(ctx, L, A);
    const cx = L / 2, cy = A * 0.45, R = Math.min(L, A) * 0.13;
    const vira = easeInOut(clamp01(t * 1.4));
    bolha(ctx, cx, cy, R * 1.25, 1 - vira * 0.7);

    const engrenagem = (x, y, raio, dentes, giro, cor) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(giro);
      ctx.fillStyle = cor;
      ctx.beginPath();
      for (let i = 0; i < dentes * 2; i++) {
        const r = i % 2 === 0 ? raio : raio * 0.78;
        const a = (i / (dentes * 2)) * TAU;
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      // furo central
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(0, 0, raio * 0.34, 0, TAU);
      ctx.fill();
      ctx.restore();
    };

    if (vira > 0.05) {
      ctx.save();
      ctx.globalAlpha = vira;
      engrenagem(cx - R * 0.55, cy, R, 10, t * 4.2, hexA(C.violeta, 0.9));
      engrenagem(cx + R * 0.85, cy - R * 0.5, R * 0.66, 8, -t * 6.0,
                 hexA(C.azul, 0.9));
      engrenagem(cx + R * 0.5, cy + R * 0.85, R * 0.48, 7, -t * 8.0,
                 hexA(C.auroraTeal, 0.85));
      ctx.restore();
    }
    texto(ctx, 'otimizando o seu sistema', cx, A * 0.80,
          Math.max(13, A * 0.042), 0.9, '500');
  },

  /* ---- loading.migra_elio — "bolha puxa pastas/papéis/dados com efeito
     splash" §3/§49.1 */
  'loading.migra_elio'(ctx, t, L, A) {
    limpar(ctx, L, A);
    const cx = L / 2, cy = A * 0.45, R = Math.min(L, A) * 0.15;

    // Papéis sendo puxados para dentro da bolha
    const N = 9;
    for (let i = 0; i < N; i++) {
      const p = ((t * 1.25 + i / N) % 1);
      const ang = (i / N) * TAU + i * 1.3;
      const d = (1 - ease(p)) * Math.min(L, A) * 0.52 + R * 0.35;
      const x = cx + Math.cos(ang) * d, y = cy + Math.sin(ang) * d * 0.8;
      const w = R * 0.34 * (1 - p * 0.45), h = w * 1.28;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang + p * 2.2);
      ctx.globalAlpha = p < 0.88 ? 1 : (1 - p) / 0.12;
      ctx.fillStyle = 'rgba(226,236,255,0.92)';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, w * 0.10);
      ctx.fill();
      ctx.fillStyle = hexA(C.azul, 0.55);
      for (let l = 0; l < 3; l++) {
        ctx.fillRect(-w * 0.30, -h * 0.26 + l * h * 0.22, w * 0.60, h * 0.06);
      }
      ctx.restore();
    }

    // Splash: ondas concêntricas quando algo entra
    const splash = (t * 2.4) % 1;
    ctx.strokeStyle = hexA('#FFFFFF', 0.35 * (1 - splash));
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R * (1 + splash * 0.7), 0, TAU);
    ctx.stroke();

    bolha(ctx, cx, cy, R * (1 + Math.sin(t * TAU * 2.2) * 0.035), 1);
    texto(ctx, 'trazendo os seus dados', cx, A * 0.80,
          Math.max(13, A * 0.042), 0.9, '500');
  },

  /* ---- loading.migra_aurora — "informações nadando em rio de aurora boreal"
     §3/§49.1 */
  'loading.migra_aurora'(ctx, t, L, A) {
    limpar(ctx, L, A);
    estrelas(ctx, L, A, 60, 11, 0.6);
    const cy = A * 0.45;

    // O rio de aurora — faixa horizontal ondulante
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const cores = [C.auroraVerde, C.auroraTeal, C.auroraVioleta];
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = hexA(cores[c], 0.20);
      ctx.beginPath();
      ctx.moveTo(0, A);
      for (let x = 0; x <= L; x += 10) {
        const y = cy + Math.sin(x / 90 + t * 5 + c * 1.5) * A * 0.075
                     + c * A * 0.045 - A * 0.05;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      for (let x = L; x >= 0; x -= 10) {
        const y = cy + Math.sin(x / 90 + t * 5 + c * 1.5) * A * 0.075
                     + c * A * 0.045 + A * 0.09;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // As informações nadando no rio
    for (let i = 0; i < 12; i++) {
      const p = ((t * 0.9 + i / 12) % 1);
      const x = p * (L + 60) - 30;
      const y = cy + Math.sin(x / 90 + t * 5) * A * 0.075 + A * 0.02;
      const w = 16, h = 20;
      ctx.save();
      ctx.globalAlpha = Math.sin(p * Math.PI) * 0.95;
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * 4 + i) * 0.25);
      ctx.fillStyle = 'rgba(240,248,255,0.95)';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 2);
      ctx.fill();
      ctx.restore();
    }
    texto(ctx, 'as informações estão nadando até você', L / 2, A * 0.82,
          Math.max(12, A * 0.038), 0.9, '500');
  },

  /* ---- loading.nicho — "acertando em cheio o seu nicho": bola entrando no
     gol §2/§49.1. O microtexto é textual do Guia (§70.3). */
  'loading.nicho'(ctx, t, L, A) {
    limpar(ctx, L, A);
    estrelas(ctx, L, A, 50, 17, 0.5);
    const gx = L * 0.70, gy = A * 0.45;
    const gw = L * 0.20, gh = A * 0.22;

    // O gol
    ctx.strokeStyle = hexA('#FFFFFF', 0.75);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gx, gy + gh / 2);
    ctx.lineTo(gx, gy - gh / 2);
    ctx.lineTo(gx + gw, gy - gh / 2);
    ctx.lineTo(gx + gw, gy + gh / 2);
    ctx.stroke();
    // rede
    ctx.strokeStyle = hexA('#FFFFFF', 0.16);
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const x = gx + (gw / 6) * i;
      ctx.beginPath(); ctx.moveTo(x, gy - gh / 2); ctx.lineTo(x, gy + gh / 2); ctx.stroke();
    }
    for (let i = 1; i < 4; i++) {
      const y = gy - gh / 2 + (gh / 4) * i;
      ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); ctx.stroke();
    }

    // A bola — bolha de vidro em trajetória
    const p = (t * 1.15) % 1;
    const bx = L * 0.14 + (gx + gw * 0.5 - L * 0.14) * ease(p);
    const by = gy + Math.sin(p * Math.PI) * -A * 0.16;
    const r = Math.min(L, A) * 0.045;

    // rastro
    for (let i = 1; i <= 5; i++) {
      const pp = clamp01(p - i * 0.035);
      const tx = L * 0.14 + (gx + gw * 0.5 - L * 0.14) * ease(pp);
      const ty = gy + Math.sin(pp * Math.PI) * -A * 0.16;
      bolha(ctx, tx, ty, r * (1 - i * 0.12), 0.18 * (1 - i / 6));
    }
    bolha(ctx, bx, by, r, 1);

    // clarão do gol
    if (p > 0.92) {
      const f = (p - 0.92) / 0.08;
      ctx.fillStyle = hexA(C.businessVerde, 0.35 * (1 - f));
      ctx.fillRect(gx, gy - gh / 2, gw, gh);
    }
    texto(ctx, 'acertando em cheio o seu nicho', L / 2, A * 0.82,
          Math.max(13, A * 0.042), 0.9, '500');
  },
};

/** Mistura dois hex por fator f (0 = a, 1 = b). */
function misturar(a, b, f) {
  const pa = a.replace('#', ''), pb = b.replace('#', '');
  const c = [];
  for (let i = 0; i < 3; i++) {
    const va = parseInt(pa.substr(i * 2, 2), 16);
    const vb = parseInt(pb.substr(i * 2, 2), 16);
    c.push(Math.round(va + (vb - va) * f));
  }
  return `rgb(${c.join(',')})`;
}

/* =========================================================================
   Motor de slots (§49)
   ========================================================================= */

/** Durações-alvo do Guia (§18: ~4s; §45: Aurora ~5s, Ecossistema ~6s). */
export const DURACOES = {
  'abertura.elio': 4200,
  'abertura.aurora': 5000,
  'abertura.rotacerta': 4000,
  'abertura.business': 4000,
  'abertura.ecossistema': 6000,
  'abertura.hub': 4000,
  'loading.criar_mundo': 2600,
  'loading.otimizar': 2600,
  'loading.migra_elio': 2600,
  'loading.migra_aurora': 2600,
  'loading.nicho': 2400,
};

export class Animacoes {
  /**
   * @param {object} [opcoes]
   * @param {object} [opcoes.manifest]  manifest §49.2 já carregado
   * @param {string} [opcoes.nivel='pleno']  §36
   */
  constructor(opcoes = {}) {
    this.manifest = opcoes.manifest || null;
    this.nivel = opcoes.nivel || 'pleno';
    this.movimentoReduzido = typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._raf = 0;
    this._cancelar = null;
  }

  /** Carrega o manifest de animações (§49.2). Falha não quebra nada: sem
   *  manifest, as cenas procedurais internas valem como versão 1. */
  async carregarManifest(url = './animations.manifest.json') {
    try {
      const r = await fetch(url, { cache: 'no-cache' });
      if (r.ok) this.manifest = await r.json();
    } catch { /* offline / sem manifest: segue no procedural */ }
    return this.manifest;
  }

  /** A versão ativa de um slot, segundo o manifest (§49.3: fallback obrigatório). */
  versaoAtiva(slot) {
    const s = this.manifest?.slots?.[slot];
    if (!s) return { fonte: 'procedural-lumora', versao: '1' };
    const v = s.versoes?.[s.versao_ativa];
    // §49.3 regra 6: nenhuma versão vira ativa sem aprovado_por + data.
    if (!v || !v.aprovado_por || !v.data_aprovacao) {
      return { fonte: 'procedural-lumora', versao: '1' };
    }
    return { ...v, versao: s.versao_ativa };
  }

  /**
   * Toca a animação de um slot.
   *
   * @param {string} slot
   * @param {HTMLCanvasElement} canvas
   * @param {object} [opcoes]
   * @param {number} [opcoes.duracao]  sobrescreve a duração-alvo
   * @returns {Promise<void>} resolve ao terminar (ou imediatamente com
   *   movimento reduzido, depois de desenhar o pôster estático)
   */
  tocar(slot, canvas, opcoes = {}) {
    const cena = CENAS[slot];
    if (!cena) return Promise.reject(new RangeError(`Slot sem cena: ${slot}`));
    if (!canvas?.getContext) return Promise.reject(new TypeError('Canvas inválido.'));

    this.parar();

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, this.nivel === 'basico' ? 1 : 2);
    const r = canvas.getBoundingClientRect();
    const L = Math.max(1, Math.round(r.width || canvas.width));
    const A = Math.max(1, Math.round(r.height || canvas.height));
    canvas.width = Math.round(L * dpr);
    canvas.height = Math.round(A * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // §49.3: com prefers-reduced-motion, PÔSTER ESTÁTICO — o quadro final.
    if (this.movimentoReduzido) {
      cena(ctx, 1, L, A);
      return Promise.resolve();
    }

    const dur = opcoes.duracao ?? DURACOES[slot] ?? 4000;
    return new Promise((resolve) => {
      const inicio = performance.now();
      let ativo = true;
      this._cancelar = () => { ativo = false; resolve(); };
      const laco = (agora) => {
        if (!ativo) return;
        const t = clamp01((agora - inicio) / dur);
        cena(ctx, t, L, A);
        if (t >= 1) { ativo = false; this._cancelar = null; resolve(); return; }
        this._raf = requestAnimationFrame(laco);
      };
      this._raf = requestAnimationFrame(laco);
    });
  }

  /** Desenha só o pôster (quadro final) — usado pelo nível Básico da §36
   *  e como fallback de qualquer falha. */
  poster(slot, canvas) {
    const cena = CENAS[slot];
    if (!cena) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    const L = Math.max(1, Math.round(r.width || canvas.width));
    const A = Math.max(1, Math.round(r.height || canvas.height));
    canvas.width = Math.round(L * dpr);
    canvas.height = Math.round(A * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cena(ctx, 1, L, A);
  }

  parar() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    if (this._cancelar) { this._cancelar(); this._cancelar = null; }
  }

  static get slots() { return Object.keys(CENAS); }
}

export { CENAS };
