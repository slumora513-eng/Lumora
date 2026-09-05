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
| [`assets/oficiais/`](assets/oficiais/) | 13 arquivos oficiais preservados byte-a-byte |
| [`assets/oficiais/MANIFESTO.md`](assets/oficiais/MANIFESTO.md) | Inventário verificado (sha256, formato real, fundo) |
| [`ferramentas/verificar_assets.py`](ferramentas/verificar_assets.py) | Verificação somente-leitura: integridade, formato, fundo, paleta, contraste |
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
| 1 | **Todos os 13 são JPEG, não PNG.** A extensão `.png` não corresponde ao conteúdo (magic `FF D8`, JFIF, baseline, 3 canais, ICC RGB). | **Sem canal alfa.** Glyphs e wordmarks não têm transparência — não há como sobrepor ao Céu Vivo sem moldura opaca. |
| 2 | **`01_lumora_glass_orb` e `02_lumora_neon_coins` têm fundo branco puro** (`#FFFFFF` nos 4 cantos). Os outros 11 têm fundo Deep Space (`#000000`–`#00080F`). | Sobre a interface escura, esses dois renderizam como caixa branca. |
| 3 | **Três anatomias diferentes de "L"** convivem na biblioteca (ver [`ESCALACOES.md`](ESCALACOES.md) §1). O Guia cita "a L canônica" (§70.5/§51.5) mas nunca a define. | A L canônica não pode ser declarada por este agente. |

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
  `assets/` guarda apenas arquivos canônicos do operador; `docs/` guarda apenas
  especificação da estética procedural. Nenhuma imagem foi criada para representar
  céu, partículas, bolhas, aurora, ondas ou rastros.

- **(DEFAULT DO AGENTE — nomenclatura dos documentos e ordem do índice; puramente editorial,
  sem efeito sobre identidade.)**

---

## O que este repositório deliberadamente NÃO contém

Estas ausências são cumprimento do Guia, não lacunas de trabalho:

- **Nenhum asset novo de imagem, vídeo ou áudio.** §48: as animações finais são produção de
  profissional contratado; assets gerados por IA são referência provisória e "nenhuma nova
  geração de imagem, vídeo ou áudio será feita pela plataforma". §64.2 congela o assunto.
- **Nenhum código de runtime do Céu Vivo, Interface Viva ou Notificações Vivas.** §71, última
  linha: *"Código permanece bloqueado até o 'pode ir' final do fundador."* §69.7 e §72.1
  repetem: design fechado, código na rodada que o Fundador priorizar. O que existe aqui é a
  especificação executável desse código — não o código.
- **Nenhum wordmark, símbolo ou logo desenhado por este agente.** Regra 14. Quando existe PNG
  oficial, ele é a fonte canônica; quando não existe, a ausência está registrada.
- **Nenhum wallpaper por país, região ou locale.** §60.1/§60.2: revogados. O ambiente é o Céu
  Vivo global.
- **Nenhuma tagline alternativa.** A frase oficial é a da Aurora. "Te ajudo a enxergar melhor"
  **não consta em nenhuma das 59 páginas do Guia** (verificado por busca) e não é declarada
  aqui como oficial.

---

## Escalações abertas

Sete dúvidas de identidade não podem ser resolvidas por default porque exigem decisão de
marca — todas em [`ESCALACOES.md`](ESCALACOES.md):

1. Qual das três anatomias de "L" é a **L canônica** citada em §70.5.
2. O **"A" do wordmark LUMORA** aparece com e sem travessão em arquivos oficiais diferentes —
   e nenhuma família tipográfica é nomeada em 59 páginas.
3. Como suprir a **falta de alfa** nos 13 arquivos sem violar a regra de não alterar pixels.
4. **RotaCerta**: §65.1 pede "teal + âmbar"; o asset oficial traz violeta/azul + âmbar.
5. A **abertura do Lumora Business** ficou sem briefing após a revogação da aquarela.
6. **Assets citados no Guia que não foram entregues** (áudios §45, protótipos v1–v4, amostras
   conceituais) — registrados como ausentes, não recriados.
7. As três **paletas de alto contraste** (§70.6) são nomeadas, mas sem nenhum valor definido.

Itens congelados (§64 — caridade e animações 3D) **não** aparecem como pendência, conforme
§64.3 determina.

---

*Fonte de verdade: Lumora — Guia de Referência Completo, Especificação de Referência v3,
gerado em 02/09/2026.*
