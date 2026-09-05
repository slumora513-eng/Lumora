import { carregarChromium } from './navegador.mjs';
const chromium = await carregarChromium();
import { acharChromium, BASE } from './navegador.mjs';
const EXE_LUM = acharChromium();
const BASE_LUM = BASE;
const EXE=EXE_LUM;
let ok=0, bad=0;
const t=(c,m)=>{ console.log((c?'PASS':'FALHA')+'  '+m); c?ok++:bad++; };

const b = await chromium.launch({ executablePath:EXE, args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:1000,height:900} });
p.on('pageerror', e=>{ console.log('PAGEERROR', e.message); bad++; });
const externos=[];
p.on('request', r=>{ const u=r.url();
  if(!u.startsWith(`${BASE_LUM}`)&&!u.startsWith('data:')&&!u.startsWith('blob:')) externos.push(u); });
await p.goto(`${BASE_LUM}/runtime/verificacao.html`,{waitUntil:'networkidle'});
await p.waitForTimeout(1200);

// --- 1) a matemática: ida-e-volta sobre preto tem de devolver o oficial
const r1 = await p.evaluate(async ()=>{
  const m = await import('/runtime/marca-com-alfa.js');
  const img = await new Promise((ok,no)=>{ const i=new Image();
    i.onload=()=>ok(i); i.onerror=no; i.src='/assets/oficiais/11_lumora_elio_wordmark.png'; });
  const { canvas } = m.extrairAlfa(img);
  // original
  const a=document.createElement('canvas'); a.width=img.naturalWidth; a.height=img.naturalHeight;
  a.getContext('2d').drawImage(img,0,0);
  const orig=a.getContext('2d').getImageData(0,0,a.width,a.height).data;
  // extraído recomposto sobre PRETO
  const c=document.createElement('canvas'); c.width=a.width; c.height=a.height;
  const cx=c.getContext('2d'); cx.fillStyle='#000'; cx.fillRect(0,0,c.width,c.height);
  cx.drawImage(canvas,0,0);
  const volta=cx.getImageData(0,0,c.width,c.height).data;
  let pior=0, bordaAlfa=0;
  const d=canvas.getContext('2d').getImageData(0,0,c.width,c.height).data;
  for(let i=0;i<orig.length;i+=4){
    for(let k=0;k<3;k++) pior=Math.max(pior,Math.abs(orig[i+k]-volta[i+k]));
    const px=(i/4)%c.width, py=((i/4)/c.width)|0;
    if(px<40||py<40||px>=c.width-40||py>=c.height-40) bordaAlfa=Math.max(bordaAlfa,d[i+3]);
  }
  return { pior, bordaAlfa, w:c.width, h:c.height };
});
t(r1.bordaAlfa===0, `campo do JPEG vira alfa 0 exato na borda (máx=${r1.bordaAlfa})`);
t(r1.pior<=12, `ida-e-volta sobre preto fiel à arte: erro máx ${r1.pior}/255 ≤ 12 (piso de ruído medido)`);

// --- 2) o recorte: regra de componentes, não coordenada escrita à mão
const r2 = await p.evaluate(async ()=>{
  const m = await import('/runtime/marca-com-alfa.js');
  const img = await new Promise(ok=>{ const i=new Image(); i.onload=()=>ok(i);
    i.src='/assets/oficiais/11_lumora_elio_wordmark.png'; });
  const { dados } = m.extrairAlfa(img);
  const comps = m.componentes(dados);
  const caixa = m.caixaDaMarca(comps);
  return { n:comps.length, maior:comps[0], segundo:comps[1], caixa };
});
t(r2.maior.area>r2.segundo.area*3,
  `o maior componente é a L com folga (${r2.maior.area} vs ${r2.segundo.area} px)`);
t(r2.caixa.y1<600, `o recorte exclui o wordmark (termina em y=${r2.caixa.y1}, letras começam em y≈619)`);
t(r2.segundo.x0>=r2.maior.x0 && r2.segundo.x1<=r2.maior.x1 &&
  r2.segundo.y0>=r2.maior.y0 && r2.segundo.y1<=r2.maior.y1 &&
  r2.caixa.x1>=r2.segundo.x1,
  'a bolha-ponto está contida na caixa da L e entra no recorte');

// --- 3) chave branca: os dois oficiais de fundo branco
const r3 = await p.evaluate(async ()=>{
  const m = await import('/runtime/marca-com-alfa.js');
  const img = await new Promise(ok=>{ const i=new Image(); i.onload=()=>ok(i);
    i.src='/assets/oficiais/01_lumora_glass_orb.png'; });
  const { dados } = m.extrairAlfa(img, { chave:'branco' });
  const d=dados.data; let borda=0;
  for(let y=0;y<dados.height;y++)for(let x=0;x<dados.width;x++)
    if(x<40||y<40||x>=dados.width-40||y>=dados.height-40)
      borda=Math.max(borda,d[(y*dados.width+x)*4+3]);
  return borda;
});
t(r3===0, `chave branca zera o campo de 01/02 (máx=${r3}) — some a caixa branca sobre a interface escura`);

// --- 4) o papel-mãe deixou de ter área vazia
const r4 = await p.evaluate(()=>{
  const el=document.querySelector('.lum-doc .lum-doc-marca');
  const img=el.querySelector('img.lum-marca-arte');
  const cs=getComputedStyle(el);
  return { estado:el.dataset.lumMarcaEstado, temImg:!!img, alt:img?.alt||'',
           outline:cs.outlineStyle,
           ajuste:img?getComputedStyle(img).printColorAdjust||getComputedStyle(img).webkitPrintColorAdjust:null };
});
t(r4.estado==='pronta' && r4.temImg, 'cabeçalho do papel-mãe preenchido com a L canônica (§70.5/§71.5)');
t(r4.alt.length>0, `a marca tem alternativa textual ("${r4.alt}")`);
t(r4.outline==='none', 'o contorno de "área reservada" sai quando a área é preenchida');
t(r4.ajuste==='exact', 'print-color-adjust:exact — a impressora não descarta o gradiente da L');

// --- 5) sobre os três fundos que a §3 listou como problema
const r5 = await p.evaluate(()=>{
  const cvs=[...document.querySelectorAll('#marcas [data-lum-marca]')];
  return cvs.map(c=>c.dataset.lumMarcaEstado);
});
t(r5.length===3 && r5.every(s=>s==='pronta'),
  'a mesma extração compõe sobre papel branco, Deep Space e aurora acesa');

// --- 6) caminho de falha: nada é inventado no lugar
const r6 = await p.evaluate(async ()=>{
  const m = await import('/runtime/marca-com-alfa.js');
  const div=document.createElement('div');
  div.setAttribute('data-lum-marca','/assets/oficiais/NAO_EXISTE.png');
  document.body.appendChild(div);
  const n = await m.aplicarMarcas(div.parentElement===document.body?div.parentElement:document);
  const res={ estado:div.dataset.lumMarcaEstado, filhos:div.childElementCount };
  div.remove(); return res;
});
t(r6.estado==='indisponivel' && r6.filhos===0,
  'oficial ausente: a área fica reservada e VAZIA — nenhum substituto desenhado (regra 14)');

// --- 7) cache: extrai uma vez por documento
const r7 = await p.evaluate(async ()=>{
  const m = await import('/runtime/marca-com-alfa.js');
  const a = await m.marcaComAlfa(); const b = await m.marcaComAlfa();
  return a===b;
});
t(r7, 'a extração é cacheada por URL — roda uma vez, não uma vez por uso');

// --- 8) custo zero
t(externos.length===0, `nenhum pedido externo (§65.5): ${externos.length}`);

console.log(`\ntmarca  falhas=${bad}  ${ok}`);
await b.close();
process.exit(bad?1:0);
