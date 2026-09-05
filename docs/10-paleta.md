# 10 — Paleta

> ## ⚠️ Estes valores são DEFAULT DO AGENTE, não decisão do Fundador
>
> **(DEFAULT DO AGENTE — o Guia nomeia cores ("teal + âmbar", "violeta/ciano", "verdes/teal/
> violeta", "vermelho-laranja profundo") mas NÃO fixa um único valor hexadecimal em 59 páginas.
> Verificado por busca: zero ocorrências de `#RRGGBB` no documento inteiro. Escolher hexes por
> conta própria seria inventar identidade que o Guia não sustenta — proibido. Medi-los nos
> assets oficiais é a única forma de obter valores ancorados em algo canônico.)**
>
> Todos os valores abaixo foram **extraídos por amostragem dos 13 PNGs oficiais**, não
> escolhidos. Continuam **pendentes de aprovação do Fundador**.

Método: conversão RGB→HSV, filtro de pixels de marca (S > 0,45 e V > 0,55), busca do pixel de
maior `S×V` dentro de cada faixa de matiz. Reprodutível com
`python3 ferramentas/verificar_assets.py --paleta`.

---

## Deep Space — o fundo

Medido nos 4 cantos dos 11 assets de fundo escuro.

| Token | Hex | Origem |
|---|---|---|
| `--deep-space` | `#00040F` | Média dos cantos dos assets de fundo escuro |
| `--deep-space-puro` | `#000006` | Cantos dos wordmarks 09–12 |
| `--deep-space-nebulosa` | `#00080F` | Cantos dos glyphs 06/08 (nebulosa mais presente) |

Faixa medida completa (média dos 4 cantos): `#000000` (asset 13) a `#00080F` (asset 08).
O valor `--deep-space` é o arredondamento de trabalho dessa faixa.

---

## A L canônica — o gradiente da marca

Medido em **4 assets independentes**, que convergem:

| Asset | Início (violeta) | Matiz | Fim (azul) | Matiz |
|---|---|---|---|---|
| `11_lumora_elio_wordmark` | `#B01DFF` | 279° | `#006CFF` | 215° |
| `13_lumora_ecossistema_wordmark` | `#B114FF` | 280° | `#0072FF` | 213° |
| `09_lumora_comunidade_wordmark` | `#8812FE` | 270° | `#0079FF` | 212° |
| `08_lumora_ecosystem_orbit` | `#AB19FE` | 278° | `#0096FF` | 205° |

**Valores propostos** (mediana das quatro medições):

| Token | Hex | Papel |
|---|---|---|
| `--lumora-violeta` | `#B01DFF` | Início do gradiente da L |
| `--lumora-azul` | `#0072FF` | Fim do gradiente da L |
| `--lumora-gradiente` | `linear-gradient(160deg, #B01DFF, #0072FF)` | Gradiente canônico |

A convergência entre quatro arquivos produzidos separadamente é forte evidência de que este
gradiente **já é** a cor da marca — mas registrar isso como decisão continua sendo do Fundador.

---

## Aurora

Medido em `05_lumora_aurora_glyph`.

| Token | Hex | Matiz | Papel |
|---|---|---|---|
| `--aurora-verde` | `#2BCF92` | 158° | Rios de aurora, crista das ondas |
| `--aurora-teal` | `#1D8FC5` | 199° | Corpo da onda |
| `--aurora-violeta` | `#8541FA` | 262° | Extremidade violeta da aurora |

§65.2 descreve exatamente estas três famílias: *"rios de luz verdes/teal/violeta fluindo"*.
As medições confirmam o texto.

---

## Cores-âncora por sistema

| Sistema | Token | Hex | Matiz | Origem |
|---|---|---|---|---|
| **Lumora Business** | `--business-verde` | `#16E793` | 156° | `02_lumora_neon_coins` |
| **RotaCerta** | `--rotacerta-ambar` | `#FFA238` | 32° | `03_lumora_star_path` |
| **Lumora Hub** *(interno)* | `--hub-violeta` / `--hub-ciano` | `#8541FA` / `#1D8FC5` | — | §65.1 nomeia "violeta/ciano"; sem asset oficial do Hub para medir |

> **Divergência com o Guia:** §65.1 especifica o RotaCerta como **"teal + âmbar"**. O âmbar
> confere (`#FFA238`), mas o corpo da L no asset é **violeta/azul**, não teal
> (`#381878`–`#581888` medidos). Registrado em [`ESCALACOES.md`](../ESCALACOES.md) §4.
> **Não corrigido** — o asset é canônico e não pode ter cores alteradas.

> **Ausência registrada:** não existe asset oficial para o Lumora Hub. Os valores acima são a
> tradução literal dos nomes de §65.1, não uma medição. Conforme a regra "quando faltar um
> asset oficial, registrar a ausência em vez de inventá-lo", o Hub não recebe hex canônico.

---

## Texto e superfície

**(DEFAULT DO AGENTE — nenhum destes é medido em asset; são valores neutros escolhidos para
atender o contraste exigido pela §35. Justificativa: sem escala de texto definida, nenhuma
tela pode ser especificada. Pendente de aprovação.)**

| Token | Hex | Contraste sobre `#00040F` | Uso |
|---|---|---|---|
| `--texto-1` | `#FFFFFF` | 20,50:1 | Texto primário, títulos, texto sobre vidro |
| `--texto-2` | `#C8D2E8` | 13,51:1 | Texto secundário |
| `--texto-3` | `#8FA0BF` | 7,76:1 | Texto terciário — ainda AAA |
| `--vidro-borda` | `#5A6B8C` | 3,82:1 | Borda de superfície Liquid Glass (limite de UI: 3:1) |
| `--vidro-superficie` | `#0A1526` | — | Base sob `backdrop-filter` |

---

## Regras de uso derivadas do contraste medido

Detalhamento e tabela completa em [`06-acessibilidade.md`](06-acessibilidade.md).

1. **`--lumora-violeta` (4,36:1) e `--aurora-violeta` (4,04:1) reprovam AA como texto.**
   São cores de **símbolo, borda, halo e elemento gráfico** — onde o limite é 3:1, e passam.
   **Nunca** como cor de texto corrido.
2. **Sobre superfície de vidro, texto é branco.** Todos os valores caem ~7% e `--lumora-azul`
   passa a reprovar AA (4,22:1).
3. **Telas críticas (fiscal, financeiro, LGPD, segurança) exigem AAA — 7:1.** Qualificam apenas
   `--texto-1`, `--texto-2`, `--texto-3`, `--business-verde`, `--rotacerta-ambar` e
   `--aurora-verde`.
4. **Em impressão a paleta inverte** — `--business-verde` cai a 1,63:1 e `--rotacerta-ambar` a
   2,00:1. Ver [`08-impressao-e-documentos.md`](08-impressao-e-documentos.md).
5. **Cor nunca carrega informação sozinha** (§35, item 3): sempre cor + ícone + texto.

---

## Alto contraste — as três paletas nomeadas (§70.6 / §71.6)

O Guia **nomeia** as três paletas mas **não define seus valores**:

| Paleta | Descrição no Guia | Valores |
|---|---|---|
| **Fogo de Nebulosa** | "vermelho-laranja profundo" | **Não definidos no Guia** |
| **Aurora Dia** | — | **Não definidos no Guia** |
| **Aurora Noite** | — | **Não definidos no Guia** |

**Não inventados aqui.** Definir três paletas completas de alto contraste é decisão de
identidade de peso, não default sensato — escalado em [`ESCALACOES.md`](../ESCALACOES.md) §7.

O que o Guia fixa e vale desde já: contraste **AA/AAA sem abrir mão da alma visual**, alvos
44×44 px, leitor de tela e §35 intactos; as três paletas se aplicam também a bolhas e faixas
de notificação (§69.5); e o **Modo Alto Contraste tem 3 paletas** (padrão, preto/branco,
daltonismo) segundo §35 item 7 — o que **não** é obviamente a mesma lista de §70.6.
Essa aparente divergência de nomenclatura também está na escalação §7.

---

## Tipografia

**Nenhuma família tipográfica é especificada em nenhuma das 59 páginas do Guia.**

Os assets oficiais mostram o wordmark "LUMORA" em um sans geométrico maiúsculo com forte
entreletra, mas **o arquivo de fonte não foi entregue** e **o nome da família não é registrado**.

Nenhuma fonte é declarada oficial aqui. Recriar o wordmark com uma fonte parecida seria
"reconstruir wordmark manualmente" — proibido. Escalado em
[`ESCALACOES.md`](../ESCALACOES.md) §2, que também registra a divergência do "A".
