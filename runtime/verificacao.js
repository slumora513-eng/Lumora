/* ==========================================================================
   Script da bancada de verificação. NÃO faz parte do runtime.

   Vive em arquivo próprio, e não embutido no HTML, por um motivo concreto:
   assim o site inteiro roda sob `script-src 'self'` — sem 'unsafe-inline'.
   É esse CSP que transforma o "custo zero" da §65.5 (nenhuma rede externa)
   de convenção em garantia imposta pelo navegador. Ver infra/README.md.
   ========================================================================== */

import { Lumora, anunciar, restaurarPaleta, CamadaDeSistema } from './lumora.js';
import { estrelaDoUsuario, climaDoDia } from './interface-viva.js';

restaurarPaleta();

const canvas = document.getElementById('ceu');
const abas = [
  { id:'financeiro', rotulo:'Financeiro', sub:[
      {id:'pdv',rotulo:'PDV'},{id:'pedidos',rotulo:'Pedidos'},{id:'comprov',rotulo:'Comprovantes'}]},
  { id:'operacao', rotulo:'Controle de Operação', sub:[
      {id:'rotas',rotulo:'Rotas'},{id:'entregas',rotulo:'Entregas'}]},
  { id:'estoque', rotulo:'Estoque' },
  { id:'fiscal', rotulo:'Fiscal', sub:[{id:'nfe',rotulo:'NF-e'},{id:'nfce',rotulo:'NFC-e'}]},
  { id:'comunidade', rotulo:'Comunidade' },
  { id:'patio', rotulo:'Vista de Pátio' },
];
const acoes = [
  { id:'venda', rotulo:'Nova venda', grupo:'Financeiro', executar(){ anunciar('Nova venda aberta.'); } },
  { id:'patio', rotulo:'Vista de Pátio', grupo:'Painéis', executar(){ anunciar('Vista de Pátio.'); } },
  { id:'lgpd', rotulo:'Relatório LGPD', grupo:'Conformidade', executar(){ anunciar('Relatório LGPD.'); } },
  { id:'nfe', rotulo:'Emitir NF-e', grupo:'Fiscal', executar(){ anunciar('Rascunho de NF-e criado.'); } },
  { id:'foco', rotulo:'Modo Foco', grupo:'Interface', executar(){ lum.modoFoco(true); } },
];
const lum = new Lumora({
  canvasCeu: canvas,
  canvasSismografo: document.getElementById('sismo'),
  abas, acoes,
  aoNavegar: (aba, sub) => anunciar(`Abrindo ${(sub||aba).rotulo}.`),
});
document.getElementById('badges').append(
  estrelaDoUsuario({ nome:'Fundador', nivel:12, plano:'Ecossistema' }),
  climaDoDia({ tipo:'bom', texto:'dia de céu aberto' }),
);
document.getElementById('saudacao').textContent = lum.sotaque.saudacao();

// Céu Vivo
for (const b of document.querySelectorAll('[data-fase]')) {
  b.addEventListener('click', () => {
    lum.ceu.definirFase(b.dataset.fase);
    anunciar(`Céu ajustado para ${b.dataset.fase}.`);
  });
}
document.getElementById('acender').addEventListener('click', () => {
  lum.acenderEstrela({ tipo: 'venda', em: Date.now() });
  anunciar('Uma estrela foi acesa por uma ação do negócio.');
});
document.getElementById('constelacao').addEventListener('click', () => {
  const c = lum.constelacaoDoDia();
  anunciar(c ? `Constelação do Dia desenhada com ${c.pontos.length} estrelas.`
             : 'Acenda ao menos duas estrelas antes.');
});
const btFoco = document.getElementById('foco');
btFoco.addEventListener('click', () => {
  const ligado = btFoco.getAttribute('aria-pressed') !== 'true';
  btFoco.setAttribute('aria-pressed', String(ligado));
  lum.modoFoco(ligado);
  anunciar(ligado ? 'Modo Foco ligado. O céu respira.' : 'Modo Foco desligado.');
});

// Medidor local de fps (§72.1 item 4 — nada sai do aparelho)
const medidor = document.getElementById('medidor');
setInterval(() => {
  const nivel = document.documentElement.dataset.lumNivel;
  medidor.textContent = `fps: ${lum.ceu.fps ?? '—'} · nível §36: ${nivel} · ` +
    `movimento reduzido: ${lum.movimentoReduzido ? 'sim' : 'não'}`;
}, 1000);

// Toggle
const tg = document.getElementById('tg'), rotulo = document.getElementById('tg-rotulo');
tg.addEventListener('click', () => {
  const ligado = tg.getAttribute('aria-pressed') !== 'true';
  tg.setAttribute('aria-pressed', String(ligado));
  rotulo.textContent = ligado ? 'Ligado' : 'Desligado';   // §35 item 3
});

// Idioma
for (const b of document.querySelectorAll('[data-idioma]')) {
  b.addEventListener('click', () => lum.definirIdioma(b.dataset.idioma));
}

// Viagem Cósmica
const a = document.getElementById('tela-a'), b = document.getElementById('tela-b');
document.getElementById('ir-b').addEventListener('click', (ev) =>
  lum.viajar(a, b, { foco: { x: ev.clientX, y: ev.clientY } }));
document.getElementById('ir-a').addEventListener('click', (ev) =>
  lum.viajar(b, a, { foco: { x: ev.clientX, y: ev.clientY } }));

// Animações dos slots (§49)
const palco = document.getElementById('palco');
for (const b of document.querySelectorAll('[data-slot]')) {
  b.addEventListener('click', () => {
    lum.tocarAnimacao(b.dataset.slot, palco);
    anunciar(`Tocando a animação ${b.dataset.slot}.`);
  });
}

// Atlas Estelar (§16) — dados de exemplo, só para o banco de verificação
const catalogo = [
  { id:'varejo', nome:'Varejo', temas:[
    { id:'alimentacao', nome:'Alimentação', nichos:[
      { id:'pizzaria', nome:'Pizzaria' }, { id:'padaria', nome:'Padaria' },
      { id:'hamburgueria', nome:'Hamburgueria' }, { id:'acai', nome:'Açaí' }]},
    { id:'moda', nome:'Moda', nichos:[
      { id:'boutique', nome:'Boutique' }, { id:'calcados', nome:'Calçados' }]},
    { id:'mercado', nome:'Mercearia', nichos:[
      { id:'hortifruti', nome:'Hortifruti' }, { id:'conveniencia', nome:'Conveniência' }]}]},
  { id:'servicos', nome:'Serviços', temas:[
    { id:'beleza', nome:'Beleza', nichos:[
      { id:'salao', nome:'Salão' }, { id:'barbearia', nome:'Barbearia' }]},
    { id:'oficina', nome:'Oficinas', nichos:[
      { id:'mecanica', nome:'Mecânica' }, { id:'funilaria', nome:'Funilaria' }]}]},
  { id:'logistica', nome:'Logística', temas:[
    { id:'entregas', nome:'Entregas', nichos:[
      { id:'motoboy', nome:'Motoboy' }, { id:'fracionada', nome:'Carga fracionada' }]},
    { id:'armazem', nome:'Armazenagem', nichos:[{ id:'cd', nome:'Centro de distribuição' }]}]},
  { id:'saude', nome:'Saúde', temas:[
    { id:'clinicas', nome:'Clínicas', nichos:[
      { id:'odonto', nome:'Odontologia' }, { id:'fisio', nome:'Fisioterapia' }]}]},
  { id:'educacao', nome:'Educação', temas:[
    { id:'cursos', nome:'Cursos livres', nichos:[{ id:'idiomas', nome:'Idiomas' }]}]},
];
// Camada de sistema (§65.1) — canvas próprio, por cima do Céu Vivo
const camada = new CamadaDeSistema(document.getElementById('camada'), {
  sistema: 'rotacerta', nivel: lum.nivel,
});
camada.iniciar();
function mostrarEstado() {
  const el = document.getElementById('camada-estado');
  const motivo = camada.motivoDoVazio();
  el.textContent = motivo
    ? `${camada.sistema}: camada vazia — ${motivo}`
    : `${camada.sistema}: ${camada.waypoints.length} waypoints, ${camada.aneis.length} anéis, ${camada.satelites.length} satélites`;
}
mostrarEstado();
for (const b of document.querySelectorAll('#camada-botoes [data-sistema]')) {
  b.addEventListener('click', () => { camada.definirSistema(b.dataset.sistema); mostrarEstado(); });
}

const atlas = lum.abrirAtlas(document.getElementById('atlas'), { dados: catalogo });
document.getElementById('atlas-lista').addEventListener('click', () => {
  const alvo = atlas.modo === '3d' ? 'lista' : '3d';
  atlas.modo = alvo;
  atlas.raiz.dataset.lumModo = alvo;
  atlas._posicionarBotoes();
  anunciar(`Atlas em modo ${alvo === 'lista' ? 'lista' : 'cosmográfico'}.`);
});
document.getElementById('atlas-topo').addEventListener('click', () => atlas.irPara([]));

// Notificações Vivas (§69)
for (const b of document.querySelectorAll('[data-notif]')) {
  b.addEventListener('click', () => {
    const u = b.dataset.notif;
    lum.notificar(u === 'critica'
      ? { texto:'Rascunho de NF-e aguardando aprovação', categoria:'fiscal', valor:'R$ 1.250,00' }
      : { texto:'Pagamento recebido', categoria:'pagamento_demo', urgencia:u, valor:'R$ 320,00' });
  });
}
document.getElementById('bolido').addEventListener('click', () =>
  lum.lancarBolido({ texto:'Falha crítica no serviço de emissão fiscal.' }));
document.getElementById('ventania').addEventListener('click', () => {
  lum.notificacoes.ventania();
  anunciar('Notificações não críticas dispensadas.');
});

// Tema e navegação
for (const b of document.querySelectorAll('[data-tema]')) {
  b.addEventListener('click', () => {
    lum.definirTema(b.dataset.tema);
    anunciar(`Tema ${b.dataset.tema} aplicado.`);
  });
}
document.getElementById('abrir-nav').addEventListener('click', () => lum.navegacao.abrir());
document.getElementById('abrir-neb').addEventListener('click', () => lum.nebulosa.abrir());

// Interface Viva
document.getElementById('rastro').addEventListener('click', () =>
  lum.rastro.durante(new Promise(r => setTimeout(r, 3000))));
document.getElementById('pulso').addEventListener('click', () => {
  lum.acenderEstrela({ tipo:'venda', forca: 1.2 });
  anunciar('Pulso injetado no Sismógrafo e estrela acesa.');
});

// Paletas
for (const bt of document.querySelectorAll('[data-paleta]')) {
  bt.addEventListener('click', () => {
    lum.definirPaleta(bt.dataset.paleta);
    anunciar(`Paleta ${bt.dataset.paleta} aplicada.`);
  });
}

/* ---- 11 · Estados vazios e de erro (§72.1 item 1) ---- */
const palcoEstado = document.getElementById('palco-estado');
for (const bt of document.querySelectorAll('[data-estado]')) {
  bt.addEventListener('click', () => {
    lum.estado(palcoEstado, {
      estado: bt.dataset.estado,
      contexto: bt.dataset.contexto || 'geral',
      acao: { rotulo: 'Tentar de novo', aoAcionar: () => anunciar('Ação do estado acionada.') },
    });
  });
}

/* ---- 12 · Centro de Notificações, snooze e Libras (§69.6 / §72.1 item 5) ---- */
const centroEstado = document.getElementById('centro-estado');
function mostrarCentro() {
  const r = lum.notificacoes.resumoEmConstelacao();
  centroEstado.textContent = `${r.texto} · histórico: ${lum.notificacoes.historico.length} · ` +
    `adiadas: ${lum.notificacoes._adiadas.size} · fonte de Libras (fiscal): ` +
    `${lum.notificacoes.libras.has('fiscal') ? 'registrada' : 'ausente'}`;
}
mostrarCentro();
document.getElementById('abrir-centro').addEventListener('click', () => { lum.centro.abrir(); mostrarCentro(); });
document.getElementById('encher').addEventListener('click', () => {
  const cats = ['venda', 'entrega', 'pedido', 'sistema'];
  for (let i = 0; i < 8; i++) {
    lum.notificar({ texto: `Evento de demonstração ${i + 1}`, categoria: cats[i % cats.length] });
  }
  mostrarCentro();
});
document.getElementById('resumo-dia').addEventListener('click', () => {
  const r = lum.resumoDoDia();
  centroEstado.textContent = `${r.texto} · constelação: ${r.constelacao ? `${r.constelacao.pontos.length} estrelas` : 'acenda ao menos duas'}`;
});
document.getElementById('libras-registrar').addEventListener('click', () => {
  // Fonte de DEMONSTRAÇÃO da bancada — não é conteúdo de Libras e não se
  // apresenta como tal. O ponto do teste é o SLOT: que a janela nasça só na
  // crítica e que a ausência fique auditável. Ver ESCALACOES.md §8.
  lum.notificacoes.registrarLibras('fiscal', () => {
    const p = document.createElement('p');
    p.textContent = '[fonte de demonstração da bancada]';
    return p;
  });
  mostrarCentro();
});

/* ---- 13 · Telemetria local (§72.1 item 4) ---- */
const telSaida = document.getElementById('tel-saida');
document.getElementById('tel-relatorio').addEventListener('click', () => {
  telSaida.textContent = lum.telemetria.exportar();
});
document.getElementById('tel-baixo').addEventListener('click', () => {
  lum.telemetria.registrarFps(18);          // abaixo do piso de qualquer nível
  telSaida.textContent = lum.telemetria.exportar();
});
document.getElementById('tel-limpar').addEventListener('click', async () => {
  const ok = await lum.telemetria.limpar();
  telSaida.textContent = ok ? 'Histórico local apagado.' : 'Sem IndexedDB disponível.';
});

/* ---- 14 · Onboarding narrado pela Aurora (§72.1 item 6) ---- */
document.getElementById('abrir-onb').addEventListener('click', () => {
  lum.onboarding(document.getElementById('palco-onb'), {
    voz: false,                              // a bancada não fala sozinha
    aoConcluir: (aceite) => anunciar(`Termos aceitos em ${aceite.aceitoEm}, versão ${aceite.versao}.`),
  });
});

/* ---- 15 · Vista de Pátio (§65.4) ---- */
document.getElementById('abrir-patio').addEventListener('click', () => {
  const painel = document.createElement('div');
  painel.className = 'grade';
  // Painel de DEMONSTRAÇÃO: "como o negócio está, o que poderia mudar" é
  // conteúdo de produto (§61), não de identidade. A bolha recebe o que quem
  // integra entregar; aqui entra um esqueleto só para a bolha ter conteúdo.
  for (const [titulo, corpo] of [
    ['Hoje', 'A dashboard panorâmica é do produto.'],
    ['Rotas', 'Esta bancada só mostra a bolha que a recebe.'],
    ['Fiscal', 'Nenhum dado real é simulado aqui.'],
  ]) {
    const c = document.createElement('div');
    c.className = 'lum-card';
    c.innerHTML = '<strong></strong><br><span class="aviso"></span>';
    c.querySelector('strong').textContent = titulo;
    c.querySelector('.aviso').textContent = corpo;
    painel.appendChild(c);
  }
  lum.patio.abrir(painel);
});
