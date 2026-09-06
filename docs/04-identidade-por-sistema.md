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
**REVOGADO em 01/09/2026** (§60.1). Em **05/09/2026 o Fundador definiu o briefing oficial**:
**céu estrelado puro**, estrelas, partículas e constelações do Céu Vivo, **sem motivo extra**
(§65.1) — a mesma decisão que rege o fundo do Business, agora também na abertura. Implementado
em [`../runtime/animacoes.js`](../runtime/animacoes.js).

Consequência de encenação: nada converge nem se monta na cena. Um movimento de montagem seria
o "motivo extra" que a §65.1 exclui — as estrelas acendem onde estão e a constelação se desenha
entre elas.

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

**Implementado** em [`../runtime/atlas-estelar.js`](../runtime/atlas-estelar.js) e
[`../runtime/atlas-estelar.css`](../runtime/atlas-estelar.css), sob o "pode fazer tudo" de
05/09/2026. As quatro camadas e a narração da Aurora são do Guia; a encenação (cores por
camada, ligação das constelações, enquadramento) está registrada como **DEFAULT DO AGENTE**
em [`../runtime/README.md`](../runtime/README.md).

Duas decisões que valem registro aqui, porque são de identidade e não de código:

- **Cada estrela é um `<button>` de verdade.** O WebGL desenha a luz; a navegação mora no
  DOM. Navegação que só existe como pixel não tem foco, teclado nem leitor de tela — a §35
  não a aceitaria. É a mesma escolha da legenda das aberturas.
- **A posição de cada galáxia é determinística.** A mesma categoria cai sempre no mesmo lugar
  do céu. Sem isso, o 3D não acrescenta nada a uma lista: o que ele oferece é memória
  espacial, e memória espacial exige que o céu não mude de lugar.

Avaliação por estrelas, comentários, gamificação e pagamentos (§16) são regra de negócio da
Comunidade — o runtime entrega a **navegação** e a **narração**, não o produto inteiro.

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

**Estes arquivos não foram entregues a este repositório.** Nenhum foi recriado — a regra
continua sendo registrar a ausência em vez de inventar.

O que mudou em 05/09/2026 é que a ausência **deixou de significar alguma coisa**, e por um
motivo que está na própria §65.1: as amostras conceituais servem de **direção**, não de asset
final — *"a renderização final será procedural (canvas/WebGL, **nunca imagem estática**)"*.

E a direção já estava escrita — é a tabela "Resumo da camada complementar" logo acima. Faltava
a **implementação**, e faltava mesmo: esses motivos existiam só como *abertura* (animação de
entrada, slot §49), nunca como ambiente permanente de uso.

**Agora existem.** [`runtime/camada-de-sistema.js`](../runtime/camada-de-sistema.js) desenha a
camada complementar de cada sistema sobre o Céu Vivo, em Canvas 2D:

| Sistema | O que a camada desenha |
|---|---|
| **RotaCerta** | Rotas teal ligando waypoints âmbar em constelação, com o rastro de navegação percorrendo a rota |
| **Lumora Hub** | Núcleo de luz violeta, anéis orbitais e satélites-bolha correndo sobre eles |
| **Ecossistema** | **Nada** — a §65.1 não define assinatura para ele (ver nota abaixo) |
| **Business** | **Nada** — "céu estrelado puro (Céu Vivo padrão) (...) sem motivo extra" (§65.1) |
| **Comunidade** | **Nada** — o Atlas Estelar (§16) já *é* a camada |

Os três vazios são decisão registrada, não implementação faltando: o código expõe o motivo de
cada um em `SEM_CAMADA`, e a bancada de verificação mostra esse motivo na tela.

> **Correção de 06/09/2026.** Até esta data o Ecossistema desenhava os motivos do RotaCerta **e
> do Hub** juntos, em intensidade reduzida. Isso era invenção: a §65.1 lista assinatura para
> **três** produtos — Business, RotaCerta e Hub — e nenhuma para o Ecossistema. Pior, o motivo do
> Hub não pode compor produto comercial: a §17/§34 o define como interno da equipe Lumora, e o
> Ecossistema é RotaCerta + Business (§27), não RotaCerta + Hub. A camada do Ecossistema passou a
> ser vazia, com o motivo registrado. "Versão épica unindo os sistemas" (§18/§49.1) descreve a
> **abertura** do Ecossistema, que é outro artefato — e essa continua implementada.

A camada tira as cores dos tokens CSS, então **as seis paletas de alto contraste valem nela
também**; desliga na paleta preto/branco (que existe para clareza máxima) e reforça na paleta
clara em vez de sumir. Ver [`../ESCALACOES.md`](../ESCALACOES.md) §6.

Os quatro protótipos HTML continuam não entregues, e continuam sendo registro histórico das
decisões de §67.10/§68.8. O que eles eram na prática — *"a única demonstração executável da
Interface Viva"* — hoje é `runtime/verificacao.html`, com 343 checagens automatizadas por cima.
