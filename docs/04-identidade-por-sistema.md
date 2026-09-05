# 04 — Identidade por sistema

§65.1. Brief do Fundador: *"cada sistema tem que ter um detalhinho exclusivo"*.

**Base compartilhada por todos:** o Céu Vivo (§70/§71) — muda por horário do dia, nunca por
cliente. Cada produto recebe **uma camada complementar** por cima. A camada é
**procedural (canvas/WebGL), nunca imagem estática** (§65.1/§65.5).

---

## RotaCerta — "GPS espacial"

Logística e entregas. A parte logística chama-se **Controle de Operação** (§6).

**Assinatura visual (§65.1):** malha de **rotas luminosas (teal + âmbar)** ligando **waypoints
em forma de constelação**, com leve **rastro de navegação** — o fundo "guia" o olhar como um
mapa de rotas no espaço.

| Elemento | Leitura |
|---|---|
| Rotas luminosas | Caminho, trajeto, entrega em curso |
| Waypoints em constelação | Paradas como estrelas de uma constelação |
| Rastro de navegação | Percurso já feito |

Coerente com o resto do sistema: os rastros usam a mesma camada Canvas/WebGL do Céu Vivo
(§65.5), não sprites nem imagens.

**Abertura (§18, briefing congelado §64.2):** horizonte com veículos em silhueta azul e zoom
out. Slot `abertura.rotacerta`.

> **Divergência registrada:** o asset oficial `03_lumora_star_path` usa **violeta/azul + âmbar**,
> não **teal + âmbar** como o Guia especifica em §65.1. O arquivo é canônico e foi preservado
> sem alteração; a divergência está registrada em [`ESCALACOES.md`](../ESCALACOES.md) §4.

---

## Lumora Business — céu estrelado puro

ERP, financeiro, fiscal e PDV.

**Assinatura visual (§65.1):** **céu estrelado puro (Céu Vivo padrão)** — estrelas, partículas,
constelações por horário, **sem motivo extra**.

Esta é a decisão registrada: o Business **não recebe** uma temática adicional obrigatória
equivalente ao GPS espacial do RotaCerta. Sua personalidade vem da clareza, não de um motivo
gráfico próprio.

O que a identidade do Business deve enfatizar:

- organização · gestão · financeiro · fiscal · clareza · inteligência · estabilidade

Consequência prática: em telas fiscais e de PDV, a estética recua e a função domina. O tom
respeitoso e sem humor em contexto fiscal é regra de voz (§70.3), não preferência.

**Abertura:** o briefing original (§18) era *"gota de aquarela se espalhando formando o nome"* —
**REVOGADO em 01/09/2026** (§60.1). O slot `abertura.business` existe e está registrado, mas
**seu briefing visual está vago desde a revogação da aquarela** — ver
[`ESCALACOES.md`](../ESCALACOES.md) §5.

---

## Lumora Ecossistema

Integração do RotaCerta + Lumora Business.

**Linguagem visual mais abrangente**, reunindo os elementos dos sistemas **sem destruir suas
identidades individuais**. O Ecossistema **não é uma simples soma de logos**.

**Abertura (§18):** "versão épica unindo os sistemas", com assistente se o plano tiver IA.
Slot `abertura.ecossistema`, áudio `ecossistema_abertura_som.mp3` (~6 s).

O asset oficial `08_lumora_ecosystem_orbit` expressa isso corretamente: a L canônica dentro de
uma bolha Liquid Glass grande, com os símbolos dos sistemas **orbitando dentro da mesma bolha**
— integração, não justaposição.

---

## Comunidade Lumora

Aberta e gratuita, qualquer pessoa participa (§16). Parte oficial do ecossistema, com
identidade própria dentro da linguagem cósmica geral.

**Atlas Estelar** — nome oficial do cosmógrafo 3D, aprovado pelo Fundador em 01/09/2026 (§16):

> Navegação cosmográfica 3D em camadas — **galáxias (categorias) → constelações (temas) →
> estrelas (nichos) → nicho individual** — com narração da Aurora.
> *"Cosmógrafo 3D" permanece como descrição técnica.*

Personalidades (§16): **Aurora é a guardiã** (firme quando necessário, calma quando ajuda,
revisa temas e nichos); **Elio é o administrativo** (calmo, sério, mais frio; cria categorias,
executa banimentos de forma objetiva). Nenhum dos dois xinga. A personalidade forte pode ser
desativada nas configurações.

**A Comunidade entra no menu de TODOS os sistemas** — Business, RotaCerta, Ecossistema e Hub
(§66.4). No Hub, o item abre a **tela de Gestão da Comunidade** com botão explícito
*"Ir para a comunidade →"*; nos demais, abre a experiência pública diretamente.

Arte nos temas (§16): até **10 imagens por tema**, prioridade para arte do próprio usuário,
geração por IA **só se a pessoa escolher**. Artes e modelos respeitam licenças.

---

## Lumora Hub — "Núcleo de Controle" (INTERNO)

**§17, incontornável:** *"O Lumora Hub não é público. O Hub é usado exclusivamente pela equipe
Lumora. Clientes não acessam o Hub."*

O Hub **pode usar a identidade Lumora, mas nunca é apresentado como produto comercial do
catálogo.** Clientes acessam seus próprios sistemas pelo **Portal Lumora**.

**Assinatura visual (§65.1):** um **núcleo de luz na base**, com **anéis orbitais
violeta/ciano** e **satélites-bolha** — transmite centralidade e governança.

**Abertura:** bolha central com conexões no estilo de neurônios (§18) / esfera técnica
liquid-glass, uso interno (slot `abertura.hub`, §49.1).

**Limites que a identidade não pode contradizer (§17):** o Hub **não acessa dados de negócio
do cliente** — nem vendas, faturamento, receita, clientes finais ou pedidos. Usa apenas
telemetria técnica agregada (estado de serviço, uso de recursos, erros, latência), com trilha
de auditoria de cada ação administrativa. Nenhuma peça visual do Hub deve sugerir visibilidade
sobre dados comerciais do cliente.

---

## Resumo da camada complementar

| Sistema | Camada sobre o Céu Vivo | Cor-âncora (medida, ver `10-paleta.md`) |
|---|---|---|
| **Lumora Business** | Nenhuma — céu estrelado puro | Verde `#16E793` (símbolo oficial) |
| **RotaCerta** | Rotas luminosas + waypoints-constelação + rastro | Âmbar `#FFA238` (símbolo oficial) |
| **Lumora Ecossistema** | Reunião dos elementos, sem somar logos | Violeta→azul da L canônica |
| **Comunidade** | Atlas Estelar (galáxias → constelações → estrelas) | Violeta→azul da L canônica |
| **Lumora Hub** *(interno)* | Núcleo de luz + anéis orbitais + satélites-bolha | Violeta/ciano |

---

## Conceitos de referência (§65.6, §66.5) — status

O Guia registra URLs de amostras conceituais aprovadas em 01/09/2026 (fundos RotaCerta e Hub,
tema Aurora) e de quatro protótipos HTML (`v1` navegação em bolhas, `v2` + ondas,
`v3` Interface Viva, `v4` Interface Viva II).

**Estes arquivos não foram entregues a este repositório.** Registrados como ausentes conforme a
regra "quando faltar um asset oficial, registrar a ausência em vez de inventá-lo" —
ver [`ESCALACOES.md`](../ESCALACOES.md) §6. Nenhum foi recriado.

Lembrete de §65.1: as amostras conceituais servem de **direção**, não de asset final —
"a renderização final será procedural (canvas/WebGL), **nunca imagem estática**".
