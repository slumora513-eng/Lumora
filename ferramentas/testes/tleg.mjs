import { carregarChromium } from './navegador.mjs';
const chromium = await carregarChromium();
import { acharChromium, BASE } from './navegador.mjs';
const EXE_LUM = acharChromium();
const BASE_LUM = BASE;
const EXE=EXE_LUM;
let ok=0, bad=0;
const t=(c,m)=>{ console.log((c?'PASS':'FALHA')+'  '+m); c?ok++:bad++; };

const b = await chromium.launch({ executablePath:EXE, args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'] });

// --- 1) movimento normal: as 11 cenas põem a legenda certa
{
  const p = await b.newPage({ viewport:{width:900,height:620} });
  p.on('pageerror', e=>console.log('PAGEERROR', e.message));
  await p.goto(`${BASE_LUM}/runtime/verificacao.html`,{waitUntil:'networkidle'});
  const esperado = await p.evaluate(()=>import('/runtime/animacoes.js').then(m=>m.LEGENDAS));
  for (const slot of Object.keys(esperado)) {
    const dur = await p.evaluate(s=>import('/runtime/animacoes.js').then(m=>m.DURACOES[s]), slot);
    await p.click(`[data-slot="${slot}"]`);
    await p.waitForTimeout(Math.round(dur*0.88));
    const r = await p.evaluate(()=>{
      const el=document.querySelector('.lum-abertura');
      const n=el?.querySelector('.lum-abertura-nome'), f=el?.querySelector('.lum-abertura-fala');
      const cv=document.getElementById('palco')||document.querySelector('.lum-palco canvas');
      return { nome:n?.textContent||'', fala:f?.textContent||'',
               live:el?.getAttribute('aria-live'),
               pe:el?getComputedStyle(el).pointerEvents:null,
               larguraCanvas:Math.round(cv.getBoundingClientRect().width),
               larguraPalco:Math.round(document.querySelector('.lum-palco').getBoundingClientRect().width) };
    });
    const L=esperado[slot];
    const nomeEsperado = L.nome + (L.detalhe ? ` · ${L.detalhe}` : '');
    t(r.nome===nomeEsperado && r.fala===(L.fala||''),
      `${slot.padEnd(22)} nome="${r.nome}"${L.fala?` fala="${r.fala.slice(0,28)}…"`:' (sem fala, correto)'}`);
    if (slot==='abertura.elio') {
      t(r.live==='polite', '§45: legenda é aria-live=polite (canal de texto real)');
      t(r.pe==='none', 'legenda não captura clique');
      t(r.larguraPalco===r.larguraCanvas && r.larguraPalco>0,
        `palco tem a caixa do canvas (${r.larguraPalco}px = ${r.larguraCanvas}px)`);
    }
  }
  // nenhuma cena desenha texto no canvas
  const srcs = await Promise.all(['animacoes.js'].map(f=>p.evaluate(u=>fetch(u).then(r=>r.text()),`/runtime/${f}`)));
  t(!/texto\(ctx/.test(srcs[0]), 'nenhum texto rasterizado no canvas (só DOM)');
  await p.close();
}

// --- 2) movimento reduzido: pôster estático AINDA mostra o texto inteiro
{
  const p = await b.newPage({ viewport:{width:900,height:620}, reducedMotion:'reduce' });
  await p.goto(`${BASE_LUM}/runtime/verificacao.html`,{waitUntil:'networkidle'});
  await p.click('[data-slot="abertura.aurora"]');
  await p.waitForTimeout(300);
  const r = await p.evaluate(()=>{
    const el=document.querySelector('.lum-abertura');
    const n=el.querySelector('.lum-abertura-nome'), f=el.querySelector('.lum-abertura-fala');
    return { nome:n.textContent, fala:f.textContent,
             transform:getComputedStyle(n).transform, opac:getComputedStyle(n).opacity };
  });
  t(r.nome==='Aurora' && r.fala.startsWith('Olá, eu sou Aurora'),
    '§49.3: com movimento reduzido o texto aparece inteiro de uma vez');
  t(r.transform==='none' && r.opac==='1',
    '§35 item 8: o texto não se move — o gesto some, a informação fica');
  await p.close();
}

// --- 3) 3D seguido de 2D no mesmo canvas (o contexto tem que ser recuperado)
{
  const p = await b.newPage({ viewport:{width:900,height:620} });
  await p.goto(`${BASE_LUM}/runtime/verificacao.html`,{waitUntil:'networkidle'});
  await p.click('[data-slot="abertura.elio"]');       // WebGL toma o canvas
  await p.waitForTimeout(600);
  await p.click('[data-slot="loading.otimizar"]');    // 2D no mesmo lugar
  await p.waitForTimeout(1200);
  const r = await p.evaluate(()=>{
    const cv=document.querySelector('.lum-palco canvas:not([hidden])');
    const g=cv.getContext('2d');
    if(!g) return {luz:-1};
    const d=g.getImageData(0,0,cv.width,cv.height).data;
    let luz=0; for(let i=0;i<d.length;i+=4) if(d[i]+d[i+1]+d[i+2]>60) luz++;
    return { luz, nome:document.querySelector('.lum-abertura-nome').textContent,
             superficies:document.querySelectorAll('.lum-palco canvas').length,
             visiveis:document.querySelectorAll('.lum-palco canvas:not([hidden])').length,
             integradorVivo: document.body.contains(document.getElementById('palco')) };
  });
  t(r.luz>200, `2D desenha na sua própria superfície depois do WebGL (${r.luz} px acesos)`);
  t(r.superficies===2 && r.visiveis===1,
    `palco tem as duas superfícies, uma visível (${r.superficies}/${r.visiveis})`);
  t(r.integradorVivo, 'o canvas de quem integra continua no documento (nada foi substituído)');
  t(r.nome==='otimizando o seu sistema', 'e a legenda acompanha a troca de cena');
  await p.close();
}

await b.close();
console.log(`\n${ok} passaram, ${bad} falharam`);
process.exit(bad?1:0);
