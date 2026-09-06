/* §72.1 (as quatro funções que faltavam) + §69.6 (infraestrutura das
   Notificações Vivas). Roda contra a mesma bancada das outras suítes. */
import { carregarChromium, acharChromium, BASE } from './navegador.mjs';
const chromium = await carregarChromium();
let ok = 0, bad = 0;
const t = (c, m) => { console.log((c ? 'PASS' : 'FALHA') + '  ' + m); c ? ok++ : bad++; };

const b = await chromium.launch({ executablePath: acharChromium(),
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

const externos = [];
const abrir = async (opcoes = {}) => {
  const p = await b.newPage({ viewport: { width: 1100, height: 950 }, ...opcoes });
  p.on('pageerror', (e) => { console.log('PAGEERROR', e.message); bad++; });
  p.on('request', (r) => { const u = r.url();
    if (!u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:')) externos.push(u); });
  await p.goto(`${BASE}/runtime/verificacao.html`, { waitUntil: 'networkidle' });
  return p;
};

const p = await abrir();
await p.waitForTimeout(700);

/* ================================================ §72.1 item 1 — estados == */

const e1 = await p.evaluate(async () => {
  const m = await import('/runtime/estados-vivos.js');
  const caixa = document.createElement('div');
  document.body.appendChild(caixa);
  const fora = {};
  for (const estado of m.ESTADOS) {
    const el = m.estadoVivo(caixa, { estado });
    fora[estado] = {
      papel: el.getAttribute('role'),
      vivo: el.getAttribute('aria-live'),
      marca: el.dataset.lumEstado,
      frase: el.querySelector('.lum-estado-frase').textContent,
      cenaEscondida: el.querySelector('.lum-estado-cena').getAttribute('aria-hidden'),
      silhueta: getComputedStyle(el.querySelector('.lum-estado-cena')).clipPath,
      raio: getComputedStyle(el.querySelector('.lum-estado-cena')).borderTopLeftRadius,
    };
  }
  // §70.3 — humor nunca em contexto crítico
  const critico = m.estadoVivo(caixa, { estado: 'erro', contexto: 'fiscal' });
  fora._fiscal = critico.querySelector('.lum-estado-frase').textContent;
  // ação
  let acionou = 0;
  const comAcao = m.estadoVivo(caixa, { estado: 'vazio', acao: { rotulo: 'Acender', aoAcionar: () => { acionou += 1; } } });
  comAcao.querySelector('.lum-estado-acao').click();
  fora._acionou = acionou;
  fora._rotulo = comAcao.querySelector('.lum-estado-acao').textContent;
  // declarativo
  const decl = document.createElement('div');
  decl.innerHTML = '<div data-lum-estado-vivo="vazio"></div><div data-lum-estado-vivo="erro"></div>';
  document.body.appendChild(decl);
  fora._aplicados = m.aplicarEstados(decl);
  caixa.remove(); decl.remove();
  return fora;
});

t(e1.vazio.papel === 'status' && e1.vazio.vivo === 'polite',
  '§72.1(1): estado vazio é role=status e aria-live=polite');
t(e1.erro.papel === 'alert' && e1.erro.vivo === 'assertive',
  '§72.1(1): erro é role=alert e aria-live=assertive — falha não espera a vez');
t(e1.semConexao.papel === 'alert', '§72.1(1): sem conexão também é alert');
t(e1.vazio.frase.includes('estrela') && e1.rotaPerdida.frase.toLowerCase().includes('rota perdida'),
  '§72.1(1): as frases são as do vocabulário cósmico ("rota perdida", §72.1)');
t(e1._fiscal === 'Não foi possível concluir. Tente novamente.',
  '§70.3: em contexto fiscal a frase cai para o catálogo neutro, sem humor');
t(e1.vazio.cenaEscondida === 'true', '§35: a cena é decoração e some do leitor de tela');
t(new Set(Object.values({ a: e1.semResultado.silhueta, b: e1.semConexao.silhueta, c: e1.vazio.silhueta })).size === 3
  || e1.erro.raio !== e1.vazio.raio,
  '§35 item 3: cada estado tem forma própria, não só cor');
t(e1._acionou === 1 && e1._rotulo === 'Acender', '§72.1(1): a ação do estado é um botão de verdade');
t(e1._aplicados === 2, '§72.1(1): [data-lum-estado-vivo] aplica pelo HTML, como o Sotaque');

/* ================================== §69.6 — histórico, ações, snooze, Centro */

const n1 = await p.evaluate(async () => {
  const m = await import('/runtime/notificacoes-vivas.js');
  const raiz = document.createElement('div');
  document.body.appendChild(raiz);
  localStorage.removeItem('lum:notificacoes-adiadas');
  const n = new m.NotificacoesVivas({ raiz });

  const idNormal = n.notificar({ texto: 'Pagamento recebido', categoria: 'venda' });
  const idCritica = n.notificar({ texto: 'Rascunho de NF-e', categoria: 'fiscal' });

  const bolhas = [...raiz.querySelectorAll('.lum-bolha-notif')];
  const normal = bolhas.find((el) => !el.classList.contains('lum-u-critica'));
  const critica = bolhas.find((el) => el.classList.contains('lum-u-critica'));

  const rotulos = (el) => [...el.querySelectorAll('.lum-notif-acao')].map((x) => x.textContent);

  const fora = {
    historico: n.historico.length,
    acoesNormal: rotulos(normal),
    acoesCritica: rotulos(critica),
    librasAusente: critica.dataset.lumLibras,
    librasNaNormal: normal.dataset.lumLibras ?? null,
    naoAdiaCritica: n.adiar(idCritica, 'trinta'),
  };

  // clicar numa ação não pode abrir a notificação inteira
  let abriu = 0;
  normal.addEventListener('lum:notificacao-aberta', () => { abriu += 1; });
  normal.querySelector('.lum-notif-adiar .lum-notif-acao').click();
  fora.abriuAoAdiar = abriu;
  fora.adiadas = n._adiadas.size;
  fora.gravado = JSON.parse(localStorage.getItem('lum:notificacoes-adiadas') || '[]').length;
  fora.estadoAdiada = n.historico.find((h) => h.id === idNormal)?.estado;

  // busca
  fora.buscaTexto = n.buscar({ texto: 'rascunho' }).length;
  fora.buscaCategoria = n.buscar({ categoria: 'fiscal' }).length;
  fora.buscaVazia = n.buscar({ texto: 'nada disso existe' }).length;

  // resumo
  const r = n.resumoEmConstelacao();
  fora.resumoTotal = r.total;
  fora.resumoTexto = r.texto;

  // resolver
  n.resolver(idCritica);
  fora.estadoCritica = n.historico.find((h) => h.id === idCritica)?.estado;

  // Libras registrada
  const n2 = new m.NotificacoesVivas({ raiz });
  n2.registrarLibras('fiscal', 'sinal');
  n2.notificar({ texto: 'Outra fiscal', categoria: 'fiscal' });
  const c2 = raiz.querySelectorAll('.lum-bolha-notif.lum-u-critica');
  const ultima = c2[c2.length - 1];
  fora.librasPresente = !!ultima.querySelector('.lum-libras');
  fora.librasRotulo = ultima.querySelector('.lum-libras')?.getAttribute('aria-label');

  n.destruir(); n2.destruir(); raiz.remove();
  localStorage.removeItem('lum:notificacoes-adiadas');
  return fora;
});

t(n1.historico === 2, '§69.6: toda notificação entra no histórico do Centro');
t(n1.acoesNormal.includes('Resolver') && n1.acoesNormal.includes('30 min')
  && n1.acoesNormal.includes('Amanhã'),
  `§69.6: a notificação normal tem Resolver e o snooze 30 min / 1 h / amanhã (${n1.acoesNormal.join(', ')})`);
t(n1.acoesCritica.includes('Resolver') && !n1.acoesCritica.includes('30 min'),
  '§69.3: a crítica tem Resolver e NÃO tem Adiar — adiar seria suprimir aviso');
t(n1.naoAdiaCritica === null, '§69.3: adiar() recusa a crítica mesmo chamada direto');
t(n1.abriuAoAdiar === 0, 'clicar na ação não abre a notificação inteira');
t(n1.adiadas === 1 && n1.gravado === 1,
  '§69.6: o adiamento é gravado, para que "amanhã" não vire "esquecer"');
t(n1.estadoAdiada === 'adiada', '§69.6: o histórico registra o estado adiada');
t(n1.buscaTexto === 1 && n1.buscaCategoria === 1 && n1.buscaVazia === 0,
  '§69.6: histórico pesquisável por texto e filtrável por tipo');
t(n1.resumoTotal === 2 && /2 eventos hoje/.test(n1.resumoTexto),
  `§69.6: resumo em constelação consolida o dia (${n1.resumoTexto})`);
t(n1.estadoCritica === 'resolvida', '§69.6: ação direta Resolver marca o histórico');
t(n1.librasAusente === 'ausente' && n1.librasNaNormal === null,
  '§72.1(5): sem fonte, a crítica marca data-lum-libras="ausente" — e a normal nem isso');
t(n1.librasPresente === true && n1.librasRotulo === 'Aviso em Libras',
  '§72.1(5): registrada a fonte, a janela de Libras nasce rotulada, só na crítica');

/* ------------------------------------------------- Centro de Notificações */

const c1 = await p.evaluate(async () => {
  const mn = await import('/runtime/notificacoes-vivas.js');
  const mc = await import('/runtime/centro-de-notificacoes.js');
  const raiz = document.createElement('div');
  document.body.appendChild(raiz);
  localStorage.removeItem('lum:notificacoes-adiadas');
  const n = new mn.NotificacoesVivas({ raiz });
  const centro = new mc.CentroDeNotificacoes(n, { raiz });

  const gatilho = document.createElement('button');
  document.body.appendChild(gatilho);
  gatilho.focus();

  for (let i = 0; i < 7; i++) n.notificar({ texto: `Evento ${i}`, categoria: i % 2 ? 'venda' : 'fiscal' });

  const fora = { escondidoAntes: centro.el.hidden, fila: n.fila.length };
  // o contador "+3" da §69.5 abre o Centro
  raiz.querySelector('.lum-contador')?.click();
  fora.abriuPeloContador = !centro.el.hidden;
  fora.linhas = centro.el.querySelectorAll('.lum-centro-linha').length;
  fora.papel = centro.el.getAttribute('role');

  centro.elBusca.value = 'Evento 3';
  centro.render();
  fora.filtrado = centro.el.querySelectorAll('.lum-centro-linha').length;

  centro.elBusca.value = 'coisa que não existe';
  centro.render();
  fora.vazioUsaEstado = !!centro.el.querySelector('.lum-estado-vivo');
  fora.vazioEstadoTipo = centro.el.querySelector('.lum-estado-vivo')?.dataset.lumEstado;

  centro.elBusca.value = '';
  centro.elTipo.value = 'fiscal';
  centro.render();
  fora.porTipo = centro.el.querySelectorAll('.lum-centro-linha').length;
  fora.criticaSemAdiar = ![...centro.el.querySelectorAll('.lum-centro-acao')]
    .some((x) => x.textContent === '30 min');

  centro.fechar();
  fora.devolveuFoco = document.activeElement === gatilho;
  fora.acaoNaNebulosa = centro.comoAcaoDaNebulosa().rotulo;

  centro.destruir(); n.destruir(); raiz.remove(); gatilho.remove();
  localStorage.removeItem('lum:notificacoes-adiadas');
  return fora;
});

t(c1.escondidoAntes === true, '§69.6: o Centro nasce fechado');
t(c1.fila === 2 && c1.abriuPeloContador === true,
  '§69.5/§69.6: o contador "+3" agora abre o Centro — antes despachava para ninguém');
t(c1.papel === 'dialog', '§69.6: o Centro é um dialog rotulado');
t(c1.linhas === 7, `§69.6: o histórico inteiro aparece, inclusive o que ficou na fila (${c1.linhas})`);
t(c1.filtrado === 1, '§69.6: a busca por texto filtra a lista');
t(c1.porTipo === 4, `§69.6: o filtro por tipo funciona (${c1.porTipo} fiscais)`);
t(c1.criticaSemAdiar === true, '§69.3: nem pelo Centro a crítica ganha botão de adiar');
t(c1.vazioUsaEstado && c1.vazioEstadoTipo === 'semResultado',
  '§72.1(1)+§69.6: a lista vazia do Centro usa o mesmo estado vivo do sistema');
t(c1.devolveuFoco === true, 'quem abre o Centro com foco recebe o foco de volta ao fechar');
t(c1.acaoNaNebulosa === 'Centro de Notificações', '§69.6: o Centro se oferece à Nebulosa (Ctrl+K)');

/* ============================================= §72.1 item 4 — telemetria == */

const tel = await p.evaluate(async () => {
  const m = await import('/runtime/telemetria-local.js');
  const alvo = document.createElement('div');
  document.body.appendChild(alvo);
  const avisos = [];
  alvo.addEventListener('lum:nivel-aviso', (ev) => avisos.push(ev.detail));

  const t = new m.TelemetriaLocal({ nivel: 'pleno', tetoDoAparelho: 'pleno', alvo, persistir: false });
  const fora = {};

  fora.desceu = t.registrarFps(20);                 // abaixo de 45 -> economico
  fora.desceuDeNovo = t.registrarFps(20);           // abaixo de 30 -> basico
  fora.avisoTexto = avisos[0]?.texto || '';
  fora.avisoTemMotivo = !!avisos[0]?.motivo;
  fora.avisos = avisos.length;

  // subir exige janela longa: uma amostra boa não basta
  fora.naoSobeNaHora = t.registrarFps(60);

  // teto: um aparelho que só aguenta econômico nunca vira pleno
  const t2 = new m.TelemetriaLocal({ nivel: 'basico', tetoDoAparelho: 'economico', alvo, persistir: false });
  for (let i = 0; i < 12; i++) t2.amostras.push({ fps: 60, em: -1 });
  t2._boaDesde = -999999;
  const subiu1 = t2.registrarFps(60);
  t2._boaDesde = -999999;
  for (let i = 0; i < 12; i++) t2.amostras.push({ fps: 60, em: -1 });
  const subiu2 = t2.registrarFps(60);
  fora.subiuUmaVez = subiu1;
  fora.paraNoTeto = subiu2;

  const r = t.relatorio();
  fora.temCampos = ['nivel', 'fps', 'longTasks', 'aparelho', 'trocas'].every((k) => k in r);
  fora.trocas = r.trocas.length;
  fora.exportaJson = (() => { try { return !!JSON.parse(t.exportar()); } catch { return false; } })();
  fora.codigo = m.TelemetriaLocal.toString();

  // IndexedDB: mede e guarda no aparelho (§72.1 item 4)
  const t3 = new m.TelemetriaLocal({ nivel: 'pleno', alvo, persistir: true });
  await t3.limpar();
  fora.gravou = await t3.persistir();
  fora.leu = (await t3.historico()).length;
  await t3.limpar();
  fora.armazenamento = await t3.medirArmazenamento();

  t.destruir(); t2.destruir(); t3.destruir(); alvo.remove();
  return fora;
});

t(tel.desceu === 'economico' && tel.desceuDeNovo === 'basico',
  '§36: fps ruim rebaixa o nível, um degrau por vez');
t(tel.avisos === 2 && /Aliviei/.test(tel.avisoTexto) && tel.avisoTemMotivo,
  `§36: o rebaixamento vem com aviso EM TEXTO, que era a metade que faltava ("${tel.avisoTexto}")`);
t(tel.naoSobeNaHora === null,
  '§36: uma amostra boa não sobe o nível — subir é caro, e a histerese impede oscilação');
t(tel.subiuUmaVez === 'economico' && tel.paraNoTeto === null,
  '§36: sobe até o teto do aparelho e para — o aparelho não vira outro aparelho');
t(tel.temCampos && tel.trocas === 2, '§72.1(4): o relatório traz fps, long tasks, aparelho e trocas');
t(tel.exportaJson, '§59.8: exportar() devolve JSON — a medida é da pessoa');
t(tel.gravou === true && tel.leu === 1,
  '§72.1(4): a medida é guardada em IndexedDB no próprio aparelho e relida de lá');
t(tel.armazenamento === null || typeof tel.armazenamento.cotaMb === 'number',
  '§72.1(4): o armazenamento é medido junto do fps');
t(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(tel.codigo),
  'LGPD: não existe caminho de saída no código da telemetria');

/* ============================================ §72.1 item 6 — onboarding == */

const onb = await p.evaluate(async () => {
  const m = await import('/runtime/onboarding-aurora.js');
  const raiz = document.createElement('div');
  document.body.appendChild(raiz);
  const o = new m.OnboardingAurora(raiz, { voz: false, versaoDosTermos: 'v3' });
  const fora = { espera: m.ESPERA_DOS_TERMOS_MS, passos: o.roteiro.length };

  fora.titulo1 = o.el.querySelector('.lum-onb-titulo').textContent;
  fora.temFalaNaTela = o.el.querySelector('.lum-onb-fala').textContent.length > 40;
  fora.papel = o.el.getAttribute('role');

  o.avancar(); o.avancar();
  fora.titulo3 = o.el.querySelector('.lum-onb-titulo').textContent;
  o.avancar();                       // chega nos termos
  fora.idTermos = o.el.dataset.lumPasso;
  fora.bloqueado = o.btAvancar.disabled;
  fora.rotuloContagem = o.btAvancar.getAttribute('aria-label');
  fora.aceiteRecusado = o.aceitar();
  fora.tracejado = getComputedStyle(o.btAvancar).borderStyle;

  // voltar e avançar não reinicia nem burla a espera
  o.anterior(); o.avancar();
  fora.continuaBloqueado = o.btAvancar.disabled;

  window.__onb = o;
  return fora;
});

t(onb.espera === 10000, '§16: a espera do aceite é de 10 segundos, fixa no módulo');
t(onb.passos === 4 && onb.papel === 'dialog', '§72.1(6): quatro passos, num dialog');
t(/Criando o seu novo mundo|Otimizando o sistema para você|Bem-vindo/.test(onb.titulo1 + onb.titulo3),
  `§2/§36: os títulos dos passos são os do Guia ("${onb.titulo3}")`);
t(onb.temFalaNaTela, '§68.7: a fala da Aurora está SEMPRE escrita na tela, não só falada');
t(onb.idTermos === 'termos' && onb.bloqueado === true,
  '§16: no passo dos termos o aceite nasce bloqueado');
t(/\d+ segundos/.test(onb.rotuloContagem || ''),
  `§16/§35: o tempo que falta é anunciável, não só um número mudando ("${onb.rotuloContagem}")`);
t(onb.aceiteRecusado === null, '§16: aceitar() recusa enquanto a espera não terminou');
t(onb.tracejado === 'dashed', '§35 item 3: o botão indisponível não depende só de cor');
t(onb.continuaBloqueado === true,
  '§16: voltar um passo e retornar não reinicia nem encurta a espera');

await p.waitForTimeout(10400);        // a espera real dos 10s da §16

const onb2 = await p.evaluate(() => {
  const o = window.__onb;
  const fora = { liberado: !o.btAvancar.disabled, rotulo: o.btAvancar.textContent };
  const aceite = o.aceitar();
  fora.aceite = aceite;
  fora.temData = !!aceite && !Number.isNaN(Date.parse(aceite.aceitoEm));
  o.destruir();
  return fora;
});

t(onb2.liberado === true && !/\(\d+s\)/.test(onb2.rotulo),
  '§16: passados os 10 segundos, o aceite libera e o rótulo perde a contagem');
t(onb2.temData && onb2.aceite.versao === 'v3' && onb2.aceite.esperaCumpridaMs === 10000,
  '§16: o aceite registra data, hora e versão dos termos');

/* ------------------------------------------------------ movimento reduzido */

const p2 = await abrir({ reducedMotion: 'reduce' });
await p2.waitForTimeout(500);
const red = await p2.evaluate(async () => {
  const m = await import('/runtime/estados-vivos.js');
  const caixa = document.createElement('div');
  document.body.appendChild(caixa);
  const el = m.estadoVivo(caixa, { estado: 'carregando' });
  const cena = el.querySelector('.lum-estado-cena');
  const fora = {
    animacao: getComputedStyle(cena).animationName,
    frase: el.querySelector('.lum-estado-frase').textContent.length,
  };
  const mo = await import('/runtime/onboarding-aurora.js');
  const o = new mo.OnboardingAurora(caixa, { voz: false });
  fora.onda = getComputedStyle(o.el.querySelector('.lum-onb-aurora')).animationName;
  fora.textoDoOnboarding = o.el.querySelector('.lum-onb-fala').textContent.length;
  o.destruir(); caixa.remove();
  return fora;
});
t(red.animacao === 'none' && red.frase > 10,
  '§35 item 8: com movimento reduzido a cena para de animar e a frase continua');
t(red.onda === 'none' && red.textoDoOnboarding > 40,
  '§35 item 8: a cortina da Aurora para; a narração escrita permanece');
await p2.close();

t(externos.length === 0, `nenhum pedido externo (§65.5): ${externos.length}`);

console.log(`\nt72  falhas=${bad}  ${ok}`);
await b.close();
process.exit(bad ? 1 : 0);
