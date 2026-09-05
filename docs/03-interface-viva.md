# 03 — Interface Viva: catálogo de gestos

§67 e §68. Decisão do Fundador registrada em §67:

> "A interface é o **maior diferencial da Lumora** — exclusiva, com identidade visual própria,
> inexistente em qualquer outro sistema."

A identidade visual **não se limita a logos, ícones e capas**. O vocabulário abaixo é a
identidade em movimento. Todos os itens são "pele" da Fase 3A: **CSS/JS procedural, zero
assets, 60 fps, `prefers-reduced-motion` sempre respeitado** (§67.9, §68.7).

---

## Vocabulário oficial — 14 elementos

| # | Elemento | O que é | Seção |
|---|---|---|---|
| 1 | **Nebulosa de Ações** | Comando universal `Ctrl+K`. Overlay central em forma de nebulosa que dissolve a tela aberta; digitar filtra ações/abas, ↑/↓ navega, Enter executa, Esc dissolve. Qualquer tela em 2 teclas. | §67.1 |
| 2 | **Rastro de Aurora** | Fio de luz de **4 px** estilo aurora varrendo o topo da tela durante processamento (envio, IA, sincronização). Feedback assíncrono sem spinner genérico — "a Aurora está trabalhando". | §67.2 |
| 3 | **Respiração do Céu** | Modo Foco: as estrelas desaceleram **~4×** e um halo suave pulsa na borda da tela. O céu respira. | §67.3 |
| 4 | **Sismógrafo Vivo** | Faixa de **64 px** na base da tela desenhando linha sísmica em tempo real; cada evento real (venda, pedido, clique) injeta um pulso na onda. A tela inteira "sente" a atividade. | §67.4 |
| 5 | **Bólido** | Meteoro de vidro e luz cruzando a tela em **2,3 s**, clicável. **Classe excepcional** — incidentes de segurança, falha crítica. | §67.5, §69.3 |
| 6 | **Estrela do Usuário** | O perfil é uma estrela; clicar abre o contexto (nível/XP/Asas, plano, sistema atual, humor). Identidade do usuário no cosmos. | §67.6 |
| 7 | **Clima do Dia** | Badge permanente no topo com o "clima" do negócio; com a API de clima ativa (opt-in, §52), mostra a previsão que afeta as rotas. Fallback offline = clima do negócio determinístico. | §67.7 |
| 8 | **Fio de Ariadne** | Chips de luz no topo registrando o caminho percorrido; clicar volta direto. O usuário nunca se perde no cosmos — retorno em 1 toque. | §68.3 |
| 9 | **Estrelinha** | Favorito celeste (★) em cada card/item, com contador no topo. Substitui "curtir/pin" genérico; dialoga com a gamificação Asas. | §68.4 |
| 10 | **Poeira de Interação** | Ao clicar/tocar em qualquer lugar, uma névoa de partículas de luz se dispersa do ponto (canvas translúcido por cima do céu). Cada interação deixa poeira de estrela. | §68.2 |
| 11 | **Viagem Cósmica** | Transição entre sistemas e telas com zoom astronômico através de um campo de estrelas. | §70.2 |
| 12 | **Navegação em Bolhas** | Bolha-âncora no canto superior esquerdo que expande em mapa mental orbital. Padrão do sistema / tema Elio. | §65.3 |
| 13 | **Navegação em Ondas** | Onda de aurora que atravessa a tela carregando as abas. Tema Aurora. | §66 |
| 14 | **Notificações Vivas** | Linguagem de notificação por tema — bolha (Elio) / faixa-onda (Aurora), com hierarquia de urgência. | §69 |

---

## Navegação em Bolhas — regra estrutural (§65.3)

**Não há menu lateral sólido.**

1. Bolha-âncora no canto superior esquerdo.
2. Ao clicar, expande num **mapa mental**: uma bolha grande com várias bolhas pequenas (abas) orbitando.
3. Ao clicar numa aba: ela ganha foco e abrem **sub-bolhas** (sub-abas) ao redor; as demais abas
   **estouram** (somem) enquanto a aba atual estiver aberta.
4. Fechar (X, Esc ou clique fora) → as irmãs voltam a orbitar.

### A regra do geométrico × bolha

Brief do Fundador (§65): *"nada de formas geométricas sólidas no que não precisa ser — bolhas
translúcidas com a estética Liquid Glass / luz / espaço."*

> **Campos de entrada e elementos obrigatórios** (formulários, tabelas, inputs) **permanecem
> geométricos** (retângulos/quadrados). A regra é: **o que precisa ser forma geométrica é;
> o que não precisa, é bolha translúcida.** (§65.3)

Isto não é uma exceção estética — é o que mantém o sistema utilizável e acessível.

**Acessibilidade da navegação (§65.3):** Esc fecha; foco visível; leitor de tela anuncia a
hierarquia; `prefers-reduced-motion` reduz expansão e estouro a **fade simples**.

---

## Vista de Pátio — entrada dramática (§65.4)

Criatividade 3 da §61. Ao clicar em "Vista de Pátio":

1. A interface **gira** (rotação 3D suave) e faz **zoom de distância**;
2. Revela o título **"Veja o seu negócio inteiro"**;
3. Abre a dashboard panorâmica **dentro de uma bolha**;
4. Retorno ao girar de volta.

---

## Bolhas × Ondas — qual vale quando (§66.3)

| Contexto | Linguagem |
|---|---|
| Padrão do sistema / tema Elio | **Bolhas** (§65.3) |
| Tema Aurora **ou** IA Aurora ativa | **Ondas** (§66) |

O usuário escolhe o tema; a navegação acompanha o tema. A estética Aurora (rios de aurora,
§65.2) continua valendo em **toda a pele** — menu, cards, indicadores e assistente.

---

## Outros gestos aprovados

- **Saudação Viva** (§68.1) — a saudação muda conforme a hora real do aparelho:
  madrugada/noite/céu profundo · manhã/céu aberto · tarde/estrelas do meio-dia ·
  noite/constelação se formando.
- **Comandos de Voz** (§68.5) — **Web Speech API nativa do navegador**: processa no aparelho,
  sem API externa, sem custo, offline. Navegadores sem suporte: o botão avisa e se desliga.
  **Regra: som nunca é canal único** — o resultado sempre aparece também em texto/toast.
- **Ventania** (§69.4) — promovida de ideia futura a **gesto oficial de descarte** da
  notificação-aurora e de limpeza de notificações antigas.
- **Maré de Estrelas** (§67.8) — carregamento de longa duração; "maré" de estrelas fluindo da
  base ao topo mudando de cor pelo progresso. **Futuro, não prototipado.** A barra real
  permanece para acessibilidade.
- **Estados vazios e de erro com identidade** (§72.1, item 1 — APROVADO) — "nada aqui ainda…",
  "rota perdida" no vocabulário cósmico, zero assets.

### Ideias futuras não aprovadas (§68.6)

Registradas como propostas, **não como decisão**: Ecos (chips com ações recentes), Colapso
Estelar (minimizar encolhendo para um ponto de luz), Pele que segue o horário, Gestos de toque
espaciais (arrastar bolha para estourar; pinça para zoom no Atlas Estelar).

Duas já saíram desta lista: **Ventania** (promovida em §69.4) e **Narração-guia de onboarding
pela Aurora** (aprovada em §72.1, item 6 — voz + texto paralelo, regra dos 10 s da §16).

---

## Identidade sonora (§72.1, item 3 — APROVADO)

**Identidade sonora por categoria de notificação** — notas procedurais via **WebAudio**
(fiscal / pedido / sistema), complementando §69. **Zero arquivo.**

Regra transversal da §45: **sons nunca são canal único** — texto sempre em paralelo;
`prefers-reduced-motion` silencia. Mutar tudo ou por categoria é sempre possível (§20).

> Os 3 sons antigos do Elio (Supernova, Galaxy Bloom, Watercolor Whisp) foram **rejeitados
> pelo Fundador** em 23/08/2026 e os novos estão a definir (§44). O nome "Watercolor Whisp"
> pertence à era da aquarela, hoje revogada.
