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

## Código bloqueado

§71, encerramento da ordem de implementação da Fase 3A:

> "Código permanece bloqueado até o **'pode ir' final do fundador**."

Reforçado em §69.7 (Notificações Vivas: "design fechado; prototipagem e código entram na
rodada seguinte, pelos itens que o fundador priorizar primeiro — **PRIORIZAÇÃO EM ABERTO**")
e em §72.1 (as 6 candidatas aprovadas: "APROVADO — **código na rodada a agendar**").

**Consequência prática para este repositório:** a estética procedural (Céu Vivo, Interface
Viva, Notificações Vivas, Formas que Sentem) está especificada em detalhe executável, mas
**não implementada**. A ordem de implementação já decidida, quando o sinal vier (§71):

1. ✨ Formas que Sentem (base tátil)
2. 🌌 Céu Vivo (ambiente)
3. 💬 Sotaque Cósmico (textos)
4. 🚀 Viagem Cósmica (transições)
5. 📜 Documentos com Alma (PDF)
6. 🌈 Acessibilidade Bonita (alto contraste com alma)

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
