# 06 — Acessibilidade

§35 e §60.12. **Acessibilidade é parte da identidade, não uma camada posterior.**

> §35: "A Lumora nasce acessível. **Não é extra de marketing: é requisito de produto**."
> §60.12: "Acessibilidade absurda em TODOS os sistemas... **Nenhum sistema nasce sem o pacote
> completo de acessibilidade.**"

---

## Normas ancoradas (§35)

| Norma | Escopo |
|---|---|
| **WCAG 2.2** (W3C, out/2023) | Padrão global — **nível AA em todos os planos** |
| **eMAG 3.1** (gov.br) | Modelo de Acessibilidade em Governo Eletrônico — 54 recomendações |
| **ABNT NBR 17225:2025** | Acessibilidade em conteúdo e aplicações web (146 orientações) |
| **ABNT NBR 17060:2022** | Acessibilidade em aplicativos móveis |
| **Lei 13.146/2015 (LBI)** | Direito à acessibilidade plena (art. 53) — compromisso contratual |

---

## Linha de base em todos os planos, sem custo extra (§35)

1. **Contraste de texto ≥ 4,5:1 (AA)** e **7:1 (AAA) em telas críticas**
2. **Foco visível** com contraste ≥ 3:1 em **100%** dos elementos interativos
3. **Status nunca só pela cor** — cor + ícone + texto (pensado para daltonismo)
4. **Navegação completa por teclado** e alvos de toque **≥ 44×44 px**
5. **Zoom até 200%** sem quebra de layout (reflow em 320 px)
6. **Leitor de tela end-to-end** (NVDA, VoiceOver, TalkBack)
7. **Modo Alto Contraste com 3 paletas** (padrão, preto/branco, daltonismo)
8. **Movimento reduzido** (`prefers-reduced-motion`); **nada pisca mais de 3 vezes por segundo**
9. **Legendas e Libras** nos vídeos institucionais (LBI art. 53) + **Libras animado do
   assistente** (§60.3): a bolha do Elio vira uma mãozinha que sinaliza as letras, com
   velocidade de troca ajustável pelo usuário; aplica-se a Elio e Aurora
10. **Texto em linguagem simples** no manual e no modo simplificado do Elio

**Planos com IA adicionam:** WCAG 2.2 **AAA** em telas críticas (contraste 7:1, foco reforçado,
autenticação sem CAPTCHA cognitivo — TOTP); VPAT/ACR público.
**Lumora Empresas adiciona:** auditoria externa anual, mapeamento de barreiras com
classificação de risco, manual acessível (HTML acessível + PDF/UA + versão em Libras).

**Aprovado em §72.1 (item 5):** **Libras nas notificações críticas** — animação de mãos junto
do alerta crítico (§69.3).

> **Libras é língua com gramática própria** — §35/§60.3 exigem validação com a comunidade
> surda. Datilologia (soletrar letras) **não substitui** Libras; é o gesto aprovado para o
> assistente, não a tradução completa.

---

## `prefers-reduced-motion` — mapa de reduções

Regra do Guia: animações complexas viram versões reduzidas, como **fade simples**.
Cada gesto tem sua redução registrada:

| Gesto | Com movimento reduzido | Seção |
|---|---|---|
| Viagem Cósmica | **Fade simples** | §70.2, §71.2 |
| Navegação em Bolhas (expansão/estouro) | **Fade simples** | §65.3 |
| Navegação em Ondas (varredura) | **Fade simples**; fallback funcional = listagem em bolhas | §66.2 |
| Bólido | **Toast simples** | §67.5 |
| Rastro de Aurora | **Desligado** | §67.2 |
| Poeira de Interação | **Desligada** | §68.2 |
| Estouro da bolha de notificação | **Fade simples** | §69.5 |
| Ventania (saída da onda) | **Dissolução suave** | §69.5 |
| Animações de abertura (slots §49) | **Poster estático** | §49.3 |
| Sons | **Silenciados** | §45 |

**O que nunca é reduzido nem suprimido:** avisos de segurança (§26/§37/§69.3) —
*"mudam de roupa, nunca de comportamento"*; a barra de progresso real por trás da Maré de
Estrelas (§67.8); o texto paralelo a qualquer canal sonoro.

Além da preferência do sistema, a **Otimização Adaptativa (§36)** reduz efeitos por capacidade
de hardware: em aparelhos fracos as animações caem automaticamente; em aparelhos potentes o
sistema pode ativar reforço visual e pré-carregamento.

---

## Contraste medido da paleta oficial

**(DEFAULT DO AGENTE — o Guia exige AA/AAA (§35) mas não publica razões calculadas; sem elas a
exigência não é verificável. Cálculo por este agente: WCAG 2.2, luminância relativa sRGB.)**

Fundo Deep Space medido nos assets oficiais: **`#00040F`** (faixa medida nos cantos: `#000000`–`#00080F`).

| Cor | Hex | Contraste | Texto AA (4,5) | Texto AAA (7) | UI/gráfico (3:1) |
|---|---|---|---|---|---|
| Texto primário | `#FFFFFF` | **20,50:1** | ✅ | ✅ | ✅ |
| Texto secundário | `#C8D2E8` | **13,51:1** | ✅ | ✅ | ✅ |
| Texto terciário | `#8FA0BF` | **7,76:1** | ✅ | ✅ | ✅ |
| Business verde | `#16E793` | **12,58:1** | ✅ | ✅ | ✅ |
| RotaCerta âmbar | `#FFA238` | **10,23:1** | ✅ | ✅ | ✅ |
| Aurora verde | `#2BCF92` | **10,20:1** | ✅ | ✅ | ✅ |
| Aurora teal | `#1D8FC5` | **5,65:1** | ✅ | ❌ | ✅ |
| L azul (fim do gradiente) | `#0072FF` | **4,74:1** | ✅ | ❌ | ✅ |
| **L violeta (início)** | `#B01DFF` | **4,36:1** | ❌ | ❌ | ✅ |
| **Aurora violeta** | `#8541FA` | **4,04:1** | ❌ | ❌ | ✅ |
| Borda de vidro | `#5A6B8C` | **3,82:1** | ❌ | ❌ | ✅ |

### Regras que decorrem da medição

1. **O gradiente da marca (violeta → azul) nunca é cor de texto corrido.** `#B01DFF` reprova
   AA. É cor de **símbolo, borda, halo e elemento gráfico** — onde o limite é 3:1, e passa.
2. **Aurora violeta `#8541FA` também é decorativo apenas.** Em texto sobre aurora, usar branco.
3. **Telas críticas exigem AAA (7:1)** — fiscal, financeiro, LGPD, segurança. Nessas telas
   apenas `#FFFFFF`, `#C8D2E8`, `#8FA0BF`, `#16E793`, `#FFA238` e `#2BCF92` qualificam.
4. **Sobre superfície de vidro** (`#0A1526` aprox.) todos os valores caem ~7%: `#1D8FC5` cai a
   5,04:1 (ainda AA) e `#0072FF` a 4,22:1 — **reprova AA como texto**. Em Liquid Glass, texto
   é branco.
5. **Em impressão** (fundo branco) a paleta inverte: `#16E793` cai a **1,63:1** e `#FFA238` a
   **2,00:1** — ilegíveis. Ver [`08-impressao-e-documentos.md`](08-impressao-e-documentos.md).

Reproduzir os cálculos: `python3 ferramentas/verificar_assets.py --contraste`

---

## Como a conformidade é garantida (§35)

- **Testes automatizados em CI** (axe-core, Pa11y, Lighthouse) **a cada mudança de interface**
- Testes manuais com leitores de tela em 1 página por fluxo **antes de cada release**
- Auditoria externa anual nos planos IA/Empresas
- Página pública **"Acessibilidade Lumora"** com política, normas atendidas, barreiras
  conhecidas e canal de reclamação com **resposta em 24 horas úteis**

## Por público (§35)

| Público | Solução |
|---|---|
| Daltonismo (protanopia, deuteranopia, tritanopia, acromatopsia) | Status com cor+ícone+texto; paletas testadas em simuladores (Coblis, Stark) |
| Baixa visão | Alto contraste, zoom 200–400%, leitor de tela, foco reforçado |
| Surdez / deficiência auditiva | Legendas + Libras; alertas com vibração e visual, **sem depender de áudio** |
| Mobilidade reduzida | Teclado completo, alvos ≥ 44×44 px, **sem gestos obrigatórios de arrastar** |
| Dislexia / TDAH / cognitivo | Linguagem simples, espaçamento ajustável, Elio em modo simplificado, formulários sem redigitação |

> **Consequência para a Navegação em Bolhas e em Ondas:** ambas precisam de equivalente
> completo por teclado e sem arrastar. §65.3 e §66.2 já registram isso (Esc, setas, Enter,
> foco visível, anúncio de hierarquia por leitor de tela) — não é opcional.

---

## Alerta de identidade: contraste e alfa

Os 13 arquivos oficiais **não têm canal alfa** (são JPEG). Compor um glyph sobre o Céu Vivo
exige moldura opaca, o que introduz uma borda dura entre o asset e o céu. Isso afeta contraste
percebido e a leitura do símbolo. Registrado em [`ESCALACOES.md`](../ESCALACOES.md) §3 —
**não corrigido**, porque exigiria alterar os arquivos.
