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

Base compartilhada: `tokens.css`. Bootstrap: `lumora.js`.

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

Conferido em Chromium (1200×760, DPR 2), 13 checagens + 6 no caminho de
movimento reduzido, todas passando; **0 pedidos de rede externos**.

---

## O que este runtime NÃO faz

- **Não produz animação, vídeo ou áudio.** §48 e §64.2 continuam valendo — o
  "pode ir" liberou a Fase 3A (§71), não a produção de assets, que é do
  profissional contratado e segue **congelada**.
- **Não desenha a L canônica.** Ela está confirmada
  ([`../docs/11-l-canonica.md`](../docs/11-l-canonica.md)), mas os 9 arquivos
  que a portam são JPEG sem alfa. `documentos-com-alma.css` **reserva** a área
  e a deixa vazia. Desenhar um substituto violaria a regra 14.
- **Não implementa as Notificações Vivas (§69).** §69.7 registra
  *"PRIORIZAÇÃO EM ABERTO"* — o design está fechado, mas o Fundador ainda não
  disse por qual item começar. Fora do escopo da §71.
- **Não implementa Navegação em Bolhas/Ondas (§65.3/§66)** nem o restante da
  Interface Viva (§67/§68). Também fora da lista da §71.
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
