# 08 — Impressão e documentos

§70.5 e §71.5 — **Documentos com Alma**.

> **Regra-mãe (§70.5):** "Impressão e PDF mantêm contraste e legibilidade —
> **funcional primeiro, estética depois**."

---

## O que o Guia autoriza

Comprovantes, relatórios e recibos em **"papel-mãe"**:

1. **Fundo cosmos sutil**
2. **A L canônica em destaque**
3. **No rodapé, uma constelação gerada pelos dados do próprio documento**

§71.5 acrescenta: **impressão fiel; geração local e leve, sem serviço externo.**

A constelação do rodapé não é decoração genérica — ela é **derivada dos dados daquele
documento**, o mesmo princípio da Constelação do Dia (§70.1). Cada documento tem a sua.

---

## Limites técnicos que a estética não pode ultrapassar

| Limite | Razão |
|---|---|
| **Liquid Glass dependente de `backdrop-filter` não é requisito de impressão** | `backdrop-filter` não existe em PDF nem em impressora. Um documento cuja legibilidade dependa dele quebra ao imprimir. |
| **Contraste AA mínimo; AAA em documento fiscal** | §35: telas críticas exigem 7:1. Documento fiscal é contexto crítico. |
| **Fundo cosmos sutil = sutil** | Um fundo escuro cheio em documento consome toner, borra em impressora térmica e reduz contraste do texto. |
| **A função fiscal nunca é prejudicada** | §22: DANFE impresso ou em PDF; a estética não pode interferir na leitura de campos obrigatórios, código de barras ou chave de acesso. |
| **Geração local, sem serviço externo** | §71.5 |

---

## A paleta escura não sobrevive ao papel

Medição em fundo branco (`#FFFFFF`), calculada por este agente:

| Cor | Hex | Contraste sobre branco | Serve para texto? |
|---|---|---|---|
| Aurora violeta | `#8541FA` | **5,08:1** | ✅ AA |
| L violeta | `#B01DFF` | **4,70:1** | ✅ AA (no limite) |
| Borda de vidro | `#5A6B8C` | **5,36:1** | ✅ AA |
| L azul | `#0072FF` | 4,33:1 | ⚠️ apenas UI/gráfico (3:1) |
| Aurora teal | `#1D8FC5` | 3,63:1 | ⚠️ apenas UI/gráfico |
| **RotaCerta âmbar** | `#FFA238` | **2,00:1** | ❌ ilegível |
| **Business verde** | `#16E793` | **1,63:1** | ❌ ilegível |
| Texto secundário (tela) | `#C8D2E8` | 1,52:1 | ❌ ilegível |

**Consequência:** as cores-âncora de RotaCerta e Business **não podem ser cor de texto em
documento impresso**. Em papel, o texto é preto ou cinza-escuro; a cor de sistema aparece
apenas como filete, ícone preenchido ou área de destaque com contraste próprio.

Isto não é uma escolha estética — é o que a regra "funcional primeiro" exige quando a
identidade nasceu para fundo escuro.

---

## Diretrizes de composição

**(DEFAULT DO AGENTE — o Guia define os três elementos do papel-mãe mas não a sua composição;
sem regras de composição a estética entra em conflito com a legibilidade fiscal. Estes valores
são proposta, pendente de aprovação.)**

| Elemento | Proposta |
|---|---|
| Fundo cosmos | Densidade **muito baixa**, sem gradiente cheio; nunca atrás de bloco de texto fiscal |
| L canônica | Cabeçalho, no gradiente oficial, com área de respiro própria. **Impressa desde 05/09/2026**: `marca-com-alfa.js` recupera o alfa do oficial 11 e a L compõe sobre papel branco (ESCALACOES.md §3). No modo econômico ela permanece, mas com `print-color-adjust: economy` — a impressora decide a tinta |
| Constelação do rodapé | Área reservada no rodapé, **fora** dos campos obrigatórios; linhas finas, uma cor |
| Texto do corpo | Preto ou cinza-escuro sobre branco — **nunca** cor de marca |
| Modo econômico | Documento fiscal deve imprimir corretamente **em preto e branco puro**, sem perda de informação |

**Regra derivada do §35 item 3, que vale igual no papel:** informação nunca depende só da cor.
Se um status aparece colorido no PDF, aparece também com ícone e texto — porque quem imprime
em preto e branco perde a cor inteira.

---

## Impressão física suportada (§15, §23)

O sistema suporta impressoras térmicas de cupom e etiqueta, jato de tinta, laser e qualquer
impressora reconhecida — além de impressoras 3D.

Consequências para o design de documentos:

- **Térmica de cupom** é monocromática, de baixa resolução e rolo estreito. O papel-mãe não se
  aplica ao cupom: cupom é texto puro, alinhado, sem fundo.
- **Etiqueta** tem área útil mínima. Nenhum elemento decorativo compete com o código de barras.
- **NFC-e / CF-e-SAT** seguem o modelo do estado (§22/§23) — o leiaute oficial manda, sempre.
- **DANFE** segue o leiaute obrigatório. A estética entra apenas onde o leiaute permite.

**Regra de emissão que a arte não pode contrariar (§22):** NFC-e não é emitida para
destinatário pessoa jurídica — operação com CNPJ exige NF-e. Nenhum template pode sugerir o
contrário.

---

## Wallpapers como superfície secundária

§65.1: os wallpapers padrão antes gerados (Global/Américas/Europa) **não são o fundo dos
sistemas**; ficam como **reserva para superfícies secundárias — por exemplo login e
documentos** — com uso futuro a confirmar.

Isto é uma reserva registrada, **não uma autorização de uso**. Nenhum wallpaper foi aplicado a
documento neste repositório, e nenhum foi entregue como asset oficial
(ver [`ESCALACOES.md`](../ESCALACOES.md) §6).
