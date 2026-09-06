# Runtime — Fase 3A

> **Liberado pelo "pode ir" do Fundador em 05/09/2026.**
> §71 encerrava com *"Código permanece bloqueado até o 'pode ir' final do fundador."*
> Esse sinal foi dado; a Fase 3A saiu do bloqueio.

Estética procedural da Lumora em código. **Zero asset, zero rede, zero dependência.**

---

## Ordem de implementação (§71, decidida pelo Fundador)

| # | Passo | Arquivos | Estado |
|---|---|---|---|
| 1 | ✨ **Formas que Sentem** (base tátil) | `formas-que-sentem.css` + respingo em `lumora.js` | ✅ completo |
| 2 | 🌌 **Céu Vivo** (ambiente) | `ceu-vivo.js` | ✅ completo (Canvas 2D) |
| 3 | 💬 **Sotaque Cósmico** (textos) | `sotaque-cosmico.js` | ✅ completo |
| 4 | 🚀 **Viagem Cósmica** (transições) | `viagem-cosmica.js` | ✅ completo |
| 5 | 📜 **Documentos com Alma** (PDF) | `documentos-com-alma.{css,js}` | ✅ completo — a L entra por `marca-com-alfa.js` |
| 6 | 🌈 **Acessibilidade Bonita** | `acessibilidade-bonita.css` | ✅ **6 de 6 paletas** |

## Extensão de 05/09/2026 — "pode fazer tudo"

O Fundador estendeu o "pode ir" às animações. Saíram do bloqueio:

| Módulo | Arquivos | Guia |
|---|---|---|
| **Animações dos slots** — 6 aberturas em **WebGL 3D** + 5 carregamentos em Canvas 2D | `animacoes-3d.js` · `animacoes.js` · `animations.manifest.json` | §18 / §49 / §65.5 |
| **Notificações Vivas** — bolha (Elio), faixa-onda (Aurora), Bólido, hierarquia de urgência, identidade sonora WebAudio | `notificacoes-vivas.{js,css}` | §69 · §67.5 · §72.1(3) |
| **Navegação em Bolhas e em Ondas** | `navegacao.{js,css}` | §65.3 · §66 |
| **Interface Viva** — Nebulosa de Ações, Rastro de Aurora, Sismógrafo Vivo, Poeira de Interação, Fio de Ariadne, Estrelinha, Comandos de Voz, Estrela do Usuário, Clima do Dia | `interface-viva.{js,css}` | §67 · §68 |

## A rodada de 06/09/2026 — o que estava aprovado e sem código

A §72.1 aprovou seis funções em 02/09/2026 (*"eu apoio essas seis candidatas, pode colocar
todas"*) e **cinco ficaram marcadas "código na rodada a agendar"**. A §69.7 registrava a
priorização da §69.6 como **"PRIORIZAÇÃO EM ABERTO"**. O *"pode fazer tudo"* do Fundador
liberou as duas coisas; o que faltava era executar.

| Módulo | Arquivos | Guia |
|---|---|---|
| **Estados vazios e de erro com identidade** — seis estados, forma própria por estado, contexto crítico caindo para o catálogo neutro | `estados-vivos.{js,css}` | §72.1 item 1 · §70.3 |
| **Telemetria local de desempenho** — fps, long tasks, armazenamento, histerese, teto do aparelho e o **aviso em texto** que a §36 exigia | `telemetria-local.js` | §72.1 item 4 · §36 |
| **Libras** — datilologia com velocidade ajustável e a janela da notificação crítica | `libras.js` | §72.1 item 5 · §60.3 |
| **Onboarding narrado pela Aurora** — voz nativa, texto em paralelo e a **regra dos 10s** | `onboarding-aurora.{js,css}` | §72.1 item 6 · §16 · §68.6(1) |
| **Centro de Notificações** — histórico pesquisável, filtro por tipo, Resolver/Abrir/Adiar | `centro-de-notificacoes.js` | §69.6 |
| **Snooze cósmico, ações rápidas e resumo em constelação** | dentro de `notificacoes-vivas.js` | §69.6 |
| **Vista de Pátio** — gira, afasta, anuncia e abre a dashboard dentro de uma bolha | `vista-de-patio.js` + CSS em `interface-viva.css` | §65.4 · criatividade 3 da §61 |

Do item 3 (identidade sonora WebAudio) o código já existia; o item 2 era de spec, não de
runtime. **Os seis estão de pé.**

Base compartilhada: `tokens.css`. Bootstrap: `lumora.js`.

### Animações: código procedural, não arquivo de mídia

§48 proíbe *"nenhuma nova **geração de imagem, vídeo ou áudio**"*. **Nenhum arquivo de mídia
foi gerado.** As 11 cenas são Canvas 2D — código, no meio que a §65.5 decidiu e que a §71 exige
por leveza.

Elas ocupam os slots da §49 como versão `1`, `fonte: "procedural-lumora"`. Os vídeos finais do
profissional contratado (§48/§64.2) entram como versão superior no manifest e viram ativos
**sem mudar código** — a "troca sem deploy" da §49.3. A versão procedural continua como o
**fallback obrigatório** que a mesma §49.3 exige. §64.2 permanece congelada.

**As 11 cenas têm briefing vigente.** `abertura.business` era a única sem — o original caiu com
a aquarela (§60.1) — e recebeu briefing oficial do Fundador em 05/09/2026: *céu estrelado puro,
sem motivo extra* (§65.1). Nenhuma cena é provisória.

---

## Uso

```html
<link rel="stylesheet" href="runtime/tokens.css">
<link rel="stylesheet" href="runtime/formas-que-sentem.css">
<link rel="stylesheet" href="runtime/acessibilidade-bonita.css">
<link rel="stylesheet" href="runtime/animacoes.css">   <!-- texto das aberturas -->
<link rel="stylesheet" href="runtime/atlas-estelar.css">
<link rel="stylesheet" href="runtime/estados-vivos.css">
<link rel="stylesheet" href="runtime/onboarding-aurora.css">

<body class="lum-raiz">
  <canvas id="ceu" aria-hidden="true"></canvas>
  ...
</body>

<script type="module">
  import { Lumora, anunciar, restaurarPaleta } from './runtime/lumora.js';
  restaurarPaleta();
  const lum = new Lumora({ canvasCeu: document.getElementById('ceu') });

  lum.acenderEstrela({ tipo: 'venda', valor: 250 });  // §70.1
  lum.constelacaoDoDia();                             // §71.1
  lum.modoFoco(true);                                 // §13 + §67.3
  await lum.viajar(telaA, telaB, { foco: { x, y } }); // §70.2
  lum.definirPaleta('daltonismo');                    // §35 item 7
  lum.abrirAtlas(elemento, { dados: catalogo });      // §16 Atlas Estelar
  anunciar('Pedido autorizado.', 'assertive');        // §69.5

  lum.estado(caixa, { estado: 'vazio' });             // §72.1 item 1
  lum.centro.abrir();                                 // §69.6
  lum.notificacoes.adiar(id, 'amanha');               // §69.6 snooze cósmico
  lum.resumoDoDia();                                  // §69.6 + §71.1
  lum.relatorioDeDesempenho();                        // §72.1 item 4 — local
  lum.onboarding(palco);                              // §72.1 item 6
</script>
```

> **Armadilha do canvas, já contornada no runtime:** `<canvas>` é elemento
> substituído. Com `position: fixed; inset: 0` mas **sem** `inline-size`/
> `block-size` em CSS, ele **não estica** — o tamanho intrínseco vira o tamanho
> usado, e como `redimensionar()` escreve nos atributos `width`/`height`, o
> layout se realimenta e o céu encolhe a cada quadro. `CeuVivo` passou a
> assumir a medida do próprio canvas para que nenhuma integração caia nisso.

---

## Regras que o código impõe, e não delega a quem usa

Estas não são convenções que alguém possa esquecer — estão no caminho de execução:

| Regra | Onde é imposta |
|---|---|
| **Humor nunca em contexto fiscal/crítico** (§70.3) | `SotaqueCosmico.frase()` troca para o catálogo neutro sozinha quando o contexto está em `CONTEXTOS_CRITICOS` |
| **`prefers-reduced-motion` reduz gesto, nunca informação** (§35 item 8) | Céu Vivo desenha um quadro estático em vez de parar de existir; Viagem Cósmica vira fade e **ainda navega**; respingo não é criado; a constelação do documento permanece |
| **Som nunca é canal único** (§45/§68.5/§69.5) | `anunciar()` é canal de texto independente, com `aria-live` polite/assertive. Nas aberturas não há som algum: a fala é **texto em DOM** com `aria-live`, nunca pixel desenhado no canvas |
| **Cor nunca carrega informação sozinha** (§35 item 3) | `.lum-estado` e `.lum-doc-status` injetam ícone por `::before` em toda paleta, inclusive preto/branco |
| **Campo é geométrico, não bolha** (§65.3) | `tokens.css` aplica `--lum-raio-campo` a inputs, selects, textareas e tabelas |
| **Nada pisca acima de 3 Hz** (§35 item 8) | Ciclo de respiração fixado em 3 s (0,33 Hz) |
| **Telemetria local, sem analytics externo** (§72.1 item 4) | `telemetria-local.js` mede fps, long tasks e armazenamento no aparelho, guarda em IndexedDB local e decide o nível §36. **Não existe `fetch`, `XMLHttpRequest`, `sendBeacon` nem `WebSocket` no arquivo** — e a suíte verifica isso lendo o próprio código |
| **O aviso do rebaixamento é texto, não só efeito** (§36 + §35 item 3) | `lum:nivel-aviso` carrega a frase, e `Lumora` a anuncia por `aria-live` |
| **Humor nunca no estado de erro crítico** (§70.3) | `estadoVivo()` passa o contexto ao Sotaque, que troca de catálogo sozinho |
| **Crítica não adia, por caminho nenhum** (§69.3) | `adiar()` recusa, o botão não é criado na notificação e o Centro não o oferece |
| **Voz nunca é o único canal** (§68.7) | o onboarding lê **o mesmo nó de texto** que está na tela; sem `speechSynthesis`, nada se perde |
| **A espera de 10s dos termos é real** (§16) | o aceite nasce desabilitado, `aceitar()` recusa antes da hora, e voltar um passo não reinicia nem encurta a contagem |
| **Custo zero** (§65.5, §71) | Verificado: **0 pedidos externos** de rede |

---

## Verificação

```bash
python3 -m http.server 8765          # na raiz do repositório
# abre http://localhost:8765/runtime/verificacao.html

node ferramentas/testes/rodar.mjs    # as 343 checagens, de uma vez
```

`verificacao.html` é bancada de teste local — **não é produto nem asset de marca**.

**343 checagens automatizadas**, todas passando — 207 em Chromium sobre `verificacao.html` e
136 em Node puro, porque o Blueprint da §50 é formato de arquivo e não precisa de navegador:

| Suíte | Checagens |
|---|---|
| Fase 3A (§71) | 13 |
| Animações, notificações, navegação, Interface Viva | 24 |
| Movimento reduzido — Fase 3A | 6 |
| Movimento reduzido — módulos novos | 7 |
| Aberturas em WebGL 3D | 11 |
| Camada de texto das aberturas | 21 |
| Atlas Estelar | 22 |
| **Marca com alfa** | **14** |
| **Camada de sistema (§65.1)** | **18** |
| **Estados vivos, Centro, telemetria, Libras, onboarding e Vista de Pátio** | **71** |
| **Blueprint Universal (§50) — formato e validador** | **62** |
| **Compilador do Blueprint (§50.2) — Render e AWS** | **74** |

**0 pedidos de rede externos** (custo zero, §65.5). As mesmas suítes rodam contra um site
publicado (`LUM_BASE=https://…`), o que testa o deploy junto com o código — ver
[`../infra/README.md`](../infra/README.md).

Fora do navegador, dois verificadores em Python:

```bash
python3 ferramentas/verificar_assets.py        # integridade dos oficiais (sha256, formato, fundo)
python3 ferramentas/verificar_daltonismo.py --tudo   # as seis paletas sob dicromacia
```

---

## O que este runtime NÃO faz

- **Não desenha a L canônica.** Ela está confirmada
  ([`../docs/11-l-canonica.md`](../docs/11-l-canonica.md)) e entra na tela por
  **medição**, não por desenho: `marca-com-alfa.js` recupera o alfa que o JPEG
  achatou. Desenhar um substituto violaria a regra 14 — e continua proibido.
- **Não gera arquivo de mídia** — imagem, vídeo ou áudio. §48 continua valendo;
  o que existe é código procedural.
- **Não substitui o profissional contratado.** §64.2 (cronograma, fornecedor,
  execução) segue congelada. As cenas procedurais preenchem o slot até os
  vídeos finais chegarem, e viram fallback depois.
- **Não compõe o wordmark "LUMORA" sobre papel claro.** Ele é branco, e branco
  sobre papel branco some — resultado fisicamente correto, não falha da
  extração. Para isso falta uma versão em tinta escura do produtor. A **L**,
  que é o que §70.5/§71.5 pedem, é cromática e sobrevive ao papel: desde
  05/09/2026 o cabeçalho do papel-mãe **deixou de ser área reservada e vazia**
  ([`../ESCALACOES.md`](../ESCALACOES.md) §3).
- **Não desenha configuração de mão em Libras.** Libras é língua, e §35/§60.3
  exigem validação com a comunidade surda. `libras.js` entrega o motor —
  sequência, velocidade ajustável, legenda em paralelo — e as 27 configurações
  entram por `registrarAlfabeto()`. Sem elas, nada é desenhado
  ([`../ESCALACOES.md`](../ESCALACOES.md) §8).

---

## Camada WebGL — as aberturas em 3D

§65.5 decide **"Canvas 2D + WebGL (shaders)"**. As duas metades estão entregues.

As **6 aberturas** rodam em WebGL (`animacoes-3d.js`) — profundidade real, não
desenho chapado:

| Cena | O que é 3D de verdade |
|---|---|
| `abertura.elio` | Intersecção raio-esfera analítica, normal real, Fresnel e **refração**: o céu é reamostrado pelo raio que atravessa a bolha, com parede fina de bolha de sabão. É isso que dá volume. |
| `abertura.aurora` | **Volume raymarchado** — a cortina tem espessura e o raio acumula densidade atravessando ela. |
| `abertura.rotacerta` | **Refeita em 05/09/2026** (ver abaixo). Rota **teal** que serpenteia até o horizonte, waypoints **âmbar** pousados sobre ela, veículos em SDF de caixa correndo **ao longo** da rota, orientados pela tangente dela, com farol e oclusão real (§65.1). |
| `abertura.business` | Campo estelar por direção do raio, com **paralaxe real** de três camadas de profundidade. |
| `abertura.ecossistema` | Órbitas 3D em perspectiva; os sistemas são recolhidos por uma bolha de vidro. |
| `abertura.hub` | Núcleo de vidro e conexões neurais como **segmentos 3D** com distância raio↔segmento. |

WebGL1 cru: um triângulo de tela cheia e um fragment shader por cena.
**Sem bibliotecas**, como a §65.5 exige.

A silhueta do vidro é **anti-serrilhada por cobertura**: a intersecção raio-esfera
é binária e desenhava a borda em degraus — e numa bolha Liquid Glass a borda é
justamente o que se olha. `vidro()` devolve cobertura junto com a cor, medindo a
silhueta contra uma janela de ~1 pixel projetada na profundidade da esfera.

Os **5 carregamentos** ficam em Canvas 2D de propósito — são estados utilitários
de ~2,5 s, e a §36 pede leveza onde a cena não é a peça de apresentação.

**Cadeia de fallback (§36/§49.3):** WebGL indisponível, nível Básico, shader que
não compila ou contexto perdido → as cenas Canvas 2D assumem. Com
`prefers-reduced-motion` → pôster estático. O usuário nunca vê tela quebrada.

**As duas superfícies.** Um `<canvas>` entrega **um** tipo de contexto na vida, e
as aberturas são WebGL enquanto os carregamentos são 2D. O palco por isso guarda
**duas superfícies**, uma visível por vez — e o canvas de quem integra **nunca é
substituído**. A tentação é clonar e trocar o elemento; não funciona, porque quem
integra guardou a referência dele e passa a desenhar num nó fora do documento.
Medido no banco antes da correção: depois do primeiro carregamento, todas as cenas
seguintes pintavam um canvas órfão — tela congelada.

### `abertura.rotacerta` — por que foi refeita

O Fundador reprovou a primeira versão: *"ficou algo meio confuso, tipo assim, meio
estranho"*. O diagnóstico foi que a cena tinha **duas ideias que não se encontravam**
— uma grade retrô de chão com caixas correndo por cima, e pontos âmbar boiando no
céu, sem relação entre si. Nenhum dos dois estava "errado" isolado; juntos não
formavam leitura.

A versão nova tem **uma ideia só**: uma rota luminosa que vai daqui até o horizonte,
e tudo o que aparece está **sobre ela**.

| Antes | Agora |
|---|---|
| Grade de chão retrô ocupando a tela | Grade removida. O chão é escuro; quem desenha o espaço é a rota |
| Waypoints âmbar flutuando soltos no céu | Waypoints **pousados na rota**, com um feixe curto até ela |
| Veículos correndo em linha reta, alheios à rota | Veículos **sobre a rota**, seguindo a curva dela |
| Luzes atravessando a lataria (soma sem profundidade) | Luzes **ocluídas** pelo corpo do veículo |

Isso também é o que a §65.1 pede quando fala em *"malha de rotas luminosas
(teal + âmbar) ligando waypoints"* — a rota é o assunto, não o cenário.

### A camada de texto das aberturas

Decisão do Fundador em 05/09/2026: em vez de produzir os áudios, entra o **texto
da fala**. Ver [`../docs/09-producao-de-assets.md`](../docs/09-producao-de-assets.md).

- Catálogo em `LEGENDAS` (`animacoes.js`), estilo em `animacoes.css`.
- As **duas falas são textuais da §1**; as outras nove cenas não têm fala no Guia
  e por isso não ganharam nenhuma.
- O texto é **DOM com `aria-live="polite"`**, não pixel no canvas: sem áudio, ele
  é o único canal de informação, e §35 não admite informação que só existe como
  pixel. Assim o leitor de tela anuncia e o texto escala com o zoom.
- O runtime envolve o canvas num `.lum-palco` — mudança contida, e a única forma
  de ancorar o texto à cena sem depender do layout de quem integra.

---

## Atlas Estelar (§16) — o cosmógrafo 3D da Comunidade

Nome oficial aprovado pelo Fundador em 01/09/2026. O Guia fixa as quatro
camadas e quem narra:

> galáxias (categorias) → constelações (temas) → estrelas (nichos) →
> nicho individual, **com narração da Aurora**

Era a única assinatura de sistema da §65.1 que ainda não existia em código.

### O 3D é a pele; o DOM é a verdade

Cada nó visível é um `<button>` de verdade, posicionado sobre a projeção da
estrela na tela. Isso não é acessibilidade pendurada no fim: navegação que só
existe como pixel **não tem foco, não tem leitor de tela, não tem teclado e
não tem como ser testada** — reprovaria a §35 inteira. Com o botão real, tudo
isso vem de graça e o WebGL cuida só do que faz bem, que é a luz.

É a mesma decisão da legenda das aberturas, pelo mesmo motivo.

| O que | Como |
|---|---|
| Descer uma camada | Clique ou <kbd>Enter</kbd> na estrela |
| Subir | <kbd>Esc</kbd>, ou o passo anterior no fio |
| Andar entre estrelas | Setas — vão para a estrela **visualmente** mais próxima naquela direção, não para a próxima do documento |
| Aproximar | Roda ou **pinça** (o gesto que o Guia nomeia para o Atlas) |
| Orbitar | Arrastar o céu |
| Buscar | Varre a árvore **inteira** e salta direto para o achado, com o caminho dele |

**O foco nunca é largado.** Trocar de camada destrói os botões da camada
anterior, inclusive o que estava focado; sem reposicionar, quem navega por
teclado é devolvido ao `<body>` e perde o Atlas sem nenhum aviso. Quem entra
com foco aqui dentro sai com foco aqui dentro.

### Modo lista — a mesma navegação sem GPU

`[data-lum-modo="lista"]` usa **a mesma marcação**: os mesmos botões viram
grade legível. Vale para nível básico (§36), para aparelho sem WebGL e para
contexto perdido. Não é degradação de emergência, é a experiência inteira sem
custo — e como a marcação é uma só, **nenhuma funcionalidade mora só no 3D**.

### Posição determinística

A mesma categoria cai **sempre** no mesmo lugar do céu: espiral de Fibonacci
para não formar aglomerado, deslocada pelo hash do id. Sem isso a memória
espacial de quem navega não vale nada — e memória espacial é a única razão de
um atlas ser 3D em vez de lista. O gerador é o mesmo dos Documentos com Alma;
a regra de determinismo mora num lugar só.

### Enquadramento, não distância fixa

A distância da câmera é **calculada para a camada caber**. Com um número fixo
por camada, uma galáxia com muitos temas simplesmente sai da tela — e no 3D
"sair da tela" não avisa, só some.

### O que o Atlas NÃO faz

Avaliação de 1 a 5 estrelas, comentários moderados, gamificação e pagamentos
(§16) são **regra de negócio da Comunidade**, não identidade visual. Este
runtime entrega a navegação e a narração; o resto é do produto.

---

## A marca com alfa (§3 das escalações)

Os 13 oficiais são JPEG: **sem transparência**. Sobre papel branco nenhum modo de
mistura resolve (`screen` sobre branco dá branco), e por isso o cabeçalho do
papel-mãe ficava com a área reservada e vazia.

`marca-com-alfa.js` resolve **sem tocar num byte** dos oficiais. A arte é luz
aditiva sobre preto, e achatar luz aditiva sobre preto é inversível:

```
observado  C = A·K        recupera  A = max(C)/255      K = C · 255/max(C)
```

Isso **não é desenhar a marca** (regra 14): é medir o que o arquivo já contém — a
mesma categoria de operação com que `docs/10-paleta.md` extraiu a paleta.

**O piso de ruído é medido.** Na borda de 40 px dos oficiais de fundo escuro o
ruído JPEG tem p99.9 = 12 e **máximo = 12** (de 255). O piso ficou em 12/255 com
joelho suave até 20/255. Verificado: alfa do campo = **0 exato**, e o erro de
ida-e-volta sobre preto puro tem **máximo de 12/255** — o pior pixel é
`(0,0,12) → (0,0,0)`, isto é, só se perde o ruído que se queria remover.

**O recorte é computado, não uma coordenada escrita à mão:** o maior componente
conexo é a L, e entram com ela os componentes contidos na caixa dela — que é como
a bolha-ponto é capturada sem precisar de regra própria.

```html
<div class="lum-doc-marca" data-lum-marca data-lum-marca-alt="Lumora"></div>
```

Vazio usa a L canônica (oficial 11, que `docs/11-l-canonica.md` nomeia como a
referência mais limpa da forma isolada). Os dois oficiais de fundo branco (01, 02)
usam a chave inversa automaticamente.

**Em falha nada é desenhado.** Oficial ausente, canvas indisponível: o elemento
recebe `data-lum-marca-estado="indisponivel"` e a área volta a ficar reservada e
vazia. Inventar um substituto é que seria proibido.

Custo: ~110 ms uma vez por documento (inclui decodificar o JPEG de 1024×1024),
com cache por URL. Nenhum pedido externo.

**O que continua faltando do produtor:** o wordmark "LUMORA" é branco e sobre
papel branco some — resultado fisicamente correto, não falha da extração. Para
wordmark sobre fundo claro é preciso uma versão em tinta escura.

---

## Camada de sistema (§65.1)

O Céu Vivo é o fundo de **todos** os sistemas e muda só por horário. Por cima dele, cada
sistema tem a sua **camada complementar** — é o que `camada-de-sistema.js` desenha, num
canvas próprio com alfa.

| Sistema | Camada |
|---|---|
| **RotaCerta** | Rotas teal + waypoints âmbar em constelação + rastro de navegação |
| **Hub** | Núcleo de luz + anéis orbitais + satélites-bolha |
| **Business** | **vazia** — céu estrelado puro (decisão do Fundador) |
| **Comunidade** | **vazia** — o Atlas Estelar já é a camada |
| **Ecossistema** | **vazia** — a §65.1 não define assinatura para ele (ver abaixo) |

> **Corrigido em 06/09/2026, na releitura integral do Guia.** A versão anterior desenhava para
> o Ecossistema a malha do RotaCerta **mais o núcleo do Hub**, em intensidade reduzida. Isso
> contraria duas seções ao mesmo tempo: §17/§34 (o Hub é interno da equipe e **nunca** compõe
> produto do catálogo) e §27 (o Ecossistema é **RotaCerta + Business**, não RotaCerta + Hub).
> A §65.1 lista assinatura para três produtos — Business, RotaCerta e Hub — e não define
> nenhuma para o Ecossistema. Camada vazia com motivo registrado é o que sobra; inventar uma
> assinatura seria inventar identidade.

```js
const camada = new CamadaDeSistema(canvas, { sistema: 'rotacerta', nivel });
camada.iniciar();
camada.definirSistema('hub');
```

Ou pelo bootstrap: `new Lumora({ canvasCamada, sistema })` e `lum.definirSistema('hub')`.

Os dois vazios são **decisão registrada**, não implementação faltando — `SEM_CAMADA` guarda o
motivo de cada um e `motivoDoVazio()` devolve ele. Um vazio que sabe explicar por que está
vazio é diferente de um vazio por esquecimento.

**As cores saem dos tokens CSS**, então as seis paletas alcançam o ambiente: na paleta
preto/branco a camada se desliga (essa paleta existe para clareza máxima) e na paleta clara
ela reforça em vez de sumir — o caso que `acessibilidade-bonita.css` registrava e deixava
"para quem integra".

Geometria **determinística** (mesma regra do Atlas e da constelação dos documentos): o mesmo
sistema cai sempre no mesmo lugar, senão a memória espacial de quem usa não vale nada.

---

## Defaults do agente neste runtime

Conforme a regra 22. Nenhum é decisão do Fundador.

- **(DEFAULT DO AGENTE — o Guia nomeia "madrugada / dia / noite" mas não fixa
  os horários de corte.)** `FASES_PADRAO` usa 0–5 / 6–17 / 18–23. Substituível
  em `opcoes.fases` sem tocar no resto.
- **(DEFAULT DO AGENTE — o Guia registra 4 microtextos; os demais estados
  precisavam de texto para a interface existir.)** As frases marcadas `AGENTE`
  em `sotaque-cosmico.js` não constam do Guia. §72.1 item 1 aprovou a *função*
  "estados vazios e de erro com identidade", não as frases.
- **(DEFAULT DO AGENTE — nenhuma família tipográfica é nomeada em 59 páginas e
  nenhum arquivo de fonte foi entregue.)** `--lum-fonte` usa pilha de sistema,
  para não depender de asset externo nem simular o wordmark oficial.
- **(DEFAULT DO AGENTE — a paleta daltonismo precisava de valores para a §35
  item 7 existir.)** Base Okabe-Ito, contraste calculado sobre Deep Space
  (8,89:1 / 9,10:1 / 5,30:1 / 15,50:1). O teste em simulador que a §35 exige
  **foi feito** — em código, para ser reproduzível:
  `ferramentas/verificar_daltonismo.py`. Menor ΔE00 entre os quatro estados:
  21,7 (normal), 15,3 (protanopia), 11,7 (deuteranopia), 8,6 (tritanopia) — e
  os 8,6 são o teto do Okabe-Ito ali, não um descuido.
- **(DEFAULT DO AGENTE — o Guia dá o briefing de cada abertura, mas não a
  encenação quadro a quadro.)** Tempos, ordem dos trechos e composição de cada
  uma das 11 cenas são decisão deste agente; os briefings em si vêm da §18/§49.1,
  e o de `abertura.business` do Fundador (05/09/2026).
- **(DEFAULT DO AGENTE — §16 manda a Aurora narrar o Atlas Estelar e não
  escreve as frases.)** As falas da narração são deste agente, no tom que a
  §16 descreve para ela (guardiã, calma quando ajuda). O que é do Guia é a
  função — narrar —, não o texto.
- **(DEFAULT DO AGENTE — o Guia fixa as quatro camadas do Atlas e não a
  encenação.)** Cores por camada, ligação das constelações pelo vizinho mais
  próximo, achatamento do céu e limites de zoom são escolha deste agente.
- **(DEFAULT DO AGENTE — o Fundador decidiu *que* entra o texto da fala, não a
  tipografia nem o momento em que ele aparece.)** O nome do sistema entra a 58% da
  abertura e a fala a 74%; nos carregamentos o microtexto entra logo no início. O
  véu de leitura sob o texto também é escolha deste agente — existe porque a cena
  tem momentos claros (cortina de aurora, farol âmbar) onde branco puro perderia
  contraste. **As falas em si não são default: são textuais da §1.**
- **(DEFAULT DO AGENTE — a §35 item 3 exige que a cor nunca seja canal único, mas
  não fixa o texto de cada nível.)** A urgência **"alta"** das Notificações Vivas
  distinguia-se de "normal" apenas pela cor âmbar: o ritmo que serviria de reserva
  é desligado por `prefers-reduced-motion`, e na variante de faixa não havia ritmo
  próprio. Ganhou forma (losango, terceira forma além do círculo de "normal" e do
  quadrado de "crítica") e o microtexto **`" · prioridade"`**, espelhando o
  `" · exige ação"` que "crítica" já tinha. A necessidade foi medida:
  `--lum-atencao` e `--lum-critico` ficam a ΔE00 = 8,6 sob tritanopia.

- **(DEFAULT DO AGENTE — §65.1 e docs/04 dizem O QUE cada camada de sistema mostra,
  não como.)** A geometria da camada (quantos waypoints, o traçado por vizinho mais
  próximo, a posição do núcleo fora do centro para não brigar com o conteúdo), as
  densidades por nível §36 e a decisão de **desligar o ambiente na paleta preto/branco**
  são deste agente. Os motivos em si — rotas teal + waypoints âmbar, núcleo + anéis +
  satélites — vêm citados do Guia.

- **(DEFAULT DO AGENTE — o piso de ruído para extrair o alfa não vem do Guia; vem
  de medir os arquivos.)** 12/255, com joelho suave até 20/255, em
  `marca-com-alfa.js`. É o máximo de ruído JPEG observado no campo escuro dos
  oficiais. E a regra de recorte — maior componente conexo mais o que estiver
  contido na caixa dele — também é escolha deste agente, feita para não escrever
  coordenada de recorte à mão.

- **(DEFAULT DO AGENTE — §72.1 item 3 aprovou "notas procedurais WebAudio
  (fiscal/pedido/sistema)" sem fixar as notas.)** As frequências de
  `IdentidadeSonora` foram escolhidas por este agente.

- **(DEFAULT DO AGENTE — §72.1 item 1 aprovou a FUNÇÃO "estados vazios e de erro
  com identidade", não as frases nem as formas.)** As silhuetas de cada estado
  em `estados-vivos.css` (círculo, círculo vincado, losango, círculo partido,
  quadrado vazado) são deste agente. As duas frases citadas na própria §72.1 —
  *"nada aqui ainda…"* e *"rota perdida"* — vêm do Guia.

- **(DEFAULT DO AGENTE — §36 pede "aviso discreto" e "pode subir", sem escrever
  o texto nem a regra de subida.)** A histerese de `telemetria-local.js` (piso
  30/45 fps, margem de 10 fps, janela de 30 s e 8 amostras limpas para subir),
  o teto no nível detectado na entrada e as duas frases do aviso são deste
  agente. Descer é barato e subir é caro **de propósito**: um aparelho que
  oscila em volta do limiar não pode ficar trocando de nível, porque a troca
  custa mais que o ganho.

- **(DEFAULT DO AGENTE — §69.6 nomeia "30 min / 1 h / amanhã" e não diz que
  horas é "amanhã".)** "Amanhã" é **8h do dia seguinte**, não "daqui a 24
  horas": adiar para amanhã às 3 da manhã não adia nada. O adiamento é gravado
  em `localStorage` e rearmado na montagem seguinte, senão "adiar para amanhã"
  viraria "esquecer".

- **(DEFAULT DO AGENTE — §60.3 pede "velocidade de troca de letras ajustável" e
  não fixa a escala.)** 600 ms por letra como referência, faixa de 0,5× a 3×, e
  respiro de 1,5× na letra repetida — sem ele "ANNA" lê como "ANA". **As 27
  configurações de mão não são default de agente nenhum:** são conteúdo de
  língua, exigem validação com a comunidade surda (§35/§60.3) e estão escaladas
  em [`../ESCALACOES.md`](../ESCALACOES.md) §8.

- **(DEFAULT DO AGENTE — §72.1 item 6 aprova a narração e não escreve o
  roteiro.)** As falas do onboarding são deste agente, no tom que a §1 descreve
  para a Aurora. **Os títulos dos passos não são default:** "Criando o seu novo
  mundo" é o título da §2 e "Otimizando o sistema para você" o da §36, ambos
  verbatim. A espera de 10 s também não é default — é a §16.
