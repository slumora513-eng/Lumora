import { carregarChromium, acharChromium, BASE } from './navegador.mjs';
const chromium = await carregarChromium();
let ok = 0, bad = 0;
const t = (c, m) => { console.log((c ? 'PASS' : 'FALHA') + '  ' + m); c ? ok++ : bad++; };

const b = await chromium.launch({ executablePath: acharChromium(),
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

const externos = [];
const abrir = async (opcoes = {}) => {
  const p = await b.newPage({ viewport: { width: 1000, height: 900 }, ...opcoes });
  p.on('pageerror', (e) => { console.log('PAGEERROR', e.message); bad++; });
  p.on('request', (r) => { const u = r.url();
    if (!u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:')) externos.push(u); });
  await p.goto(`${BASE}/runtime/verificacao.html`, { waitUntil: 'networkidle' });
  return p;
};

const p = await abrir();
await p.waitForTimeout(900);

// --- 1) cada sistema desenha a assinatura que docs/04 registra
const r1 = await p.evaluate(async () => {
  const m = await import('/runtime/camada-de-sistema.js');
  const cv = document.createElement('canvas');
  cv.style.inlineSize = '900px'; cv.style.blockSize = '300px';
  document.body.appendChild(cv);
  const fora = {};
  for (const s of m.SISTEMAS) {
    const c = new m.CamadaDeSistema(cv, { sistema: s, nivel: 'pleno' });
    fora[s] = { wp: c.waypoints.length, aneis: c.aneis.length, sat: c.satelites.length,
                tem: c.temCamada(), motivo: c.motivoDoVazio() };
    c.destruir();
  }
  cv.remove();
  return fora;
});
t(r1.rotacerta.wp >= 3 && r1.rotacerta.aneis === 0,
  `RotaCerta: rotas com ${r1.rotacerta.wp} waypoints, sem anéis (§65.1 "GPS espacial")`);
t(r1.hub.aneis === 3 && r1.hub.sat > 0 && r1.hub.wp === 0,
  `Hub: núcleo + ${r1.hub.aneis} anéis + ${r1.hub.sat} satélites, sem rotas (§65.1 "Núcleo de Controle")`);
t(r1.ecossistema.wp > 0 && r1.ecossistema.aneis > 0,
  'Ecossistema: reúne os elementos dos outros (docs/04)');
t(r1.business.tem === false && /céu estrelado puro/.test(r1.business.motivo),
  'Business: camada VAZIA por decisão do Fundador, e o código diz o motivo');
t(r1.comunidade.tem === false && /Atlas Estelar/.test(r1.comunidade.motivo),
  'Comunidade: vazia porque o Atlas Estelar (§16) já é a camada');

// --- 2) determinismo: mesmo sistema, mesma geometria
const r2 = await p.evaluate(async () => {
  const m = await import('/runtime/camada-de-sistema.js');
  const geo = () => {
    const cv = document.createElement('canvas');
    cv.style.inlineSize = '900px'; cv.style.blockSize = '300px';
    document.body.appendChild(cv);
    const c = new m.CamadaDeSistema(cv, { sistema: 'rotacerta', nivel: 'pleno' });
    const g = c.waypoints.map((w) => `${w.x.toFixed(2)},${w.y.toFixed(2)}`).join('|');
    c.destruir(); cv.remove(); return g;
  };
  return { a: geo(), b: geo() };
});
t(r2.a === r2.b && r2.a.length > 0,
  'geometria determinística: o mesmo sistema cai sempre no mesmo lugar');

// --- 3) o canvas é REALMENTE pintado
const r3 = await p.evaluate(async () => {
  const m = await import('/runtime/camada-de-sistema.js');
  const cv = document.createElement('canvas');
  cv.style.inlineSize = '600px'; cv.style.blockSize = '300px';
  document.body.appendChild(cv);
  const fora = {};
  for (const s of ['rotacerta', 'hub', 'business']) {
    const c = new m.CamadaDeSistema(cv, { sistema: s, nivel: 'pleno' });
    c.movimentoReduzido = false; c._t = 300; c._quadro(1);
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let pintados = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 4) pintados++;
    fora[s] = pintados;
    c.destruir();
  }
  cv.remove(); return fora;
});
t(r3.rotacerta > 200, `RotaCerta pinta o canvas (${r3.rotacerta} pixels com luz)`);
t(r3.hub > 200, `Hub pinta o canvas (${r3.hub} pixels com luz)`);
t(r3.business === 0, 'Business não pinta nada — o vazio é literal, não um quase-vazio');

// --- 4) REGRESSÃO: _t negativo não pode quebrar o rastro
// O rAF entrega o timestamp do início do quadro, que pode ser anterior ao
// performance.now() lido em iniciar(). dt saía negativo, _t ficava negativo, e
// como o % do JS herda o sinal do dividendo o índice virava wp[-1].
const r4 = await p.evaluate(async () => {
  const m = await import('/runtime/camada-de-sistema.js');
  const cv = document.createElement('canvas');
  cv.style.inlineSize = '600px'; cv.style.blockSize = '300px';
  document.body.appendChild(cv);
  const c = new m.CamadaDeSistema(cv, { sistema: 'rotacerta', nivel: 'pleno' });
  c.movimentoReduzido = false;
  const erros = [];
  for (const tt of [-1000, -37, -0.5, 0, 0.5, 37, 1e6]) {
    c._t = tt;
    try { c._quadro(1); } catch (e) { erros.push(`${tt}: ${e.message}`); }
  }
  c.destruir(); cv.remove(); return erros;
});
t(r4.length === 0, `rastro aguenta _t negativo, zero e enorme (${r4.length} erros)`);

// --- 5) as seis paletas alcançam o ambiente
const r5 = await p.evaluate(async () => {
  const m = await import('/runtime/camada-de-sistema.js');
  const cv = document.createElement('canvas');
  cv.style.inlineSize = '600px'; cv.style.blockSize = '300px';
  document.body.appendChild(cv);
  const antes = document.documentElement.dataset.lumPaleta;
  const fora = {};
  for (const pal of ['padrao', 'preto-branco', 'aurora-dia']) {
    document.documentElement.dataset.lumPaleta = pal;
    const c = new m.CamadaDeSistema(cv, { sistema: 'rotacerta', nivel: 'pleno' });
    fora[pal] = { tem: c.temCamada(), claro: c.claro, forca: c.forca,
                  rota: c.cor.rota, motivo: c.motivoDoVazio() };
    c.destruir();
  }
  if (antes) document.documentElement.dataset.lumPaleta = antes;
  else delete document.documentElement.dataset.lumPaleta;
  cv.remove(); return fora;
});
t(r5['preto-branco'].tem === false && /preto\/branco/.test(r5['preto-branco'].motivo || ''),
  'preto/branco desliga o ambiente decorativo — essa paleta é para clareza máxima');
t(r5['aurora-dia'].claro === true && r5['aurora-dia'].forca > 1,
  `paleta clara reforça em vez de sumir (força ${r5['aurora-dia'].forca}) — o caso que a CSS deixava "para quem integra"`);
t(r5.padrao.rota !== r5['aurora-dia'].rota || r5.padrao.forca !== r5['aurora-dia'].forca,
  'as cores saem dos tokens: trocar a paleta muda a camada');

// --- 6) §36: nível reduz densidade, e o rastro (o mais caro) sai no básico
const r6 = await p.evaluate(async () => {
  const m = await import('/runtime/camada-de-sistema.js');
  const cv = document.createElement('canvas');
  cv.style.inlineSize = '600px'; cv.style.blockSize = '300px';
  document.body.appendChild(cv);
  const fora = {};
  for (const n of ['pleno', 'economico', 'basico']) {
    const c = new m.CamadaDeSistema(cv, { sistema: 'rotacerta', nivel: n });
    fora[n] = c.waypoints.length;
    c.destruir();
  }
  cv.remove(); return fora;
});
t(r6.pleno > r6.economico && r6.economico >= r6.basico,
  `§36: densidade cai com o nível (${r6.pleno} > ${r6.economico} >= ${r6.basico})`);

await p.close();

// --- 7) movimento reduzido: ambiente fica, movimento não (§35 item 8)
const p2 = await abrir({ reducedMotion: 'reduce' });
await p2.waitForTimeout(600);
const r7 = await p2.evaluate(async () => {
  const m = await import('/runtime/camada-de-sistema.js');
  const cv = document.createElement('canvas');
  cv.style.inlineSize = '600px'; cv.style.blockSize = '300px';
  document.body.appendChild(cv);
  const c = new m.CamadaDeSistema(cv, { sistema: 'hub', nivel: 'pleno' });
  c.iniciar();
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  let pintados = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 4) pintados++;
  const fora = { reduzido: c.movimentoReduzido, rodando: c.rodando, pintados };
  c.destruir(); cv.remove(); return fora;
});
t(r7.reduzido === true && r7.rodando === false,
  'movimento reduzido: nenhum laço de animação roda');
t(r7.pintados > 200,
  `mas o ambiente CONTINUA lá, num quadro estático (${r7.pintados} pixels) — §35 item 8`);
await p2.close();

t(externos.length === 0, `nenhum pedido externo (§65.5): ${externos.length}`);

console.log(`\ntcamada  falhas=${bad}  ${ok}`);
await b.close();
process.exit(bad ? 1 : 0);
