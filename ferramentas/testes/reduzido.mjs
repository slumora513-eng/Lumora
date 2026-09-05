import { carregarChromium } from './navegador.mjs';
const chromium = await carregarChromium();
import { acharChromium, BASE } from './navegador.mjs';
const EXE_LUM = acharChromium();
const BASE_LUM = BASE;
const b = await chromium.launch({ executablePath:EXE_LUM, args:['--no-sandbox'] });
const p = await b.newPage({ viewport:{width:1280,height:900}, reducedMotion:'reduce' });
const erros=[]; p.on('pageerror', e=>erros.push(e.message));
await p.goto(`${BASE_LUM}/runtime/verificacao.html`, { waitUntil:'networkidle' });
await p.waitForTimeout(800);
const ok=(n,v)=>console.log(`${v?'PASS':'FALHA'}  ${n}`);

ok('Movimento reduzido detectado', await p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches));

// O céu ainda existe (informação preservada), mas parado (§35 item 8)
const a = await p.evaluate(()=>{const c=document.getElementById('ceu');return c.getContext('2d').getImageData(0,0,200,200).data.join('')});
await p.waitForTimeout(700);
const b2 = await p.evaluate(()=>{const c=document.getElementById('ceu');return c.getContext('2d').getImageData(0,0,200,200).data.join('')});
ok('Céu Vivo desenhado mas ESTÁTICO (gesto some, ambiente fica)', a===b2 && a.replace(/0/g,'').length>0);

// Respingo não é criado
await p.click('.lum-botao--primario');
await p.waitForTimeout(120);
ok('Respingo de vidro desligado', await p.evaluate(()=>!document.querySelector('.lum-respingo')));

// Viagem vira fade simples e ainda TROCA a tela (função preservada)
await p.click('#ir-b');
await p.waitForTimeout(600);
ok('Viagem Cósmica virou fade simples e ainda navegou',
   await p.evaluate(()=>document.getElementById('tela-a').hidden && !document.getElementById('tela-b').hidden));

// Transições de CSS reduzidas
const dur = await p.evaluate(()=>getComputedStyle(document.querySelector('.lum-card')).transitionDuration);
ok(`Transições de card reduzidas (${dur})`, dur.startsWith('0.001s'));

// Constelação do documento continua lá — não é gesto, é informação
ok('Constelação do documento preservada', await p.evaluate(()=>!!document.querySelector('[data-lum-constelacao] svg')));

console.log(erros.length? '\nERROS: '+erros.join('; ') : '\nSem erros de página.');
await b.close();
