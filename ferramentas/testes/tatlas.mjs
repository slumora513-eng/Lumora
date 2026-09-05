import { carregarChromium } from './navegador.mjs';
const chromium = await carregarChromium();
import { acharChromium, BASE } from './navegador.mjs';
const EXE_LUM = acharChromium();
const BASE_LUM = BASE;
const EXE=EXE_LUM;
let ok=0,bad=0; const t=(c,m)=>{ console.log((c?'PASS':'FALHA')+'  '+m); c?ok++:bad++; };
const b = await chromium.launch({ executablePath:EXE, args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'] });

const p = await b.newPage({ viewport:{width:1000,height:760}, deviceScaleFactor:2 });
p.on('pageerror', e=>console.log('PAGEERROR', e.message));
await p.goto(`${BASE_LUM}/runtime/verificacao.html`,{waitUntil:'networkidle'});
await p.waitForTimeout(700);
const A = '#atlas ';
const estado = () => p.evaluate(()=>{
  const r=document.getElementById('atlas');
  const bs=[...r.querySelectorAll('.lum-atlas-no')];
  return { modo:r.dataset.lumModo, n:bs.length,
    nomes:bs.map(x=>x.querySelector('.lum-atlas-nome').textContent),
    fio:[...r.querySelectorAll('.lum-atlas-passo')].map(x=>x.textContent),
    atual:r.querySelector('[aria-current]')?.textContent,
    narracao:r.querySelector('.lum-atlas-narracao').textContent,
    live:r.querySelector('.lum-atlas-narracao').getAttribute('aria-live'),
    canvasEscondido:r.querySelector('.lum-atlas-ceu').getAttribute('aria-hidden') };
});

// --- camada 1: galáxias
let e = await estado();
t(e.modo==='3d' && e.n===5, `§16 galáxias: ${e.n} nós em modo ${e.modo}`);
t(e.live==='polite' && !!e.narracao, `narração da Aurora presente e aria-live ("${e.narracao}")`);
t(e.canvasEscondido==='true', 'canvas é aria-hidden — o conteúdo só é anunciado uma vez');

// --- descer para constelações
await p.click(`${A}.lum-atlas-no:has-text("Varejo")`);
await p.waitForTimeout(400);
e = await estado();
t(e.n===3 && e.nomes.includes('Alimentação'), `constelações de Varejo: ${e.nomes.join(', ')}`);
t(e.fio.join(' › ')==='Atlas Estelar › Varejo', `fio: ${e.fio.join(' › ')}`);
t(/Galáxia Varejo/.test(e.narracao), `Aurora narra a descida ("${e.narracao}")`);
await p.locator('#atlas').screenshot({ path:`${process.env.S||'/tmp'}/atlas-constelacoes.png`, timeout:9000 });

// --- descer para estrelas (nichos)
await p.click(`${A}.lum-atlas-no:has-text("Alimentação")`);
await p.waitForTimeout(400);
e = await estado();
t(e.n===4 && e.nomes.includes('Pizzaria'), `estrelas: ${e.nomes.join(', ')}`);
await p.locator('#atlas').screenshot({ path:`${process.env.S||'/tmp'}/atlas-estrelas.png`, timeout:9000 });

// --- nicho individual
await p.click(`${A}.lum-atlas-no:has-text("Pizzaria")`);
await p.waitForTimeout(400);
e = await estado();
t(e.n===1 && e.atual==='Pizzaria', `nicho individual (fio termina em "${e.atual}")`);
t(/fim do caminho/.test(e.narracao), 'Aurora avisa que é o fim do caminho');

// --- Esc sobe
await p.keyboard.press('Escape');
await p.waitForTimeout(300);
e = await estado();
t(e.fio.length===3 && e.n===4, `Esc sobe um nível (${e.fio.join(' › ')})`);

// --- fio navega direto
await p.click(`${A}.lum-atlas-passo:has-text("Atlas Estelar")`);
await p.waitForTimeout(300);
e = await estado();
t(e.n===5, 'o fio de Ariadne volta direto ao topo');

// --- busca varre a árvore inteira
await p.fill(`${A}input[type=search]`, 'pizza');
await p.waitForTimeout(250);
const busca = await p.evaluate(()=>{
  const r=document.getElementById('atlas');
  const l=[...r.querySelectorAll('.lum-atlas-achado')];
  return { n:l.length, primeiro:l[0]?.textContent, escondido:r.querySelector('.lum-atlas-achados').hidden };
});
t(busca.n===1 && /Pizzaria/.test(busca.primeiro), `busca acha em camada profunda: "${busca.primeiro}"`);
await p.click(`${A}.lum-atlas-achado`);
await p.waitForTimeout(400);
e = await estado();
t(e.atual==='Pizzaria' && e.fio.length===4,
  `o resultado salta direto para o nicho (${e.fio.join(' › ')})`);

// --- teclado: Tab alcança os nós, Enter desce
await p.click(`${A}.lum-atlas-passo:has-text("Atlas Estelar")`);
await p.waitForTimeout(300);
await p.evaluate(()=>document.querySelector('#atlas .lum-atlas-no').focus());
const foco = await p.evaluate(()=>({
  tag:document.activeElement.tagName,
  rot:document.activeElement.getAttribute('aria-label'),
  contorno:getComputedStyle(document.activeElement).outlineStyle }));
t(foco.tag==='BUTTON', `cada nó é <button> de verdade (${foco.rot})`);
await p.keyboard.press('Enter');
await p.waitForTimeout(350);
e = await estado();
t(e.fio.length===2, `Enter desce pelo teclado (${e.fio.join(' › ')})`);

// --- setas andam no céu
await p.click(`${A}.lum-atlas-passo:has-text("Atlas Estelar")`);
await p.waitForTimeout(300);
await p.evaluate(()=>document.querySelector('#atlas .lum-atlas-no').focus());
const antes = await p.evaluate(()=>document.activeElement.textContent);
await p.keyboard.press('ArrowLeft');
await p.waitForTimeout(120);
const depois = await p.evaluate(()=>document.activeElement.textContent);
t(antes!==depois, `seta move o foco no céu ("${antes.trim()}" -> "${depois.trim()}")`);

// --- modo lista tem a MESMA navegação
await p.click('#atlas-lista');
await p.waitForTimeout(300);
await p.click(`${A}.lum-atlas-no:has-text("Serviços")`);
await p.waitForTimeout(300);
e = await estado();
t(e.modo==='lista' && e.n===2 && e.fio.includes('Serviços'),
  `§36 modo lista navega igual (${e.nomes.join(', ')})`);
const semTransform = await p.evaluate(()=>
  ![...document.querySelectorAll('#atlas .lum-atlas-nos > li')].some(li=>li.style.transform));
t(semTransform, 'no modo lista o CSS assume — nenhum transform de projeção sobra');
await p.locator('#atlas').screenshot({ path:`${process.env.S||'/tmp'}/atlas-lista.png`, timeout:9000 });
await p.close();

// --- sem WebGL: o Atlas continua navegável
{
  const b2 = await chromium.launch({ executablePath:EXE, args:['--no-sandbox','--disable-gpu','--disable-software-rasterizer'] });
  const q = await b2.newPage({ viewport:{width:900,height:700} });
  q.on('pageerror', e=>console.log('PAGEERROR(sem gl)', e.message));
  await q.goto(`${BASE_LUM}/runtime/verificacao.html`,{waitUntil:'networkidle'});
  await q.waitForTimeout(500);
  const r = await q.evaluate(()=>{
    const r=document.getElementById('atlas');
    return { modo:r.dataset.lumModo, n:r.querySelectorAll('.lum-atlas-no').length };
  });
  t(r.modo==='lista' && r.n===5, `§49.3 sem WebGL cai no modo lista com tudo (${r.n} nós)`);
  await q.click('#atlas .lum-atlas-no:has-text("Varejo")');
  await q.waitForTimeout(250);
  const r2 = await q.evaluate(()=>document.querySelectorAll('#atlas .lum-atlas-no').length);
  t(r2===3, 'e navega normalmente sem GPU nenhuma');
  await b2.close();
}

// --- movimento reduzido
{
  const q = await b.newPage({ viewport:{width:900,height:700}, reducedMotion:'reduce' });
  await q.goto(`${BASE_LUM}/runtime/verificacao.html`,{waitUntil:'networkidle'});
  await q.waitForTimeout(500);
  const a1 = await q.evaluate(()=>document.querySelector('#atlas .lum-atlas-nos > li').style.transform);
  await q.waitForTimeout(700);
  const a2 = await q.evaluate(()=>document.querySelector('#atlas .lum-atlas-nos > li').style.transform);
  t(a1===a2 && a1!=='', '§35 item 8: com movimento reduzido a câmera não deriva sozinha');
  await q.click('#atlas .lum-atlas-no:has-text("Varejo")');
  await q.waitForTimeout(250);
  const n = await q.evaluate(()=>document.querySelectorAll('#atlas .lum-atlas-no').length);
  t(n===3, 'e a navegação continua inteira');
  await q.close();
}

await b.close();
console.log(`\n${ok} passaram, ${bad} falharam`);
process.exit(bad?1:0);
