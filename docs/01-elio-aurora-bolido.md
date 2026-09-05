# 01 — Elio, Aurora e Bólido

Três linguagens visuais distintas. **Nunca se misturam.**

---

## Elio — a bolha

Assistente padrão. Voz masculina, grave, elegante e imponente (§1).

**Matéria visual:** bolha colorida em Liquid Glass. A bolha **nasce, flutua e pode estourar em
partículas/bolhinhas**. Esse é o ciclo completo da linguagem — entrada, permanência, saída.

| Momento | Gesto | Referência |
|---|---|---|
| Abertura | Várias bolhinhas se juntam até formar a bolha principal; ao terminar, diz *"Olá, eu sou o Elio."* | §1, slot `abertura.elio` (§49.1) |
| Personalização por nicho | A bolha muda de forma conforme o texto falado: "criando o seu novo mundo" → planeta; "otimizando o seu sistema" → engrenagens; "acertando em cheio o seu nicho" → bola entrando no gol | §2, slots `loading.*` |
| MigraLumora | A bolha puxa pastas, papéis e dados para dentro dela com efeito de splash | §3, slot `loading.migra_elio` |
| Libras | A bolha se transforma em uma mãozinha que sinaliza as letras em Libras, formando as palavras em tempo real; velocidade de troca de letras ajustável pelo usuário | §60.3 (aprovado) |
| Navegação | Bolha-âncora no canto superior esquerdo que expande em mapa mental de bolhas orbitando | §65.3 |
| Notificação | Nasce pequena no canto superior direito, infla (~0,4s), respira, estoura em 5–7 bolhinhas | §69.1 |

---

## Aurora — a onda de luz

Voz feminina. Na abertura o registro é etéreo e ecoante; depois volta ao registro normal.

**Matéria visual:** aurora boreal e ondas de luz. **Nunca uma bolha.**
§60.11 lista isso explicitamente entre as decisões que não mudaram:
*"Aurora = aurora boreal (nunca bolha)."*

Quando o usuário escolhe o tema Aurora, **toda a "pele" de bolhas vira aurora** — menu, cards,
indicadores e o próprio assistente passam a ser rios de luz verde/teal/violeta fluindo (§65.2).

| Momento | Gesto | Referência |
|---|---|---|
| Abertura | A noite chega, a aurora se forma e se move; diz *"Olá, eu sou Aurora. Que minha luz domine o seu negócio."* | §1, slot `abertura.aurora` |
| MigraLumora | As informações **nadam em um rio de aurora boreal** | §3, slot `loading.migra_aurora` |
| Navegação | Uma **onda de aurora atravessa a tela** de um lado ao outro (~0,8s); as abas passam dentro do movimento da onda; scroll percorre a crista, item central entra em foco com `scale(1.2)` e brilho | §66.1 |
| Sub-navegação | Clicar numa aba abre **mini-ondas** com as sub-funções; as demais ondas somem enquanto a aba estiver aberta | §66.1 |
| Notificação | Onda de luz varre da esquerda (~0,8s) e assenta em **faixa horizontal no topo**, ondulando; várias notificações empilham como pequenas marés na mesma faixa | §69.2 |
| Saída da notificação | **Ventania** — rajada de partículas varre a faixa para fora, dissolvendo em poeira estelar (~1s) | §69.2, §69.4 |
| Comunidade | Aurora é a guardiã: firme quando necessário, calma quando ajuda. No fluxo de banimento fica vermelha, com ondas mais fortes | §16 |

### Física da onda (§66.2 — refinamento registrado)

- Entrada lateral com easing `cubic-bezier(.22, 1, .36, 1)`, varredura esquerda → centro em ~0,8s.
- Crista senoidal: cada aba em `y = sin(i/N · 2π) · amplitude` — **amplitude 64px** no nível 1,
  **34px** nas mini-ondas; **step 240px / 150px**.
- Scroll → índice: `deltaY` acumulado define o item.
- **Só `transform` e `opacity`** (nada de layout) — 60 fps, JS puro, sem bibliotecas.
- Teclado: ←/→ (ou ↑/↓) navega, Enter seleciona, Esc fecha.
- `prefers-reduced-motion`: sem varredura — **fade simples**; fallback funcional = listagem em
  bolhas (§65.3).

---

## Bólido — o excepcional

**Meteoro de vidro e luz que atravessa a tela em ~2,3 s**, clicável (§67.5).

**Não é notificação cotidiana.** §67.5 registra a atualização de cargo em 02/09/2026:

> "Com as Notificações Vivas, o Bólido passa a ser a **classe excepcional** da hierarquia
> (incidentes de segurança, falha crítica). O dia a dia usa a bolha do tema Elio e a
> faixa-aurora do tema Aurora (§69)."

Combina com o **Modo Bolha Rompida** (alerta de excesso/ruído, criatividade 1 da §61).
Com `prefers-reduced-motion`, vira **toast simples**.

---

## Hierarquia de urgência (§69.3) — regra transversal

| Nível | Tema Elio | Tema Aurora | Some sozinha? |
|---|---|---|---|
| **Normal** | Bolha que respira (escala 1 ↔ 1,03, ciclo ~3s) e estoura | Onda que assenta e é varrida | Não |
| **Alta** | Bolha **âmbar**, respiração rápida | Faixa com brilho intensificado | Não |
| **Crítica** (fiscal, segurança, LGPD, pagamento) | Bolha **congelada brilhando — não estoura** | Faixa **ancorada** — ondulação para, brilho contínuo, ventania não leva | **NÃO — só sai por ação explícita** |
| **Excepcional** | **Bólido** (meteoro, §67.5) | Onda dupla com clarão | Pode, mas com confirmação |

**Regra inegociável (§69.3):** avisos de segurança nunca são suprimidos (§26/§441) —
**mudam de roupa, nunca de comportamento.**

### Requisitos transversais das notificações (§69.5)

- **Empilhamento:** máx. 4–5 visíveis; excesso vira contador ("+3") que abre o Centro;
  agrupar por tipo (fiscal, pedidos, sistema).
- **Não-perturbe** (Modo Foco §13 / Respiração do Céu §67.3): com foco ativo, bolhas nascem e
  se dissolvem em poeira **sem som nem háptico**; a onda passa sem assentar. Críticas
  continuam, com snooze.
- **Acessibilidade:** `prefers-reduced-motion` → "estourar" vira fade simples e "ventania" vira
  dissolução suave; **som nunca é canal único** (texto em paralelo); `aria-live="polite"`
  (normal) e `assertive` (crítica); alvos ≥ 44px; paletas de alto contraste (§70.6).
- **Migração de tema com notificações na tela:** trocar Elio ↔ Aurora **transforma** as
  notificações sem perda — bolhas se deformam em faixa; faixa se condensa em bolhas.
- **Privacidade (LGPD):** preview mascarado por padrão — *"Pagamento recebido — R$ \*\*"*.
  Dados sensíveis nunca transitam expostos na bolha ou na faixa; revela apenas ao abrir.

---

## Regra de ouro (§1) — vale para a expressão visual também

Elio e Aurora **nunca alteram sozinhos dados fiscais ou financeiros**. Ações críticas geram
rascunho e exigem aprovação humana. Quando detectam risco, intervêm de forma educada; se a
pessoa diz que a situação é provisória ou estratégica, o assistente responde
*"Ok, peço perdão pela intervenção."* e registra que ela assumiu a responsabilidade.

Visualmente isso significa: **nenhuma animação de confirmação pode sugerir que uma ação
fiscal foi concluída antes da aprovação humana.**
