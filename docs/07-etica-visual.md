# 07 — Ética visual

Proibições absolutas. Valem para **qualquer** ativo Lumora: assets oficiais, estética
procedural, temas da Comunidade, documentos, material institucional.

---

## Proibido introduzir

- bandeiras
- cruzes
- símbolos religiosos
- símbolos nacionais
- guerreiros
- estandartes partidários
- propaganda política
- qualquer elemento que possa sugerir posicionamento político ou religioso

Também proibido: **qualquer elemento que contradiga as decisões visuais congeladas do
Fundador** (§64) ou as revogações em vigor (§60.1) — entre elas, aquarela em qualquer forma.

---

## Por que isso é estrutural, não decorativo

A Lumora é B2B com **mercado-alvo na América do Sul** e preparo para expansão global (§19),
com **Locale Packs** por região e uma **Comunidade aberta a qualquer pessoa** (§16), com
usuários a partir de **16 anos** e moderação por infrações. Um símbolo nacional, religioso ou
partidário num tema publicado por um usuário é um risco de moderação, não apenas de estética.

A decisão de identidade que sustenta isso: **o Céu Vivo é global e não muda por cliente, país
ou região** (§60.2, §71). Os wallpapers dos 193 países foram revogados exatamente para que o
ambiente não carregue marcação nacional. Reintroduzir bandeiras ou símbolos nacionais
contrariaria uma revogação explícita do Fundador.

---

## Auditoria dos 13 assets oficiais — 05/09/2026

Cada arquivo foi inspecionado visualmente contra esta lista.

| Verificação | Resultado |
|---|---|
| Bandeiras | **Nenhuma** |
| Cruzes ou símbolos religiosos | **Nenhum** |
| Símbolos nacionais | **Nenhum** |
| Guerreiros, estandartes, propaganda política | **Nenhum** |
| Aquarela (pinceladas, pigmentos, papel aquarelado, bordas suaves de pigmento) | **Nenhuma** — todos os 13 são Deep Space + Liquid Glass |
| Coerência com a identidade oficial | **Conforme** |

**Sobre as estrelas de 4 pontas** em `08_lumora_ecosystem_orbit` e
`13_lumora_ecossistema_wordmark`: são **sparkles cósmicos** (brilho/estrela), coerentes com o
vocabulário do Céu Vivo. Não são cruzes nem símbolos religiosos — a forma é um losango de
quatro pontas com brilho radial, sem hastes perpendiculares de espessura uniforme. **Aprovadas.**

Conclusão: **os 13 assets oficiais passam na auditoria ética.** Os problemas encontrados neles
são técnicos (container, alfa, fundo, anatomia da L), não éticos — ver
[`assets/oficiais/MANIFESTO.md`](../assets/oficiais/MANIFESTO.md) e
[`ESCALACOES.md`](../ESCALACOES.md).

---

## Regras adjacentes que também vinculam a produção visual

| Regra | Origem |
|---|---|
| **Arte e modelos respeitam licenças** — vale para temas da Comunidade e para modelos 3D | §15, §16, §60.4 |
| **Até 10 imagens por tema**; prioridade para arte do próprio usuário; **geração por IA só se a pessoa escolher** | §16 |
| **Idade mínima 16 anos** para comprar, produzir e vender na Comunidade; verificação obrigatória no Brasil e na UE | §16 |
| **Comentário agressivo ou inapropriado gera infração** e pode levar a banimento (5 infrações = banimento automático) | §16 |
| **Nenhum dos assistentes xinga**, nem no fluxo dramático de banimento | §16 |
| **Nada pisca mais de 3 vezes por segundo** — risco de convulsão fotossensível | §35, item 8 |
| **Preview de notificação mascarado** por padrão (LGPD) | §69.5 |
| **Transparência e LGPD são obrigatórias** | §21 |

---

## Ausência de flashes perigosos

A regra dos **3 flashes por segundo** (§35) é uma exigência de segurança, não de conforto —
vincula diretamente três gestos da Interface Viva que envolvem luz pulsante:

| Gesto | Restrição |
|---|---|
| **Bólido** (§67.5) | Passagem única em 2,3 s. Não pode repetir em rajada nem piscar durante o trajeto. |
| **Respiração do Céu** (§67.3) | Halo pulsa em ciclo lento — a bolha de notificação respira em ciclo de ~3 s (§69.1). Muito abaixo do limite. |
| **Bolha de alta prioridade** (§69.3) | "Respiração rápida" com brilho âmbar deve permanecer **abaixo de 3 Hz**. |

Com `prefers-reduced-motion`, todos viram fade ou toast estático.
