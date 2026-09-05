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
| 5 | 📜 **Documentos com Alma** (PDF) | `documentos-com-alma.{css,js}` | ⚠️ área da L reservada e vazia |
| 6 | 🌈 **Acessibilidade Bonita** | `acessibilidade-bonita.css` | ⚠️ 3 de 6 paletas |

## Extensão de 05/09/2026 — "pode fazer tudo"

O Fundador estendeu o "pode ir" às animações. Saíram do bloqueio:

| Módulo | Arquivos | Guia |
|---|---|---|
| **Animações dos slots** — 6 aberturas + 5 carregamentos, em Canvas 2D | `animacoes.js` + `animations.manifest.json` | §18 / §49 |
| **Notificações Vivas** — bolha (Elio), faixa-onda (Aurora), Bólido, hierarquia de urgência, identidade sonora WebAudio | `notificacoes-vivas.{js,css}` | §69 · §67.5 · §72.1(3) |
| **Navegação em Bolhas e em Ondas** | `navegacao.{js,css}` | §65.3 · §66 |
| **Interface Viva** — Nebulosa de Ações, Rastro de Aurora, Sismógrafo Vivo, Poeira de Interação, Fio de Ariadne, Estrelinha, Comandos de Voz, Estrela do Usuário, Clima do Dia | `interface-viva.{js,css}` | §67 · §68 |

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
  anunciar('Pedido autorizado.', 'assertive');        // §69.5
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
| **Som nunca é canal único** (§45/§68.5/§69.5) | `anunciar()` é canal de texto independente, com `aria-live` polite/assertive |
| **Cor nunca carrega informação sozinha** (§35 item 3) | `.lum-estado` e `.lum-doc-status` injetam ícone por `::before` em toda paleta, inclusive preto/branco |
| **Campo é geométrico, não bolha** (§65.3) | `tokens.css` aplica `--lum-raio-campo` a inputs, selects, textareas e tabelas |
| **Nada pisca acima de 3 Hz** (§35 item 8) | Ciclo de respiração fixado em 3 s (0,33 Hz) |
| **Telemetria local, sem analytics externo** (§72.1 item 4) | `_medirFps()` mede no aparelho e rebaixa o nível §36; nada sai |
| **Custo zero** (§65.5, §71) | Verificado: **0 pedidos externos** de rede |

---

## Verificação

```bash
python3 -m http.server 8765          # na raiz do repositório
# abre http://localhost:8765/runtime/verificacao.html
```

`verificacao.html` é bancada de teste local — **não é produto nem asset de marca**.

Conferido em Chromium, **50 checagens automatizadas**, todas passando:

| Suíte | Checagens |
|---|---|
| Fase 3A (§71) | 13 |
| Animações, notificações, navegação, Interface Viva | 24 |
| Movimento reduzido — Fase 3A | 6 |
| Movimento reduzido — módulos novos | 7 |

**0 pedidos de rede externos** (custo zero, §65.5).

---

## O que este runtime NÃO faz

- **Não desenha a L canônica.** Ela está confirmada
  ([`../docs/11-l-canonica.md`](../docs/11-l-canonica.md)), mas os 9 arquivos
  que a portam são JPEG sem alfa. `documentos-com-alma.css` **reserva** a área
  e a deixa vazia. Desenhar um substituto violaria a regra 14.
- **Não gera arquivo de mídia** — imagem, vídeo ou áudio. §48 continua valendo;
  o que existe é código procedural.
- **Não substitui o profissional contratado.** §64.2 (cronograma, fornecedor,
  execução) segue congelada. As cenas procedurais preenchem o slot até os
  vídeos finais chegarem, e viram fallback depois.
- **Não define "Fogo de Nebulosa", "Aurora Dia" nem "Aurora Noite".** Nomeadas
  em §70.6 sem nenhum valor no Guia. Os seletores existem e estão **vazios** —
  ver [`../ESCALACOES.md`](../ESCALACOES.md) §7.

---

## Camada WebGL

§65.5 decide **"Canvas 2D + WebGL (shaders)"**. Esta entrega é a camada
**Canvas 2D**, completa e sem dependências. A camada de shaders para a aurora é
o refinamento seguinte — e o Canvas 2D permanece como o caminho garantido para
hardware básico, que a §36 exige de qualquer forma. Não é atalho: é a metade
que roda em todo aparelho.

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
  (8,89:1 / 9,10:1 / 5,30:1 / 15,50:1). O teste em simulador (Coblis, Stark)
  que a §35 exige é etapa de QA, ainda não feita.
- **(DEFAULT DO AGENTE — o Guia dá o briefing de cada abertura, mas não a
  encenação quadro a quadro.)** Tempos, ordem dos trechos e composição de cada
  uma das 11 cenas são decisão deste agente; os briefings em si vêm da §18/§49.1,
  e o de `abertura.business` do Fundador (05/09/2026).
- **(DEFAULT DO AGENTE — §72.1 item 3 aprovou "notas procedurais WebAudio
  (fiscal/pedido/sistema)" sem fixar as notas.)** As frequências de
  `IdentidadeSonora` foram escolhidas por este agente.
