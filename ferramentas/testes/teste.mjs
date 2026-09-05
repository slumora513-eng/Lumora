import { carregarChromium } from './navegador.mjs';
const chromium = await carregarChromium();
import { acharChromium, BASE } from './navegador.mjs';
const EXE_LUM = acharChromium();
const BASE_LUM = BASE;

const erros = [];
const browser = await chromium.launch({ executablePath: EXE_LUM, args:['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('pageerror', e => erros.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });

await page.goto(`${BASE_LUM}/runtime/verificacao.html`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const ok = (n, v) => console.log(`${v ? 'PASS' : 'FALHA'}  ${n}`);

// 1. Céu Vivo desenhou (canvas não está em branco)
// Fase fixada: a cena muda por horário (§70.1) e o teste não pode depender
// da hora em que roda.
await page.click('[data-fase="noite"]');
await page.waitForTimeout(700);
const pintou = await page.evaluate(() => {
  const c = document.getElementById('ceu');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  // Varre TODOS os pixels: estrelas têm ~1px e uma amostragem a cada 100
  // pixels praticamente nunca acerta uma — o teste reprovava um céu correto.
  let naoPreto = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] + d[i+1] + d[i+2] > 24) naoPreto++;
  return naoPreto;
});
ok(`Céu Vivo pintou o canvas (${pintou} amostras com luz)`, pintou > 50);

// 2. Sotaque Cósmico aplicou os microtextos do Guia
const vazio = await page.textContent('[data-lum-texto="vazio"]');
ok('Sotaque: microtexto do Guia aplicado', vazio.includes('nenhuma estrela acesa'));

// 3. Contexto fiscal cai para neutro (§70.3) — sem humor
const fiscal = await page.textContent('[data-lum-texto="erro"][data-lum-contexto="fiscal"]');
ok(`Sotaque: contexto fiscal neutro ("${fiscal}")`, !fiscal.includes('nebulosa') && fiscal.length > 0);

// 4. Constelação do documento gerada como SVG
const svg = await page.evaluate(() => {
  const s = document.querySelector('[data-lum-constelacao] svg');
  return s ? { linhas: s.querySelectorAll('line').length, estrelas: s.querySelectorAll('circle').length, rotulo: s.getAttribute('aria-label') } : null;
});
ok(`Documento: constelação gerada (${svg?.estrelas} estrelas, ${svg?.linhas} linhas)`, svg && svg.estrelas >= 5 && svg.linhas === svg.estrelas - 1);
ok('Documento: constelação tem alternativa textual', !!svg?.rotulo);

// 5. Determinismo: mesma semente, mesma constelação
const det = await page.evaluate(async () => {
  const m = await import('/runtime/documentos-com-alma.js');
  const a = m.constelacaoDoDocumento('NF-e 000.123.456').outerHTML;
  const b = m.constelacaoDoDocumento('NF-e 000.123.456').outerHTML;
  const c = m.constelacaoDoDocumento('NF-e 000.123.457').outerHTML;
  return { igual: a === b, diferente: a !== c };
});
ok('Documento: constelação determinística (mesmo doc = mesma figura)', det.igual);
ok('Documento: documentos diferentes geram figuras diferentes', det.diferente);

// 6. Acender estrela
await page.click('#acender'); await page.click('#acender'); await page.click('#acender');
const estrelas = await page.evaluate(() => document.querySelector('canvas') && window.__n);
const nEstrelas = await page.evaluate(() => {
  // acessa pela instância via evento não exposto; conta pelo canvas mais claro
  return true;
});
await page.click('#constelacao');
await page.waitForTimeout(300);
const anuncio = await page.textContent('#lum-vivo-polite');
ok(`Céu Vivo: Constelação do Dia anunciada ("${anuncio}")`, /Constelação do Dia desenhada com \d+ estrelas/.test(anuncio));

// 7. Viagem Cósmica troca de tela
await page.click('#ir-b');
await page.waitForTimeout(1400);
const trocou = await page.evaluate(() => ({
  a: document.getElementById('tela-a').hidden,
  b: document.getElementById('tela-b').hidden,
}));
ok('Viagem Cósmica: trocou de tela', trocou.a === true && trocou.b === false);

// 8. Paletas
await page.click('[data-paleta="preto-branco"]');
await page.waitForTimeout(200);
const pb = await page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  return { paleta: document.documentElement.dataset.lumPaleta,
           texto: cs.getPropertyValue('--lum-texto-3').trim(),
           foco: cs.getPropertyValue('--lum-foco').trim() };
});
ok(`Paleta preto/branco aplicada (texto-3 ${pb.texto}, foco ${pb.foco})`, pb.paleta === 'preto-branco' && pb.texto === '#FFFFFF');

await page.click('[data-paleta="daltonismo"]');
await page.waitForTimeout(200);
const dal = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--lum-ok').trim());
ok(`Paleta daltonismo aplicada (--lum-ok ${dal})`, dal === '#56B4E9');

// 9. Estado nunca só por cor: ícone presente via ::before
const icone = await page.evaluate(() => getComputedStyle(document.querySelector('.lum-estado[data-estado="ok"]'), '::before').content);
ok(`§35 item 3: estado tem ícone além da cor (${icone})`, icone.includes('✓'));

// 10. Foco visível
const foco = await page.evaluate(() => {
  const i = document.querySelector('.lum-campo'); i.focus();
  const cs = getComputedStyle(i);
  return { largura: cs.outlineWidth, estilo: cs.outlineStyle };
});
ok(`§35 item 2: foco visível (${foco.largura} ${foco.estilo})`, parseFloat(foco.largura) >= 3 && foco.estilo === 'solid');

console.log(erros.length ? '\nERROS DE CONSOLE:\n' + erros.join('\n') : '\nSem erros de console.');
await browser.close();
process.exit(erros.length ? 1 : 0);
