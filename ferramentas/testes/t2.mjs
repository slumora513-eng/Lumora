import { carregarChromium } from './navegador.mjs';
const chromium = await carregarChromium();
import { acharChromium, BASE } from './navegador.mjs';
const EXE_LUM = acharChromium();
const BASE_LUM = BASE;
const erros=[];
const b = await chromium.launch({ executablePath:EXE_LUM, args:['--no-sandbox'] });
const p = await b.newPage({ viewport:{width:1280,height:900} });
p.on('pageerror', e=>erros.push('pageerror: '+e.message));
p.on('console', m=>{ if(m.type()==='error') erros.push('console: '+m.text()); });
await p.goto(`${BASE_LUM}/runtime/verificacao.html`,{waitUntil:'networkidle'});
await p.waitForTimeout(900);
const ok=(n,v)=>console.log(`${v?'PASS':'FALHA'}  ${n}`);

// --- Animações dos slots
const slots = await p.evaluate(async () => {
  const m = await import('/runtime/animacoes.js');
  return m.Animacoes.slots;
});
ok(`§49: 11 slots com cena procedural (${slots.length})`, slots.length === 11);

// cada cena desenha algo distinto do fundo
const pintaram = await p.evaluate(async () => {
  const m = await import('/runtime/animacoes.js');
  // usar3D:false força o caminho Canvas 2D — este bloco testa as cenas 2D
  const a = new m.Animacoes({ usar3D: false });
  const c = document.createElement('canvas');
  c.style.inlineSize='320px'; c.style.blockSize='180px';
  document.body.appendChild(c);
  const res = {};
  for (const s of m.Animacoes.slots) {
    a.poster(s, c);
    const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    let luz = 0;
    for (let i=0;i<d.length;i+=160) if (d[i]+d[i+1]+d[i+2] > 60) luz++;
    res[s] = luz;
  }
  c.remove();
  return res;
});
const vazias = Object.entries(pintaram).filter(([,v]) => v < 20).map(([k])=>k);
ok(`§49: todas as 11 cenas desenham conteúdo (vazias: ${vazias.join(',')||'nenhuma'})`, vazias.length===0);

// manifest válido e coerente com as cenas
const man = await p.evaluate(async () => {
  const r = await fetch('/runtime/animations.manifest.json');
  return r.ok ? r.json() : null;
});
ok('§49.2: manifest carrega e tem apiVersion', man?.apiVersion === 'lumora.animations/v1');
const slotsMan = Object.keys(man.slots);
ok(`§49.1: manifest cobre os 11 slots (${slotsMan.length})`, slotsMan.length===11 && slotsMan.every(s=>slots.includes(s)));
const semAprov = slotsMan.filter(s => { const v=man.slots[s].versoes[man.slots[s].versao_ativa]; return !v.aprovado_por || !v.data_aprovacao; });
ok(`§49.3 regra 6: toda versão ativa tem aprovado_por + data (${semAprov.length} sem)`, semAprov.length===0);

// --- Notificações Vivas
await p.click('[data-notif="normal"]');
await p.waitForTimeout(300);
ok('§69.1: bolha de notificação nasce', await p.locator('.lum-bolha-notif').count() === 1);

await p.click('[data-notif="critica"]');
await p.waitForTimeout(300);
const crit = await p.evaluate(() => {
  const el = document.querySelector('.lum-bolha-notif.lum-u-critica');
  return el ? { classe: el.className, live: el.getAttribute('aria-live'), txt: el.textContent } : null;
});
ok(`§69.3: crítica é assertive (${crit?.live})`, crit?.live === 'assertive');
ok('§69.5 LGPD: valor mascarado na crítica', /R\$ \*\*/.test(crit?.txt || ''));

// categoria fiscal FORÇA crítica mesmo se o chamador pedir normal
const forcado = await p.evaluate(async () => {
  const m = await import('/runtime/notificacoes-vivas.js');
  const n = new m.NotificacoesVivas({ raiz: document.createElement('div') });
  n.notificar({ texto:'x', categoria:'fiscal', urgencia:'normal' });
  return n.visiveis[0].dados.urgencia;
});
ok(`§69.3: categoria fiscal força classe crítica (${forcado})`, forcado === 'critica');

// ventania NÃO leva a crítica
await p.click('#ventania');
await p.waitForTimeout(1200);
const sobrou = await p.evaluate(() => ({
  criticas: document.querySelectorAll('.lum-bolha-notif.lum-u-critica').length,
  normais: document.querySelectorAll('.lum-bolha-notif:not(.lum-u-critica)').length,
}));
ok(`§69.3: ventania não leva a crítica (críticas=${sobrou.criticas}, normais=${sobrou.normais})`,
   sobrou.criticas === 1 && sobrou.normais === 0);

// --- Bólido
await p.click('#bolido');
await p.waitForTimeout(400);
ok('§67.5: Bólido desenha canvas + toast assertive', await p.evaluate(() =>
  !!document.querySelector('.lum-bolido-canvas') &&
  document.querySelector('.lum-bolido-toast')?.getAttribute('aria-live') === 'assertive'));

// --- Navegação bolhas
await p.click('#abrir-nav');
await p.waitForTimeout(400);
ok('§65.3: mapa de bolhas orbitando', await p.locator('.lum-orbe').count() === 6);
ok('§65.3: sem menu lateral sólido', await p.evaluate(() => !document.querySelector('aside, .sidebar')));
await p.keyboard.press('ArrowRight');
await p.waitForTimeout(150);
ok('§65.3: teclado move o foco entre as bolhas', await p.evaluate(() =>
  document.activeElement?.classList.contains('lum-orbe')));
await p.keyboard.press('Escape');
await p.waitForTimeout(200);
ok('§65.3: Esc fecha', await p.evaluate(() => document.querySelector('.lum-nav').hidden));

// --- Navegação ondas
await p.click('[data-tema="aurora"]');
await p.waitForTimeout(200);
await p.click('#abrir-nav');
await p.waitForTimeout(400);
const onda = await p.evaluate(() => {
  const it = [...document.querySelectorAll('.lum-crista-item')];
  const foco = document.querySelector('.lum-crista-item--foco');
  return { n: it.length, temFoco: !!foco, y: it.map(e=>e.style.getPropertyValue('--y')) };
});
ok(`§66.2: crista senoidal com ${onda.n} itens e snap no centro`, onda.n===6 && onda.temFoco);
ok('§66.2: amplitude 64px no nível 1', onda.y.some(v => Math.abs(parseFloat(v)) > 55));
await p.keyboard.press('Escape');
await p.waitForTimeout(200);

// tema aurora troca a notificação para faixa (§69.5)
await p.click('[data-notif="normal"]');
await p.waitForTimeout(300);
ok('§69.2: tema Aurora usa faixa-onda, não bolha', await p.evaluate(() =>
  document.querySelectorAll('.lum-onda-notif').length >= 1 &&
  document.querySelector('.lum-faixa-aurora').hidden === false));
await p.click('[data-tema="elio"]');
await p.waitForTimeout(400);
ok('§69.5: troca de tema transforma a notificação sem perda', await p.evaluate(() =>
  document.querySelectorAll('.lum-bolha-notif').length >= 1));

// --- Nebulosa Ctrl+K
await p.keyboard.press('Control+k');
await p.waitForTimeout(300);
ok('§67.1: Ctrl+K abre a Nebulosa de Ações', await p.evaluate(() =>
  !document.querySelector('.lum-nebulosa').hidden));
await p.keyboard.type('lgpd');
await p.waitForTimeout(200);
ok('§67.1: digitar filtra as ações', await p.locator('.lum-nebulosa-item').count() === 1);
await p.keyboard.press('Escape');
await p.waitForTimeout(200);

// --- Sismógrafo + Rastro + Estrelinha
await p.click('#pulso');
await p.waitForTimeout(400);
ok('§67.4: Sismógrafo tem faixa de 64px e desenha', await p.evaluate(() => {
  const c = document.getElementById('sismo');
  if (Math.round(c.getBoundingClientRect().height) !== 64) return false;
  const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  let n=0; for (let i=3;i<d.length;i+=80) if (d[i]>0) n++;
  return n > 30;
}));
await p.click('#rastro');
await p.waitForTimeout(200);
ok('§67.2: Rastro de Aurora aparece durante processamento', await p.evaluate(() =>
  !document.querySelector('.lum-rastro').hidden));

await p.click('.lum-card[data-lum-estrelinha="card-1"] .lum-estrelinha');
await p.waitForTimeout(150);
ok('§68.4: Estrelinha marca favorito com aria-pressed', await p.evaluate(() =>
  document.querySelector('[data-lum-estrelinha="card-1"] .lum-estrelinha')
    .getAttribute('aria-pressed') === 'true'));

console.log(erros.length ? '\nERROS:\n' + erros.join('\n') : '\nSem erros de console.');
await b.close();
