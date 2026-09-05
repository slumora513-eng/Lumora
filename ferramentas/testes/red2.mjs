import { carregarChromium } from './navegador.mjs';
const chromium = await carregarChromium();
import { acharChromium, BASE } from './navegador.mjs';
const EXE_LUM = acharChromium();
const BASE_LUM = BASE;
const b = await chromium.launch({ executablePath:EXE_LUM, args:['--no-sandbox'] });
const p = await b.newPage({ viewport:{width:1280,height:900}, reducedMotion:'reduce' });
const erros=[]; p.on('pageerror', e=>erros.push(e.message));
await p.goto(`${BASE_LUM}/runtime/verificacao.html`,{waitUntil:'networkidle'});
await p.waitForTimeout(700);
const ok=(n,v)=>console.log(`${v?'PASS':'FALHA'}  ${n}`);

// §49.3: animação vira PÔSTER ESTÁTICO
const poster = await p.evaluate(async () => {
  const m = await import('/runtime/animacoes.js');
  const a = new m.Animacoes();
  const c = document.getElementById('palco');
  const t0 = performance.now();
  await a.tocar('abertura.elio', c);
  const dt = performance.now() - t0;
  const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
  let luz=0; for (let i=0;i<d.length;i+=200) if (d[i]+d[i+1]+d[i+2]>60) luz++;
  return { dt, luz };
});
ok(`§49.3: com movimento reduzido a cena resolve na hora (${Math.round(poster.dt)}ms)`, poster.dt < 120);
ok(`§49.3: e desenha o pôster estático (${poster.luz} amostras)`, poster.luz > 20);

// §69.3: crítica continua sem timeout mesmo com movimento reduzido
await p.click('[data-notif="critica"]');
await p.waitForTimeout(1500);
ok('§69.3: crítica não some sozinha nem com movimento reduzido',
   await p.locator('.lum-bolha-notif.lum-u-critica').count() === 1);

// §69.5: saída vira fade, mas a notificação ainda sai
await p.click('[data-notif="normal"]');
await p.waitForTimeout(200);
const antes = await p.locator('.lum-bolha-notif').count();
await p.click('#ventania');
await p.waitForTimeout(600);
const depois = await p.locator('.lum-bolha-notif').count();
ok(`§69.5: ventania dissolve as não-críticas (${antes} -> ${depois})`, depois === 1);

// §68.2: poeira desligada
await p.mouse.click(640, 500);
await p.waitForTimeout(200);
ok('§68.2: Poeira de Interação desligada', await p.evaluate(() =>
  getComputedStyle(document.querySelector('.lum-poeira')).display === 'none'));

// §67.2: rastro estático mas ainda visível — o sinal de processamento fica
await p.click('#rastro');
await p.waitForTimeout(200);
ok('§67.2: Rastro vira barra estática, sem sumir', await p.evaluate(() => {
  const el = document.querySelector('.lum-rastro');
  if (el.hidden) return false;
  return getComputedStyle(el, '::after').animationName === 'none';
}));

// §66.2: fallback funcional da onda = lista legível
await p.click('[data-tema="aurora"]');
await p.click('#abrir-nav');
await p.waitForTimeout(300);
ok('§66.2: fallback funcional — a crista vira lista empilhada', await p.evaluate(() => {
  const c = document.querySelector('.lum-crista');
  const it = document.querySelector('.lum-crista-item');
  return getComputedStyle(c).flexDirection === 'column'
      && getComputedStyle(it).position === 'static';
}));
await p.keyboard.press('Escape');

console.log(erros.length ? '\nERROS: '+erros.join('; ') : '\nSem erros de página.');
await b.close();
