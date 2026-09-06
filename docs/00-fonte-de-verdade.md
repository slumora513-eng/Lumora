# 00 — Fonte de verdade, revogações e congelamentos

Fonte única: **Lumora — Guia de Referência Completo, Especificação de Referência v3,
gerado em 02/09/2026**, 72 seções numeradas, 59 páginas.

## Regra de conflito

O Guia vence sempre. Dentro do Guia, **seção posterior que registra revogação explícita vence
a seção anterior**. O Guia foi escrito por acréscimo de adendos (v2 → v5.3 → §60 → §72), então
descrições antigas permanecem no texto com marcação `[REVOGADO]` ao lado — elas são registro
histórico, não instrução vigente.

Exemplo canônico: a aquarela aparece descrita na Especificação v2 (p. 3, §18, §45, §49) e é
revogada em §60.1. **Vale §60.1.**

---

## Revogações em vigor (§60.1)

| Revogado | Substituído por | Registro |
|---|---|---|
| **Aquarela** (texturas orgânicas, pigmentos, bordas suaves, gota de aquarela) | Deep Space (fundo escuro, partículas, Liquid Glass, bolhas de luz) | §60.1, reafirmada em §71 ("zero aquarela — só luz, vidro e espaço") |
| **Wallpapers dos 193 países / por locale** | Céu Vivo global — muda por horário, nunca por cliente/país/região | §60.1, §60.2, §71 |
| **Wallpapers padrão atuais** (Business, RotaCerta, Hub) | Céu Vivo como fundo do sistema | §60.1 |
| **Vídeos/animações de abertura (2D e 3D) gerados por IA** | Produção de profissional contratado | §60.1, mantém §48 |
| **Personalização cultural automática de wallpaper** (§18) | Céu Vivo | §60.2 |
| **Nome "Enterprise In Present"** | Lumora Empresas | §60.7 |
| **Hubs/ERPs de integração de terceiros no núcleo** (§63.5) | Nenhum — só as APIs públicas já aprovadas | §63.5 |
| **Proposta §56 de formatação dos planos** | §27 vigente, reajustada em 02/09/2026 | §60.14 |

### O que NÃO mudou (§60.11) — memória de deltas

- Identidade Deep Space / Liquid Glass / bolhas de luz.
- **Aurora = aurora boreal, nunca bolha.**
- Céu Vivo como regra de estética (§71).
- Regra de ouro da IA: aprovação humana em dados fiscais/financeiros.
- Atlas Estelar (cosmógrafo 3D da Comunidade).
- Locale Packs (idioma/moeda/compliance) permanecem — **apenas os wallpapers por país caíram.**

---

## Decisões congeladas (§64)

> "Estes itens são decisões FECHADAS com execução adiada. Não são pendências, não têm prazo,
> não têm TODO e não devem voltar a ser citados como assunto a resolver."

| Item | Status |
|---|---|
| **§64.1 — Instituições de caridade** | Catálogo configurável no Hub; escolha das organizações adiada pelo Fundador. Não abordar. |
| **§64.2 — Animações 3D e de inicialização** | Produção do profissional contratado, nunca da IA/plataforma. Cronograma, fornecedor e execução congelados. As descrições conceituais do spec permanecem como **briefing oficial** (§48/§49). |

Em qualquer documento ou revisão futura estes itens aparecem apenas como
**"congelado (ver §64)"** — sem status de pendência, sem cobrança, sem data sugerida.
Este repositório segue essa regra.

---

## Decisões do Fundador em 05/09/2026

Decisões diretas, fora do Guia v3, com a mesma autoridade do nível 1 da hierarquia
(decisões explícitas e mais recentes do Fundador). As que **delegam** ao agente produzem
resultados marcados como **DEFAULT DO AGENTE**, nunca como decisão de marca do Fundador
(regra 22):

| Decisão | Efeito | Registro |
|---|---|---|
| *"a L canônica é a dominante, confirma e registra"* | Resolve a escalação §1. A L canônica é a variante dominante, em 9 dos 13 arquivos oficiais. | [`11-l-canonica.md`](11-l-canonica.md) |
| *"eu te dou o meu pode ir"* | É o **"pode ir" da §71**. A Fase 3A sai do bloqueio. | [`../runtime/`](../runtime/) |
| *"o pode ir vale pras animações também, pode fazer tudo"* | Estende o sinal às **animações dos slots §18/§49** e ao restante da Interface Viva. | [`../runtime/animacoes.js`](../runtime/animacoes.js) |
| *"usa o céu estrelado puro como briefing oficial"* | Resolve a escalação §5. Define o briefing de `abertura.business`, órfão desde a revogação da aquarela. | [`09-producao-de-assets.md`](09-producao-de-assets.md) |
| *"pode resolver os problemas que deu tranquilamente"* + *"tenta fazer algo mais 3D"* | Autoriza resolver as escalações abertas e manda as aberturas para **WebGL 3D** — a metade da §65.5 que faltava. | [`../runtime/animacoes-3d.js`](../runtime/animacoes-3d.js) |
| *"nem precisa fazer esses áudios, só coloca o texto da fala"* | Descarta a produção de áudio e põe a **fala em texto** nas aberturas que têm fala. Mantém §48 intacta e §64.2 congelada. | [`09-producao-de-assets.md`](09-producao-de-assets.md) |
| *"a animação do RotaCerta poderia ser melhor (...) ficou meio confuso"* | Reprova a primeira versão da cena e manda refazer. | [`../runtime/animacoes-3d.js`](../runtime/animacoes-3d.js) |
| *"sobre aquelas duas decisões que ficou de fora, você pode decidir. Eu deixo você tomar controle de tudo (...) pode continuar o código todinho"* | Autoriza fechar as **duas últimas escalações**: §3 (falta de alfa no papel) e §7 (o teste em simulador de daltonismo). | [`../ESCALACOES.md`](../ESCALACOES.md) |
| *"tenta resolver a §6 também"* + *"faz a blueprint para o render e o aws"* | Manda auditar a **§6** (assets não entregues) e produzir a **publicação do repositório** em Render e AWS — que **não** é o Blueprint Universal da §50 (ver abaixo). | [`../ESCALACOES.md`](../ESCALACOES.md) · [`../infra/README.md`](../infra/README.md) |

---

## Código: a Fase 3A saiu do bloqueio

§71 encerrava a ordem de implementação com:

> "Código permanece bloqueado até o **'pode ir' final do fundador**."

**Esse sinal foi dado em 05/09/2026.** A ordem já estava decidida pelo próprio Fundador (§71,
delegada à IA em 01/09/2026) e foi seguida:

1. ✨ Formas que Sentem (base tátil) — `runtime/formas-que-sentem.css`
2. 🌌 Céu Vivo (ambiente) — `runtime/ceu-vivo.js`
3. 💬 Sotaque Cósmico (textos) — `runtime/sotaque-cosmico.js`
4. 🚀 Viagem Cósmica (transições) — `runtime/viagem-cosmica.js`
5. 📜 Documentos com Alma (PDF) — `runtime/documentos-com-alma.{css,js}`
6. 🌈 Acessibilidade Bonita — `runtime/acessibilidade-bonita.css`

### A extensão de 05/09/2026 — animações

O Fundador estendeu o sinal: *"o pode ir vale pras animações também, pode fazer tudo"*.
Com isso saíram do bloqueio, além dos seis passos da §71:

- **As 11 animações dos slots §18/§49** — 6 aberturas + 5 carregamentos.
- **Notificações Vivas (§69)**, cuja §69.7 registrava *"PRIORIZAÇÃO EM ABERTO"*.
- **O Atlas Estelar (§16)** — o cosmógrafo 3D da Comunidade, última assinatura de sistema da
  §65.1 que ainda não existia em código.
- **Navegação em Bolhas (§65.3) e em Ondas (§66)**.
- **O restante da Interface Viva (§67/§68)** e a identidade sonora da §72.1 item 3.

### A extensão final de 05/09/2026 — as duas escalações que restavam

*"sobre aquelas duas decisões que ficou de fora (...) você pode decidir."*

- **§3 — falta de alfa.** Resolvida por medição, não por arquivo novo: `marca-com-alfa.js`
  recupera o alfa despremultiplicando a luz aditiva. O cabeçalho do papel-mãe deixou de ser
  área reservada e vazia, e os três elementos que §70.5 pede estão os três em pé.
- **§7 — paletas de alto contraste.** O teste em simulador virou código verificável
  (`ferramentas/verificar_daltonismo.py`). Ao virar código, encontrou um defeito real: a
  urgência "alta" das Notificações Vivas dependia só da cor. Corrigido com forma e texto.

Nenhuma das duas alterou um byte dos arquivos oficiais.

### E a §6, a última

*"tenta resolver a §6 também."*

Auditada linha a linha. Nenhum arquivo foi inventado — o que mudou é que **nenhuma das sete
ausências significa mais alguma coisa**: duas já eram decisão tomada (os áudios, os sons
antigos do Elio), uma perdeu função (o ZIP de referência provisória) e uma foi
despromovida a reserva (os wallpapers Global/Américas/Europa — §65.1 os mantém para superfícies
secundárias; os regionais são pendência aberta em §60.13, **não** revogação), duas foram
superadas por código, e a última nunca foi asset.

As **amostras conceituais** da §65.6 foram superadas por `runtime/camada-de-sistema.js`, que
desenha a camada complementar de cada sistema sobre o Céu Vivo. A §65.1 já dizia que essas
amostras eram *"direção, não asset final"* — e a direção estava escrita em `04`. Faltava a
implementação, que existia só como abertura e agora existe como ambiente.

Os **protótipos v1–v4** foram superados por `runtime/verificacao.html`, com 135 checagens
automatizadas por cima. Eles seguem valendo como registro histórico das decisões §67.10/§68.8.

O que sobra é uma pergunta de produto, não de arquivo: **"fia alto" e "magos" existem como
sistema?** O próprio Guia os cita e ao mesmo tempo os marca como pendentes de definição.

### A distinção que continua valendo: código procedural × arquivo de mídia

§48 proíbe uma coisa nomeada: *"nenhuma nova **geração de imagem, vídeo ou áudio** será feita
pela plataforma"*. **Nenhum arquivo de mídia foi gerado** — e em 05/09/2026 o Fundador fechou
também a única brecha que restava, decidindo que as falas das aberturas entram como **texto**
em vez de áudio produzido. As animações entregues são **cenas
procedurais em Canvas 2D e WebGL** — código, no mesmo meio que a §65.5 decidiu para toda a
estética e
que a §71 exige por leveza (*"tudo em CSS/JS e texto, sem gerar novos assets de mídia"*).

Elas entram no sistema de slots da §49 como versão `1`, com `fonte: "procedural-lumora"`.
Quando o profissional contratado entregar os vídeos finais (§48/§64.2), eles entram como
versão superior no manifest e viram ativos **sem tocar em uma linha de código** — que é
exatamente o que a §49.3 desenhou. A versão procedural continua como o **fallback obrigatório**
que a mesma §49.3 exige.

Isto não substitui o profissional: preenche o slot até ele chegar e vira a rede de segurança
depois. §64.2 (cronograma, fornecedor, execução) permanece **congelada** — não foi tocada.

---

## Stack de render decidida (§65.5)

Decisão do Fundador, em resposta direta à preocupação de que a interface parecesse
"um negócio meio CSS chapado":

| Camada | Tecnologia | Escopo |
|---|---|---|
| Fundo, partículas, aurora, rastros de rota | **Canvas 2D + WebGL (shaders)** | Nada de gradiente CSS chapado como estética principal |
| Física de bolhas (distribuição orbital, inércia líquida, respingo, estouro) | **JS puro, sem bibliotecas** | Leve |
| Superfícies e microinterações | **CSS / Glassmorphism** | Apenas superfícies (§70.4) |

Desempenho-alvo: **60 fps em aparelhos médios**. Níveis de redução da Otimização Automática
(§36) e `prefers-reduced-motion` desligam efeitos em hardware básico.
**Custo: zero** — tudo procedural, sem assets pesados, sem API externa.

---

## §50 — Blueprint Universal: NÃO INICIADA

A §50 define um produto: o formato declarativo `blueprint.lumora/v1` e um compilador
(`lumora-blueprint build`) que provisiona a pilha inteira de um **cliente** — Postgres, Redis,
réplicas, workers, migrations — com saída **Terraform** para AWS e `render.yaml` nativo para
Render (§50.2), mais idempotência, dry-run obrigatório e rollback (§50.3).

**Nada disso existe neste repositório.** O que existe em [`../infra/`](../infra/) publica *este
repositório* (a identidade visual) como site estático — outro assunto, outro tamanho. A §50
provisiona a aplicação Lumora, que ainda não foi construída.

Do roteiro da §50.5, só o **passo 1** é construível antes da aplicação existir: especificação do
formato v1, parser e validador de schema com exemplos de teste. Os passos 2–6 (compiladores
Render e AWS, saída Docker, botão no Hub, DigitalOcean/GCP) dependem de haver uma pilha para
provisionar.

> Registrado em 06/09/2026, na releitura integral do Guia. Antes disso a §50 não aparecia neste
> repositório nem como pendência.

---

## Sistemas: o que é comercial e o que é interno

| Sistema | Natureza | Acesso |
|---|---|---|
| **RotaCerta** | Comercial — logística e entregas | Cliente, via Portal Lumora |
| **Lumora Business** | Comercial — ERP, financeiro, fiscal, PDV | Cliente, via Portal Lumora |
| **Lumora Ecossistema** | Comercial — integração RotaCerta + Business | Cliente, via Portal Lumora |
| **Comunidade Lumora** | Aberta e gratuita | Qualquer pessoa |
| **Lumora Hub** | **Interno — exclusivo da equipe Lumora** | Nunca é apresentado como produto do catálogo (§17, §34) |

§17, incontornável: *"O Lumora Hub não é público. O Hub é usado exclusivamente pela equipe
Lumora. Clientes não acessam o Hub."* O Hub administra aspectos técnicos, feature flags,
integrações, planos, suporte e auditoria — e **não acessa dados de negócio do cliente**
(vendas, faturamento, pedidos, clientes finais), apenas telemetria técnica agregada.
