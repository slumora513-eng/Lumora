# 02 — Céu Vivo

O ambiente visual global da Lumora. §70 (camadas de estética) e §71 (estética viva, aprovada
pelo Fundador em 01/09/2026 — *"sou babilônica mesmo"*, céu inteiro).

> **§71 — princípios da estética viva:** zero aquarela (só luz, vidro e espaço); **céu global
> único** (o ambiente muda por horário do dia, **nunca por cliente/conta**); leveza (tudo em
> CSS/JS e texto, sem gerar novos assets de mídia); movimento respeitoso
> (`prefers-reduced-motion` e níveis da Otimização Automática §36 sempre aplicados);
> cada interação responde.

---

## 1. Céu Vivo — o ambiente que respira (§70.1 / §71.1)

O fundo de **todos** os sistemas. Reativo ao horário real do aparelho:

| Momento | Céu |
|---|---|
| **Madrugada** | Aurora boreal sutil |
| **Dia** | Partículas douradas |
| **Noite** | Constelações acesas |

**Cada ação real do negócio acende uma estrela** no céu daquele dia — venda, entrega, pedido,
lançamento. Ao fim do dia, a Lumora desenha a **Constelação do Dia**: uma constelação única
formada pelas atividades do negócio, com replay visual — *"sua empresa brilhou hoje"*.

Alimenta o **Replay do Dia** e o **Sismógrafo** (criatividades 5 e 6 da §61).

**Não substituir por wallpaper.** §60.1/§60.2 revogaram os wallpapers por país, por locale e
os wallpapers padrão de Business, RotaCerta e Hub. O céu **nunca muda por cliente, país ou
região** — só por horário.

Os wallpapers padrão antes gerados (Global/Américas/Europa) **não são o fundo dos sistemas**;
ficam como reserva para superfícies secundárias (login, documentos), uso futuro a confirmar
(§65.1). Wallpapers padrão regionais são trabalho futuro sem data (§60.2/§60.13) —
personalização individual permanece como opção a definir, **não** como fundo padrão.

---

## 2. Viagem Cósmica — movimento entre telas (§70.2 / §71.2)

Trocar de sistema é uma viagem. **Zoom astronômico:** a câmera encolhe a bolha atual,
atravessa um campo de estrelas e cresce no sistema de destino.

- A bolha do Elio/Aurora acompanha o cursor com **inércia líquida**.
- As partículas de fundo **fogem do toque/cursor** (parallax sutil).
- **Com `prefers-reduced-motion`: vira um fade simples.** (§70.2, §71.2 — explícito.)

---

## 3. Sotaque Cósmico — voz da marca (§70.3 / §71.3)

Especificado em [`05-voz-e-microtextos.md`](05-voz-e-microtextos.md).

---

## 4. Formas que Sentem — microinterações (§70.4 / §71.4)

| Elemento | Comportamento |
|---|---|
| Campo de formulário em foco | Acende com **halo de estrela** |
| Botão no clique | **Respingo de vidro líquido** |
| Toggle | **Derrete** entre estados |
| Card no hover | **Flutua** suavemente |
| Feedback | Tátil e sonoro sincronizados (§20/§36: vibração 20-40-20) |

Foco visível e alvos ≥ 44 px (§35). Implementação com **Web Animations API / CSS apenas,
sem bibliotecas** (§70.4).

Primeiro item da ordem de implementação da Fase 3A — é a base tátil de tudo (§71).

---

## 5. Documentos com Alma (§70.5 / §71.5)

Especificado em [`08-impressao-e-documentos.md`](08-impressao-e-documentos.md).

---

## 6. Acessibilidade Bonita (§70.6 / §71.6)

Paletas de alto contraste **com identidade**, não tela branca sem alma:

- **"Fogo de Nebulosa"** — vermelho-laranja profundo
- **"Aurora Dia"**
- **"Aurora Noite"**

Contraste AA/AAA (§35) sem abrir mão da alma visual. Alvos 44×44 px, leitor de tela e §35
intactos. As três paletas se aplicam também a bolhas e faixas de notificação (§69.5).

> **Nota de procedência:** §70 e §71 foram **restauradas em 02/09/2026** a partir do snapshot A
> (`spec_v3_completo_atualizada_02-09-2026A`). Eram originalmente §50/§51 e ficaram ausentes
> após a renumeração; foram reinseridas com conteúdo preservado integralmente. Por isso a
> numeração interna de §71 ainda aparece como "51.1, 51.2…" no Guia — é o texto original
> preservado, não um erro.

---

## Assinatura visual por sistema sobre o Céu Vivo

O céu é a **base compartilhada**. Cada produto ganha uma camada complementar por cima (§65.1) —
detalhada em [`04-identidade-por-sistema.md`](04-identidade-por-sistema.md).

§65.1 é explícito quanto ao meio: as amostras conceituais aprovadas em 01/09/2026 servem de
direção, mas **"a renderização final será procedural (canvas/WebGL, §65.5) — nunca imagem
estática"**, preservando leveza e o céu vivo por horário.

---

## Regras de leveza (transversais)

- **Zero asset novo.** §71: "tudo em CSS/JS e texto, sem gerar novos assets de mídia".
  §61, notas de implementação: "nada de asset pesado, tudo CSS/JS local".
- **60 fps em aparelhos médios** (§65.5).
- **Custo zero** — procedural, sem API externa (§65.5, §72.1).
- Em aparelhos fracos, animações e efeitos são reduzidos automaticamente pela Otimização
  Adaptativa (§36), sempre respeitando a preferência de movimento reduzido do sistema
  operacional (p. 3 do Guia).
- Telemetria local de desempenho (fps/IndexedDB medidos no aparelho, **sem analytics externo**,
  LGPD) alimenta a otimização adaptativa — aprovada em §72.1 item 4.
