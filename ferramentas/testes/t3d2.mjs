import { carregarChromium } from './navegador.mjs';
const chromium = await carregarChromium();
import { acharChromium, BASE } from './navegador.mjs';
const EXE_LUM = acharChromium();
const BASE_LUM = BASE;
const ok=(n,v)=>console.log(`${v?'PASS':'FALHA'}  ${n}`);
const exe=EXE_LUM;

// --- com WebGL
{
  const b = await chromium.launch({ executablePath:exe, args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport:{width:900,height:520} });
  const err=[]; p.on('pageerror',e=>err.push(e.message));
  await p.goto(`${BASE_LUM}/runtime/verificacao.html`,{waitUntil:'networkidle'});
  await p.waitForTimeout(500);
  const r = await p.evaluate(async () => {
    const m3 = await import('/runtime/animacoes-3d.js');
    const m  = await import('/runtime/animacoes.js');
    const out = { sup: m3.Motor3D.suportado(), slots3d: m3.Motor3D.slots.length, cenas:{}, memo:true };
    // memoização: 40 chamadas não podem estourar o limite de contextos
    for (let i=0;i<40;i++) if (!m3.Motor3D.suportado()) out.memo=false;
    const c = document.createElement('canvas');
    c.style.inlineSize='400px'; c.style.blockSize='225px'; document.body.appendChild(c);
    const motor = new m3.Motor3D(c,{});
    for (const s of m3.Motor3D.slots){
      try{ motor.poster(s);
        const gl=motor.gl, px=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);
        gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,px);
        // Um quadro válido: tem conteúdo aceso, NÃO está estourado, e o céu
        // no alto continua Deep Space (a §60.1 pede "fundo escuro" — se o
        // canto superior estiver claro, a cena lavou).
        let claro=0;
        for(let i=0;i<px.length;i+=4){ if(px[i]+px[i+1]+px[i+2]>150) claro++; }
        const n=px.length/4, W=gl.drawingBufferWidth, H=gl.drawingBufferHeight;
        // readPixels tem origem embaixo: a última linha é o TOPO da tela
        let topo=0, amostras=0;
        for (let y=H-6; y<H; y++) for (let x=0; x<W; x+=7){
          const i=(y*W+x)*4; topo += px[i]+px[i+1]+px[i+2]; amostras++;
        }
        out.cenas[s]={ok:true, claro:+(claro/n*100).toFixed(1), topo:Math.round(topo/amostras)};
      }catch(e){ out.cenas[s]={ok:false,erro:String(e.message).slice(0,120)}; }
    }
    motor.destruir(); c.remove();
    out.temSlots3D = m.Animacoes.slots3D.length;
    return out;
  });
  ok(`§65.5: WebGL ativo, ${r.slots3d} aberturas em 3D`, r.sup && r.slots3d===6);
  ok('Motor3D.suportado() memoizado (40 chamadas sem esgotar contextos)', r.memo);
  ok(`Animacoes expõe slots3D (${r.temSlots3D})`, r.temSlots3D===6);
  for (const [s,v] of Object.entries(r.cenas)) {
    const bom = v.ok && v.claro < 55 && v.claro > 0.2 && v.topo < 120;
    ok(`3D ${s.padEnd(22)} aceso ${String(v.claro).padStart(5)}%  céu no topo ${String(v.topo).padStart(3)}/765`, bom);
  }
  console.log(err.length?'ERROS: '+err.join('; '):'sem erros de página (WebGL)');
  await b.close();
}

// --- sem WebGL: precisa cair no Canvas 2D sem quebrar
{
  const b = await chromium.launch({ executablePath:exe, args:['--no-sandbox','--disable-webgl','--disable-3d-apis'] });
  const p = await b.newPage({ viewport:{width:900,height:520} });
  const err=[]; p.on('pageerror',e=>err.push(e.message));
  await p.goto(`${BASE_LUM}/runtime/verificacao.html`,{waitUntil:'networkidle'});
  await p.waitForTimeout(500);
  const r = await p.evaluate(async () => {
    const m3 = await import('/runtime/animacoes-3d.js');
    const m  = await import('/runtime/animacoes.js');
    const a = new m.Animacoes({});
    const c = document.createElement('canvas');
    c.style.inlineSize='400px'; c.style.blockSize='225px'; document.body.appendChild(c);
    a.poster('abertura.elio', c);
    const alvo = document.body.contains(c) ? c : document.querySelector('canvas:last-of-type');
    const ctx = alvo.getContext('2d');
    let luz=0;
    if (ctx){ const d=ctx.getImageData(0,0,alvo.width,alvo.height).data;
      for(let i=0;i<d.length;i+=4) if(d[i]+d[i+1]+d[i+2]>60) luz++; }
    return { sup: m3.Motor3D.suportado(), tem3D: a.tem3D('abertura.elio'), luz };
  });
  ok(`§49.3: sem WebGL, tem3D() é falso (suportado=${r.sup})`, r.sup===false && r.tem3D===false);
  ok(`§49.3: fallback Canvas 2D desenha mesmo assim (${r.luz} px com luz)`, r.luz > 200);
  console.log(err.length?'ERROS: '+err.join('; '):'sem erros de página (sem WebGL)');
  await b.close();
}
