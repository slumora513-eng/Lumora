# Escalações ao Fundador

> Regra 24 do prompt operacional: *"Quando houver dúvida crítica de identidade, não improvisar:
> registrar a dúvida e escalar ao Fundador."*

Sete itens. **Nenhum foi resolvido por default** — todos exigem decisão de identidade que o
Guia não sustenta. Nada aqui é pendência de execução: são perguntas.

Itens **congelados** (§64 — caridade e animações 3D) **não aparecem nesta lista**, conforme
§64.3: aparecem apenas como "congelado (ver §64)", sem status de pendência.

---

## ~~§1 — Qual "L" é a L canônica?~~ — ✅ RESOLVIDA pelo Fundador em 05/09/2026

**Decisão do Fundador (05/09/2026):** *"a L canônica é a dominante, confirma e registra"*.

A **L canônica** é a variante **dominante** — ombro arredondado, espinha interna curva,
gradiente violeta→azul, presente em **9 dos 13 arquivos oficiais** (05, 06, 07, 08, 09, 10,
11, 12, 13).

Registrada em [`docs/11-l-canonica.md`](docs/11-l-canonica.md), com anatomia, arquivos
portadores, variantes divergentes e regras de uso.

As duas variantes divergentes (**01** geométrica chapada, **04** traço "candy") permanecem na
biblioteca como **arquivos oficiais preservados**, mas **não são a L canônica** e não podem ser
usadas onde o Guia pede "a L canônica em destaque" (§70.5/§71.5).

> **Aberto dentro desta decisão:** o Fundador confirmou *qual* L é canônica, não o *status* das
> duas divergentes. Elas continuam preservadas e sem função atribuída — ver
> [`docs/11-l-canonica.md`](docs/11-l-canonica.md), seção "O que ficou em aberto".

---

## §2 — O "A" do wordmark LUMORA tem travessão ou não?

**Bloqueia:** qualquer uso do wordmark; escolha ou licenciamento de fonte; consistência entre
os cinco lockups oficiais.

| Arquivo | Forma do "A" |
|---|---|
| 09 `comunidade`, 10 `aurora`, 11 `elio`, 12 `migralumora` | **Sem travessão** — `Λ` |
| 13 `ecossistema` | **Com travessão** — `A` convencional (no wordmark **e** no descritor `ECOSSISTEMA`) |

Quatro contra um. Mas o wordmark é o ativo mais sensível da marca e a regra 14 é explícita:
*"Não reconstruir wordmarks manualmente"* e *"Quando houver um PNG oficial, ele é a fonte
canônica"* — aqui há **cinco PNGs oficiais que discordam entre si**.

**Agravante:** nenhuma família tipográfica é nomeada em nenhuma das 59 páginas do Guia, e nenhum
arquivo de fonte foi entregue. Sem isso, o wordmark só pode ser usado como imagem — e a imagem
disponível é JPEG 1024×1024 com perda, sem vetor.

**Pergunta:** (a) qual forma do "A" é oficial? (b) existe arquivo de fonte, ou o wordmark é
lettering fechado? (c) existe versão vetorial em algum lugar?

---

## §3 — Falta de canal alfa nos 13 arquivos

**Bloqueia:** sobrepor qualquer símbolo ou wordmark ao Céu Vivo — que é o fundo de **todos** os
sistemas (§60.2).

Os 13 arquivos são JPEG (apesar da extensão `.png`), portanto **sem transparência**. Onze têm
fundo Deep Space próprio; dois (01, 02) têm fundo **branco puro**.

Consequência prática: como o Céu Vivo muda por horário (aurora de madrugada, partículas
douradas de dia, constelações à noite), um asset com fundo escuro *fixo* colado sobre um céu
*que muda* cria um retângulo visível que não acompanha o ambiente. E 01/02 criam uma caixa
branca sobre fundo escuro.

**Não resolvido por este agente.** Remover fundo exige alterar pixels; converter para PNG com
alfa exige recompor a imagem. Regra 13 proíbe ambos.

**Pergunta:** o Fundador autoriza (a) solicitar ao produtor os originais com alfa/vetor,
(b) autorizar explicitamente a extração de fundo como operação técnica, ou (c) manter os assets
apenas em superfícies de fundo sólido, fora do Céu Vivo?

---

## §4 — RotaCerta: teal ou violeta?

**Bloqueia:** a assinatura visual procedural do RotaCerta (§65.1) e a cor-âncora do sistema.

§65.1 especifica: *"malha de rotas luminosas **(teal + âmbar)** ligando waypoints em forma de
constelação"*.

O asset oficial `03_lumora_star_path` mostra a rota e a estrela em **âmbar** (`#FFA238` — ✅
confere) mas o corpo da L em **violeta/azul** (`#381878`–`#581888` — ✗ não é teal).

Duas leituras possíveis, e o Guia não desempata:
- **(a)** O teal é da *malha de rotas* no fundo procedural; o símbolo mantém o violeta/azul da
  marca. Nesse caso não há conflito.
- **(b)** O símbolo deveria ser teal e o asset diverge do Guia.

**Pergunta:** o teal do §65.1 descreve o fundo procedural, o símbolo, ou ambos?

---

## §5 — Briefing da abertura do Lumora Business ficou vago

**Bloqueia:** o briefing do slot `abertura.business` para o profissional contratado (§48/§49.4).

O briefing original (§18, §49.1) era *"gota de aquarela se espalhando e formando o nome"* —
**revogado em 01/09/2026** (§60.1), junto com o áudio emparelhado
`business_abertura_som.mp3`, marcado `[REVOGADO]` na §45.

O slot `abertura.business` continua registrado, mas **sem briefing visual substituto**. Os
outros cinco slots de abertura mantêm briefing íntegro (bolhinhas, aurora, horizonte com
veículos, versão épica, esfera técnica). Este é o único órfão da revogação.

Agravante coerente: §65.1 define o Business como **"céu estrelado puro, sem motivo extra"** —
o que é uma decisão de *fundo*, não de *abertura de 4 segundos*.

**Não inventado.** §48 proíbe a plataforma de produzir animação; propor um briefing novo seria
criar identidade que o Guia não sustenta.

**Pergunta:** qual é a animação de abertura do Lumora Business, agora que a gota de aquarela
caiu? (E o áudio `business_abertura_som.mp3` deve ser refeito ou reaproveitado?)

---

## §6 — Assets citados no Guia que não foram entregues

**Não inventados.** Registrados como ausentes, conforme a regra "quando faltar um asset oficial,
registrar a ausência em vez de inventá-lo".

| Citado em | O que é | Status |
|---|---|---|
| **§45** | 10 arquivos da Biblioteca de Áudio (aberturas, notificações, sucessos), em URLs externas | **Não entregues.** Nota do próprio Guia: são da era aquarela/vidro líquido — registro histórico. `business_abertura_som.mp3` marcado `[REVOGADO]` |
| **§44** | 3 sons antigos do Elio (Supernova, Galaxy Bloom, Watercolor Whisp) | **Rejeitados pelo Fundador** em 23/08/2026; novos a definir |
| **§65.6** | Amostras conceituais: fundo RotaCerta "GPS espacial", fundo Hub "Núcleo de Controle", tema Aurora "rios de aurora" | **Não entregues** (URLs externas) |
| **§65.6, §66.5, §67.10, §68.8** | 4 protótipos HTML (v1 bolhas, v2 + ondas, v3 Interface Viva, v4 Interface Viva II) | **Não entregues** ("URL na conversa") |
| **§49.4** | ZIP `03-Videos-Animacoes/` com assets de referência provisórios | **Não entregue** |
| **§65.1** | Wallpapers padrão Global/Américas/Europa, reservados para superfícies secundárias | **Não entregues** |
| **§49.3, §45** | Slots **"fia alto"** e **"magos"** | **Não são slots registrados** — o próprio Guia os marca como pendentes de definição na §18 |

**Pergunta:** o Fundador deseja anexar algum destes à biblioteca oficial? Os protótipos v1–v4
são especialmente relevantes: são a única demonstração executável da Interface Viva, e §67/§68
os citam como artefato oficial de cada decisão.

---

## §7 — As três paletas de alto contraste não têm valores

**Bloqueia:** o Modo Alto Contraste (§35, item 7 — linha de base obrigatória em **todos** os
planos) e o item 6 da ordem de implementação da Fase 3A (§71).

§70.6/§71.6 **nomeiam** três paletas — **"Fogo de Nebulosa"** (descrita apenas como
"vermelho-laranja profundo"), **"Aurora Dia"** e **"Aurora Noite"** — e exigem contraste AA/AAA
"sem abrir mão da alma visual". **Nenhum valor é definido.**

**Divergência adicional a resolver junto:** §35 item 7 fala em "Modo Alto Contraste com
**3 paletas (padrão, preto/branco, daltonismo)**". §70.6 fala em três paletas com **nomes
completamente diferentes**. Não está claro se são a mesma feature descrita de dois jeitos, ou
duas features distintas (uma de acessibilidade funcional, outra de identidade).

**Não inventadas.** Definir três paletas completas de alto contraste é decisão de identidade de
peso — não é "default sensato" no sentido da regra 22.

**Pergunta:** (a) "Fogo de Nebulosa", "Aurora Dia" e "Aurora Noite" substituem ou convivem com
"padrão / preto e branco / daltonismo"? (b) O Fundador define os valores, ou autoriza este
agente a propor uma matriz medida com contraste verificado, para aprovação?

---

## Nota de método

Todas as sete escalações seguem a mesma regra: **onde o Guia decide, este repositório obedece;
onde o Guia cala e a decisão é de marca, este repositório pergunta.**

Onde o Guia cala mas a decisão é técnica e reversível, o repositório escolheu um default e o
marcou como **"(DEFAULT DO AGENTE — justificativa)"** — nunca como decisão do Fundador.
Esses defaults estão listados no [`README.md`](README.md).
