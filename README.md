# Lumora — Sistema de Identidade Visual

Repositório canônico da identidade Lumora, derivado do **Guia de Referência Completo —
Especificação de Referência v3, gerado em 02/09/2026** (72 seções, 59 páginas).

> **"Que minha luz domine o seu negócio." — Aurora**
> Frase registrada no Guia (capa e §1). É a voz da Aurora, não uma tagline substituível.

**Identidade oficial:** Deep Space + Liquid Glass + bolhas de luz + Céu Vivo.
**Aquarela: REVOGADA** (§60.1). Nenhum asset novo usa essa linguagem.

---

## Índice

| Documento | Conteúdo |
|---|---|
| [`docs/00-fonte-de-verdade.md`](docs/00-fonte-de-verdade.md) | Hierarquia de autoridade, revogações em vigor, decisões congeladas |
| [`docs/01-elio-aurora-bolido.md`](docs/01-elio-aurora-bolido.md) | Bolha (Elio), onda de aurora (Aurora), Bólido (excepcional) |
| [`docs/02-ceu-vivo.md`](docs/02-ceu-vivo.md) | Céu Vivo, Viagem Cósmica, Constelação do Dia |
| [`docs/03-interface-viva.md`](docs/03-interface-viva.md) | Catálogo dos 14 gestos do vocabulário visual |
| [`docs/04-identidade-por-sistema.md`](docs/04-identidade-por-sistema.md) | RotaCerta, Business, Ecossistema, Comunidade, Hub |
| [`docs/05-voz-e-microtextos.md`](docs/05-voz-e-microtextos.md) | Sotaque Cósmico-Brasileiro, tagline, tom |
| [`docs/06-acessibilidade.md`](docs/06-acessibilidade.md) | Linha de base obrigatória e contraste medido |
| [`docs/07-etica-visual.md`](docs/07-etica-visual.md) | Proibições absolutas e auditoria dos assets |
| [`docs/08-impressao-e-documentos.md`](docs/08-impressao-e-documentos.md) | Documentos com Alma, regras de impressão |
| [`docs/09-producao-de-assets.md`](docs/09-producao-de-assets.md) | O que a plataforma **não** produz; slots §49 |
| [`docs/10-paleta.md`](docs/10-paleta.md) | Paleta **medida** nos assets oficiais + contraste WCAG |
| [`docs/11-l-canonica.md`](docs/11-l-canonica.md) | **A L canônica** — confirmada pelo Fundador em 05/09/2026 |
| [`runtime/`](runtime/) | **Estética procedural em código** — Céu Vivo, camada de cada sistema, animações dos slots, Atlas Estelar, Notificações Vivas, navegação, Interface Viva, marca com alfa |
| [`runtime/README.md`](runtime/README.md) | Uso, verificação e limites do runtime |
| [`assets/oficiais/`](assets/oficiais/) | 13 arquivos oficiais preservados byte-a-byte |
| [`assets/oficiais/MANIFESTO.md`](assets/oficiais/MANIFESTO.md) | Inventário verificado (sha256, formato real, fundo) |
| [`ferramentas/verificar_assets.py`](ferramentas/verificar_assets.py) | Verificação somente-leitura: integridade, formato, fundo, paleta, contraste |
| [`ferramentas/verificar_daltonismo.py`](ferramentas/verificar_daltonismo.py) | As seis paletas sob protanopia, deuteranopia e tritanopia — simulação em código, com autoteste |
| [`ferramentas/testes/`](ferramentas/testes/) | As **135 checagens** do runtime em Chromium — `node ferramentas/testes/rodar.mjs` |
| [`infra/README.md`](infra/README.md) | **Publicação** — blueprints para Render e AWS, com o CSP que impõe o custo zero |
| [`ESCALACOES.md`](ESCALACOES.md) | **Dúvidas críticas de identidade abertas ao Fundador** |

---

## Hierarquia de autoridade

Em caso de conflito, nesta ordem:

1. Decisões explícitas e mais recentes do Fundador registradas no Guia;
2. Correções e revogações registradas em seções posteriores do Guia;
3. Decisões congeladas (§64);
4. O prompt operacional do Brand Agent;
5. Defaults decididos autonomamente pelo agente — **sempre marcados** neste README.

Nenhuma decisão de identidade que o Guia não sustente foi inventada. Onde faltou decisão,
está registrado abaixo como default explícito ou escalado em [`ESCALACOES.md`](ESCALACOES.md).

---

## Estado da verificação dos assets oficiais (02/09/2026 → verificado em 05/09/2026)

Os 13 arquivos entregues pelo operador foram **preservados sem alteração de um único byte**
(sha256 conferido antes e depois da cópia). A verificação técnica exigida encontrou três
divergências que **não foram corrigidas**, porque corrigir exigiria alterar pixels, cores ou
container — proibido sem autorização:

| # | Achado | Impacto |
|---|---|---|
| 1 | **Todos os 13 são JPEG, não PNG.** A extensão `.png` não corresponde ao conteúdo (magic `FF D8`, JFIF, baseline, 3 canais, ICC RGB). | ✅ **Contornado em 05/09/2026 sem alterar os arquivos:** `runtime/marca-com-alfa.js` **recupera** o alfa despremultiplicando a luz aditiva. A marca compõe sobre Céu Vivo, aurora acesa e papel branco. Erro de ida-e-volta ≤ 12/255 — só o ruído JPEG. |
| 2 | **`01_lumora_glass_orb` e `02_lumora_neon_coins` têm fundo branco puro** (`#FFFFFF` nos 4 cantos). Os outros 11 têm fundo Deep Space (`#000000`–`#00080F`). | ✅ **Contornado pela mesma via:** a chave inversa zera o campo branco (ruído medido: **zero**), e a caixa branca some sobre a interface escura. |
| 3 | **Três anatomias diferentes de "L"** convivem na biblioteca. | ✅ **Resolvido pelo Fundador em 05/09/2026:** a L canônica é a dominante (9 de 13 arquivos) — ver [`docs/11-l-canonica.md`](docs/11-l-canonica.md). |

Detalhe completo por arquivo: [`assets/oficiais/MANIFESTO.md`](assets/oficiais/MANIFESTO.md).
Reverificação a qualquer momento: `python3 ferramentas/verificar_assets.py`.

---

## Defaults do agente

Registrados conforme a regra 22 do prompt operacional. Nenhum destes é decisão do Fundador.

- **(DEFAULT DO AGENTE — o Guia nomeia cores mas não fixa nenhum valor hexadecimal; medir os
  assets oficiais é a única forma de obter valores sem inventar identidade.)**
  A paleta de [`docs/10-paleta.md`](docs/10-paleta.md) foi **extraída por amostragem dos PNGs
  oficiais**, não escolhida. Ex.: o gradiente da L medido em 4 assets independentes converge
  para `#B01DFF → #0072FF`. Os valores continuam pendentes de aprovação.

- **(DEFAULT DO AGENTE — o Guia exige contraste AA/AAA (§35) mas não publica as razões
  calculadas; sem elas a exigência não é verificável.)** Todas as razões de contraste em
  [`docs/06-acessibilidade.md`](docs/06-acessibilidade.md) foram calculadas por este agente
  (WCAG 2.2, sRGB relativa) sobre a paleta medida.

- **(DEFAULT DO AGENTE — o Guia não define estrutura de repositório de marca; a separação
  espelha a regra 21 do prompt, "assets oficiais × estética procedural".)**
  `assets/` guarda apenas arquivos canônicos do operador; `docs/` guarda a especificação;
  `runtime/` guarda a estética procedural **como código**, nunca como imagem. Nenhuma imagem
  foi criada para representar céu, partículas, bolhas, aurora, ondas ou rastros — §65.1 exige
  que essa camada seja "procedural (canvas/WebGL), **nunca imagem estática**".

- **(DEFAULT DO AGENTE — o Guia não diz como suprir a falta de alfa; a regra 13 proíbe
  alterar os arquivos, e a regra 14 proíbe desenhar a marca. Sobrou medir.)**
  `runtime/marca-com-alfa.js` **recupera** o alfa despremultiplicando a luz aditiva que o
  JPEG achatou sobre preto — a mesma categoria de operação com que a paleta foi extraída.
  O piso de ruído (12/255) e a regra de recorte (maior componente conexo, mais o que estiver
  contido na caixa dele) são deste agente, medidos nos oficiais. **Nada é escrito em disco:
  a extração vive em memória e os sha256 continuam conferindo.**

- **(DEFAULT DO AGENTE — a §35 exige teste em simulador de daltonismo, mas um relato de
  ferramenta externa não é reproduzível por quem confere depois.)** A simulação virou código:
  [`ferramentas/verificar_daltonismo.py`](ferramentas/verificar_daltonismo.py), método de
  Viénot, Brettel & Mollon (1999), lendo as cores do CSS realmente servido e se autovalidando
  antes de reportar. Os limiares de aprovação também são deste agente — e o de tritanopia
  (8,0) sai de uma busca exaustiva que mostrou que **8,6 é o teto do Okabe-Ito** ali.

- **(DEFAULT DO AGENTE — §65.1 e `docs/04` dizem O QUE a camada de cada sistema mostra, não
  como desenhá-la.)** `runtime/camada-de-sistema.js` implementa a camada complementar a partir
  da direção já registrada — os motivos são citados do Guia, a geometria é deste agente. É o
  que tornou dispensáveis as amostras conceituais da §65.6, que a própria §65.1 define como
  "direção, não asset final".

- Os defaults internos ao runtime (horários das fases do céu, microtextos não registrados no
  Guia, pilha tipográfica de sistema, valores da paleta daltonismo, piso de ruído da extração
  de alfa, o microtexto `" · prioridade"`) estão listados em
  [`runtime/README.md`](runtime/README.md).

- **(DEFAULT DO AGENTE — nomenclatura dos documentos e ordem do índice; puramente editorial,
  sem efeito sobre identidade.)**

---

## O que este repositório deliberadamente NÃO contém

Estas ausências são cumprimento do Guia, não lacunas de trabalho:

- **Nenhum arquivo de mídia gerado** — imagem, vídeo ou áudio. §48 proíbe nomeadamente
  *"nova geração de imagem, vídeo ou áudio pela plataforma"*, e isso continua valendo. Em
  05/09/2026 o Fundador fechou a última brecha: as falas das aberturas entram como **texto em
  tela**, não como áudio produzido. As 11
  animações dos slots §49 são **cenas procedurais em Canvas 2D e WebGL** — código, não mídia —
  registradas no manifest como `fonte: "procedural-lumora"`. Os vídeos finais do profissional
  contratado entram como versão superior e viram ativos sem mudar código (§49.3), com a versão
  procedural virando o fallback obrigatório. **§64.2 permanece congelada:** cronograma,
  fornecedor e execução da produção profissional não foram tocados.
- **Nenhum wordmark, símbolo ou logo desenhado por este agente.** Regra 14. Quando existe PNG
  oficial, ele é a fonte canônica; quando não existe, a ausência está registrada. A extração de
  alfa de `runtime/marca-com-alfa.js` **não é exceção a isto**: ela lê o oficial e recupera uma
  informação que o achatamento em JPEG destruiu, sem produzir forma nova e sem escrever arquivo
  — o resultado existe só em memória, no navegador de quem abre a página.
- **Nenhum wallpaper por país, região ou locale.** §60.1/§60.2: revogados. O ambiente é o Céu
  Vivo global.
- **Nenhuma tagline alternativa.** A frase oficial é a da Aurora. "Te ajudo a enxergar melhor"
  **não consta em nenhuma das 59 páginas do Guia** (verificado por busca) e não é declarada
  aqui como oficial.

---

## Escalações — as sete fechadas

Resolvidas em 05/09/2026. Duas por decisão direta do Fundador (**§1** a L canônica é a
dominante, **§5** o briefing do Business é o céu estrelado puro) e cinco sob autorização
dele — *"pode resolver os problemas que deu tranquilamente"*, depois *"pode decidir. Eu
deixo você tomar controle de tudo"*, depois *"tenta resolver a §6 também"*:

- **§2** o "A" do wordmark é o sem travessão (4 de 5 lockups oficiais);
- **§3** o alfa é **recuperado** do próprio arquivo oficial, e a marca compõe sobre Céu Vivo,
  aurora acesa **e papel branco** — sem alterar um byte;
- **§4** o teal da §65.1 é da malha de rotas e não do símbolo;
- **§6** auditada linha a linha: das sete ausências, duas já eram decisão tomada, duas foram
  revogadas ou perderam função, duas foram **superadas por código**, e a última nunca foi
  asset — é uma pergunta de produto;
- **§7** as seis paletas com contraste calculado **e verificadas sob os três tipos de
  dicromacia** por simulação em código.

Tudo que veio da autorização está marcado como **DEFAULT DO AGENTE**, nunca como decisão
do Fundador (regra 22). **Nenhum arquivo foi inventado em nenhuma delas.**

**O que continua dependendo de outra pessoa** — registrado, sem bloquear nada:

- **"fia alto" e "magos" existem como sistema?** O Guia os cita em §49.3/§45 e ao mesmo tempo
  os marca como pendentes de definição na §18. Decisão de produto do Fundador *(dentro da §6)*.
- Nenhuma **família tipográfica** é nomeada em 59 páginas, e nenhum arquivo de fonte foi
  entregue — por isso `--lum-fonte` usa pilha de sistema, justamente para **não** simular o
  wordmark *(dentro da §2)*.
- O wordmark "LUMORA" é branco, e sobre papel branco ele some — resultado fisicamente correto,
  não falha da extração. Wordmark impresso sobre fundo claro exigiria uma **versão em tinta
  escura** do produtor. §70.5/§71.5 pedem *a L canônica*, que é cromática e sobrevive ao papel
  *(dentro da §3)*.
- Os **protótipos v1–v4** e os **áudios da §45** seguem não entregues, como registro histórico.
  Deixaram de ser demonstração ou bloqueio: a bancada executável é `runtime/verificacao.html`,
  e a fala das aberturas virou texto por decisão do Fundador.

Itens congelados (§64 — caridade e animações 3D) **não** aparecem como pendência, conforme
§64.3 determina.

---

*Fonte de verdade: Lumora — Guia de Referência Completo, Especificação de Referência v3,
gerado em 02/09/2026.*
