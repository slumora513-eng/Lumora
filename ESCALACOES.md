# Escalações ao Fundador

> Regra 24 do prompt operacional: *"Quando houver dúvida crítica de identidade, não improvisar:
> registrar a dúvida e escalar ao Fundador."*

Sete itens registrados. Em 05/09/2026, **seis foram resolvidos**: dois por decisão direta do
Fundador (§1, §5) e quatro sob a autorização *"pode resolver os problemas que deu
tranquilamente"* (§2, §3 parcial, §4, §7). **Um continua aberto** (§6) e **um resta parcial**
(§3, só para o papel).

Tudo que foi resolvido sob autorização está marcado como **DEFAULT DO AGENTE** — nenhum deles
é registrado como decisão do Fundador, conforme a regra 22.

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

## §2 — O "A" do wordmark LUMORA — ✅ RESOLVIDA em 05/09/2026 (por evidência)

**Autorização do Fundador (05/09/2026):** *"pode resolver os problemas que deu
tranquilamente"*.

| Arquivo | Forma do "A" |
|---|---|
| 09 `comunidade`, 10 `aurora`, 11 `elio`, 12 `migralumora` | **Sem travessão** — `Λ` |
| 13 `ecossistema` | Com travessão — `A` convencional |

**Decisão registrada:** o "A" oficial do wordmark é o **sem travessão (`Λ`)** — presente em
**4 dos 5** lockups oficiais. O `13_lumora_ecossistema_wordmark` é o desvio.

> **(DEFAULT DO AGENTE — resolvido por evidência majoritária sob autorização do Fundador,
> não por decisão de marca dele.** Nenhum wordmark foi redesenhado: a regra 14 continua
> valendo e o PNG oficial segue sendo a fonte canônica. O que mudou é qual dos cinco
> arquivos vale como referência de forma quando eles discordam.)

**Continua sem resposta possível:** nenhuma família tipográfica é nomeada em 59 páginas e
nenhum arquivo de fonte foi entregue. `--lum-fonte` usa pilha de sistema justamente para
**não** simular o wordmark. Enquanto não houver fonte ou vetor, o wordmark só existe como
imagem — e a imagem é JPEG 1024×1024 com perda. Registrado na §6.

---

## §3 — Falta de canal alfa — 🟡 RESOLVIDA PARA A TELA, ABERTA PARA O PAPEL

Os 13 arquivos são JPEG (apesar da extensão `.png`), portanto **sem transparência**.

**Resolvido para o Céu Vivo, sem tocar num pixel.** A arte é **luz aditiva sobre preto**, e
para esse caso existe o operador certo: `mix-blend-mode: screen` faz o preto virar neutro.
Implementado como `.lum-marca-ceu` em `runtime/tokens.css`.

Verificado empiricamente, não suposto — comparação lado a lado renderizada em Chromium:

| Fundo | Resultado com `screen` |
|---|---|
| **Deep Space** (quase preto) — o Céu Vivo real | ✅ A caixa some e a marca passa praticamente intacta |
| Cortina de aurora acesa | 🟡 A caixa some, mas o gradiente da L **desbota** |
| **Papel branco** (papel-mãe) | ❌ A marca **desaparece** — `screen` sobre branco dá branco |

**O que continua bloqueado:** o cabeçalho do papel-mãe (§70.5/§71.5, "a L canônica em
destaque"). Em fundo claro nenhum modo de mistura recupera a transparência — só um arquivo
com alfa ou um vetor resolve. `documentos-com-alma.css` mantém a área **reservada e vazia**.

**Pergunta que resta, agora mais estreita:** o Fundador consegue obter do produtor **um único
arquivo** — a L canônica com alfa, ou em vetor? É o que falta para os Documentos com Alma
saírem do papel reservado.

---

## §4 — RotaCerta: teal ou violeta? — ✅ RESOLVIDA em 05/09/2026 (leitura)

**Autorização do Fundador (05/09/2026):** *"pode resolver os problemas que deu tranquilamente"*.

§65.1 especifica: *"malha de **rotas luminosas (teal + âmbar)** ligando waypoints em forma de
constelação"*. A frase descreve a **malha de rotas**, não o símbolo.

**Leitura adotada:** o **teal é da malha de rotas** — a camada procedural de fundo. O
**símbolo** mantém o violeta→azul da L canônica, com o âmbar (`#FFA238`, que confere com o
asset) nos waypoints e no rastro. Assim **não há divergência**: o asset oficial
`03_lumora_star_path` e a §65.1 falam de coisas diferentes.

A leitura deixou de ser teoria e virou código: a cena 3D `abertura.rotacerta` desenha a
malha de rotas **em teal** ligando waypoints **em âmbar**, sobre o plano de chão em
perspectiva — exatamente o "GPS espacial" da §65.1.

> **(DEFAULT DO AGENTE — interpretação de texto sob autorização do Fundador.** Se a intenção
> era que o próprio símbolo fosse teal, é só dizer: nada foi alterado no asset, que continua
> preservado byte a byte.)

---

## ~~§5 — Briefing da abertura do Lumora Business~~ — ✅ RESOLVIDA pelo Fundador em 05/09/2026

**Decisão do Fundador (05/09/2026):** *"usa o céu estrelado puro como briefing oficial"*.

O briefing do slot `abertura.business` passa a ser:

> **Céu estrelado puro** — estrelas, partículas e constelações do Céu Vivo, **sem motivo
> extra** (§65.1).

Substitui o original — *"gota de aquarela se espalhando formando o nome"* — revogado com a
aquarela em §60.1. Era o único dos seis slots de abertura órfão dessa revogação; agora os seis
têm briefing vigente.

Registrado em `runtime/animations.manifest.json` e implementado em `runtime/animacoes.js`.
A cena deixou de ser placeholder: **nenhuma das 11 cenas dos slots é mais provisória.**

**Consequência na encenação:** a cena foi ajustada para ser fiel ao "sem motivo extra". Antes,
as estrelas convergiam de posições dispersas para formar a constelação — um movimento de
montagem, que é justamente o motivo extra que a §65.1 exclui. Agora elas **acendem onde estão**
(§70.1, "cada ação acende uma estrela") e a constelação **se desenha entre elas** (§71.1, a
Constelação do Dia). O céu não monta nada: ele faz o que já faz.

Fixa, sem variação por horário — §44 registra que a animação de inicialização de um sistema é
sempre a mesma.

> **Continua aberto (dentro da §6):** o áudio `business_abertura_som.mp3` está marcado
> `[REVOGADO]` na §45 porque acompanhava a gota de aquarela. Com o briefing novo, **precisa ser
> refeito** — e áudio é produção do profissional contratado (§48), não desta plataforma.

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

## §7 — As três paletas de alto contraste — ✅ RESOLVIDA em 05/09/2026

**Autorização do Fundador (05/09/2026):** *"pode resolver os problemas que deu tranquilamente"*.
A escalação original já oferecia esta saída: *"o Fundador define os valores, ou autoriza este
agente a propor uma matriz medida com contraste verificado"*.

**As seis paletas estão implementadas** em `runtime/acessibilidade-bonita.css`:

| Paleta | Origem | Fundo | Menor contraste de texto |
|---|---|---|---|
| Padrão | §35 item 7 | `#00040F` | 7,76:1 — AAA |
| Preto / branco | §35 item 7 | `#000000` | 21,00:1 — AAA |
| Daltonismo (Okabe-Ito) | §35 item 7 | `#00040F` | 5,30:1 — AA |
| **Fogo de Nebulosa** | §70.6 | `#1A0603` (vermelho-laranja profundo) | 10,14:1 — AAA |
| **Aurora Noite** | §70.6 | `#01100E` | 10,12:1 — AAA |
| **Aurora Dia** | §70.6 | `#F4FBF8` | 6,62:1 — AA |

Todos os valores têm **contraste calculado, não estimado** (WCAG 2.2, luminância relativa
sRGB). "Aurora Dia" é a única paleta clara da identidade e foi construída para responder à
§71.6 — *"contraste total para quem precisa sem virar tela branca sem identidade"*: o papel é
levemente esverdeado e os acentos são aurora escurecida, não cinza genérico.

**As duas listas foram tratadas como uma só feature de seis paletas:** a §35 garante o mínimo
funcional, a §70.6 acrescenta as três com identidade. Isso resolve a divergência de
nomenclatura que a escalação apontava.

> **(DEFAULT DO AGENTE — os valores são deste agente, sob autorização do Fundador.
> Pendentes de conferência dele.)** Falta ainda o teste em simulador de daltonismo
> (Coblis, Stark) que a §35 exige — é etapa de QA, não de token.

---

## Nota de método

Todas as sete escalações seguem a mesma regra: **onde o Guia decide, este repositório obedece;
onde o Guia cala e a decisão é de marca, este repositório pergunta.**

Onde o Guia cala mas a decisão é técnica e reversível, o repositório escolheu um default e o
marcou como **"(DEFAULT DO AGENTE — justificativa)"** — nunca como decisão do Fundador.
Esses defaults estão listados no [`README.md`](README.md).
