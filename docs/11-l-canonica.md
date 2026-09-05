# 11 — A L canônica

> **Decisão do Fundador — 05/09/2026:** *"a L canônica é a dominante, confirma e registra"*.
>
> Resolve a escalação §1. O Guia cita "a L canônica" em §70.5 e §71.5 sem nunca defini-la;
> esta seção passa a ser o registro dessa definição.

---

## A anatomia canônica

A **L canônica** é a variante **dominante** da biblioteca oficial:

| Traço | Descrição |
|---|---|
| **Ombro** | Arredondado no topo da haste — não é canto vivo |
| **Espinha interna** | Curva contínua ligando a haste ao braço, sem ângulo reto interno |
| **Braço** | Termina em curva arredondada, mais baixa que o topo do ombro |
| **Gradiente** | Violeta → azul, no sentido superior-esquerdo para inferior-direito |
| **Bolha-ponto** | Elemento **opcional** à direita do ombro; presente em 05, 10, 11, 12, 13 |

Valores do gradiente medidos: **`#B01DFF` → `#0072FF`** — ver
[`10-paleta.md`](10-paleta.md). Ainda marcados como default do agente, pendentes de aprovação.

---

## Arquivos que portam a L canônica (9 de 13)

| # | Arquivo | Papel observado |
|---|---|---|
| 05 | `05_lumora_aurora_glyph.png` | L canônica + bolha-ponto sobre cortinas de aurora |
| 06 | `06_lumora_atom_glyph.png` | L canônica com anéis orbitais e esferas |
| 07 | `07_lumora_migration_glyph.png` | L canônica + ícone de documento e seta (MigraLumora) |
| 08 | `08_lumora_ecosystem_orbit.png` | L canônica dentro de bolha Liquid Glass grande |
| 09 | `09_lumora_comunidade_wordmark.png` | Lockup Comunidade |
| 10 | `10_lumora_aurora_wordmark.png` | Lockup Aurora |
| 11 | `11_lumora_elio_wordmark.png` | Lockup Elio |
| 12 | `12_lumora_migralumora_wordmark.png` | Lockup MigraLumora |
| 13 | `13_lumora_ecossistema_wordmark.png` | Lockup Ecossistema |

**Referência mais limpa da forma isolada:** `11_lumora_elio_wordmark.png` — a L canônica
aparece sozinha, sem motivo gráfico sobreposto, sobre fundo Deep Space quase puro.

---

## As duas variantes divergentes

Permanecem na biblioteca como **arquivos oficiais preservados** — não foram removidos, não
foram alterados. **Não são a L canônica.**

| Arquivo | Anatomia | Onde diverge |
|---|---|---|
| `01_lumora_glass_orb.png` | L geométrica chapada | Cantos vivos, sem ombro arredondado, sem espinha curva, sem bolha |
| `04_lumora_bubble_glyph.png` | L de traço uniforme arredondado ("candy") | Espessura uniforme, sem afinamento na espinha, mais espessa |

---

## Regras de uso

1. **Onde o Guia pede "a L canônica em destaque"** — Documentos com Alma (§70.5/§71.5) —
   usa-se a variante dominante. As divergentes **não servem** nesse lugar.
2. **A L canônica não é redesenhada.** Regra 14: quando existe PNG oficial, ele é a fonte
   canônica. Nenhuma versão vetorial, "limpa" ou "mais bonita" foi produzida por este agente.
3. **A bolha-ponto é opcional e contextual.** Aparece nos lockups e no glyph da Aurora; ausente
   em 06, 07, 08, 09. Não há decisão registrada sobre quando ela entra — não inventada aqui.
4. **A L canônica não vira wordmark.** Regra 14 proíbe transformar símbolo em wordmark. O
   wordmark `LUMORA` é ativo separado — e ainda tem a divergência do "A" aberta
   ([`../ESCALACOES.md`](../ESCALACOES.md) §2).
5. **A cor da L acompanha o sistema onde há cor-âncora própria** — verde no Business, âmbar na
   rota do RotaCerta — mas a **anatomia nunca muda**.

---

## O que ficou em aberto

O Fundador confirmou **qual** L é canônica. Três pontos adjacentes continuam sem decisão e
**não foram resolvidos por default**:

- **Status das duas divergentes.** São variantes autorizadas para algum contexto, versões
  antigas a aposentar, ou ficam apenas arquivadas? Hoje: preservadas, sem função atribuída.
- **Quando a bolha-ponto entra.** Presente em 5 dos 9 portadores, sem regra registrada.
- **Uso prático da L canônica sobre o Céu Vivo.** Os 9 arquivos portadores são JPEG sem canal
  alfa ([`../ESCALACOES.md`](../ESCALACOES.md) §3, ainda aberta). Enquanto não houver versão
  com alfa ou vetor, a L canônica só compõe sobre fundo sólido — o que afeta diretamente
  Documentos com Alma e o cabeçalho de documento fiscal.

> **Consequência registrada no runtime:** `runtime/documentos-com-alma.css` **reserva** a área
> da L canônica no cabeçalho do papel-mãe, mas **não a desenha** — a área fica vazia até que um
> arquivo com alfa ou vetor exista. Nenhum substituto foi criado.
