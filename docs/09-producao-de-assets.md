# 09 — Produção de assets: o que a plataforma não faz

§48 (decisão do Fundador, 29/08/2026), reafirmada em §60.1 e **congelada em §64.2**.

---

## A decisão

> **§48 — Produção visual:** "As animações finais (seções 1, 2, 3, 18 e 36) serão produzidas
> por **profissional contratado** — as descrições conceituais do spec funcionam como
> **briefing oficial** (movimentos, identidade sonora, vozes, paletas). Os assets gerados por
> IA até esta data (imagens, vídeos e áudios de referência) ficam como **referência
> provisória, não oficial**. **Nenhuma nova geração de imagem, vídeo ou áudio será feita pela
> plataforma.**"

> **§60.1:** "Vídeos/animações de abertura (2D e 3D) gerados por IA: **REVOGADOS** como
> produção da Lumora."

> **§64.2:** "As animações de inicialização e 3D são produção do profissional contratado,
> **nunca da IA/plataforma**. O assunto (cronograma, fornecedor, execução) está **congelado**."

---

## Regras operacionais

| ✗ Não fazer | ✓ Fazer |
|---|---|
| Gerar animações finais | Manter e refinar o **briefing** conceitual |
| Gerar novos vídeos finais | Registrar o slot e seu briefing (§49) |
| Gerar novos áudios finais | Apontar o slot para o áudio já registrado na §45 |
| Transformar protótipos ou conceitos antigos em ativos oficiais | Tratá-los como **referência provisória** |
| Inventar um asset que não existe | **Registrar a ausência** |
| Aplicar filtro, alterar pixel, cor ou anatomia de asset oficial | **Preservar o original** e verificar integridade |
| Reconstruir wordmark manualmente | Usar o PNG oficial como fonte canônica |
| Criar wordmark ou logo não estabelecido como oficial | Escalar ao Fundador |
| Transformar símbolo de módulo em wordmark | — |
| Transformar conceito visual em logo oficial | — |
| Inventar versões "mais bonitas" de marcas oficiais | — |

**Derivação de tamanhos** por operação técnica de escala é permitida **apenas quando
autorizada**. Nenhuma derivação foi feita neste repositório.

---

## O briefing oficial para o profissional contratado (§49.4)

> "O briefing oficial para o profissional é: **esta seção (49) + seções 1, 2, 3, 18 e 36 + a
> Biblioteca de Áudio (§45) + os assets de referência provisórios já gerados**. O profissional
> entrega por slot: **vídeo 16:9, vídeo 9:16, poster e (se couber) Lottie**.
> **Nenhuma animação gerada pela plataforma é oficial.**"

---

## Registro oficial de slots (§49.1)

Toda animação do ecossistema é um **slot nomeado e versionado**. Trocar o arquivo do slot troca
a animação em todo o sistema, **sem mexer em código**.

### Inicialização

| Slot | Sistema | Briefing (§18) | Áudio (§45) |
|---|---|---|---|
| `abertura.elio` | Elio | Bolhinhas se juntando até formar a bolha principal; fala *"Olá, eu sou o Elio."* | `elio_abertura_som.mp3` + `elio_boas_vindas.mp3` |
| `abertura.aurora` | Aurora | Noite chegando e aurora boreal se formando; fala etérea e ecoante | `aurora_abertura_som.mp3` + `aurora_boas_vindas.mp3` |
| `abertura.rotacerta` | RotaCerta | Horizonte com veículos em silhueta azul e zoom out | `rotacerta_abertura_som.mp3` + `rotacerta_boas_vindas.mp3` |
| `abertura.business` | Lumora Business | ~~Gota de aquarela se espalhando formando o nome~~ **REVOGADO (§60.1)** — briefing vago, ver [`ESCALACOES.md`](../ESCALACOES.md) §5 | `business_abertura_som.mp3` + `business_boas_vindas.mp3` |
| `abertura.ecossistema` | Ecossistema | Versão épica unindo os sistemas | `ecossistema_abertura_som.mp3` + `ecossistema_boas_vindas.mp3` |
| `abertura.hub` | Lumora Hub *(interno)* | Esfera técnica liquid-glass / bolha central com conexões neurais | `hub_abertura_som.mp3` + `hub_boas_vindas.mp3` |

### Carregamento

| Slot | Contexto | Briefing | Áudio |
|---|---|---|---|
| `loading.criar_mundo` | Personalização (§2) | *"Criando o seu novo mundo"* — bolha vira planeta | `elio_criando_mundo.mp3` |
| `loading.otimizar` | Otimização (§36) | *"Otimizando o seu sistema"* — bolha vira engrenagens | `elio_otimizando.mp3` |
| `loading.migra_elio` | MigraLumora (§3) | Bolha puxa pastas/papéis/dados com efeito splash | `elio_migrando.mp3` |
| `loading.migra_aurora` | MigraLumora (§3) | Informações nadando em rio de aurora boreal | `aurora_informacoes.mp3` |
| `loading.nicho` | Personalização (§2) | *"Acertando em cheio o seu nicho"* — bola entrando no gol | `elio_nicho.mp3` |

### Microinteração

| Slot | Briefing | Áudio |
|---|---|---|
| `notificacao.elio` | Pulso sonoro/visual de notificação do Elio | §45 notificações |
| `notificacao.aurora` | Chime de aurora para avisos | §45 notificações |
| `sucesso.elio` | Confirmação de ação bem-sucedida | §45 sucesso |
| `sucesso.aurora` | Confirmação com timbre de aurora | §45 sucesso |

> **Slots novos exigem entrada neste registro antes de existir no manifest** (§49.3).
> Dois nomes ainda **não são slots registrados** e seguem pendentes de definição:
> **"fia alto"** e **"magos"** (§45, §49.3).

---

## Manifest de animações (§49.2)

Arquivo único versionado, servido pelo backend, cacheável com ETag:
`animations.manifest.json`, `apiVersion: "lumora.animations/v1"`.

Cada versão de slot declara `fonte`, `autor`, `formatos` (`video_16x9`, `video_9x16`, `lottie`,
`poster`), `audio`, `duracao_alvo_s`, `checksum_sha256`, `aprovado_por` e `data_aprovacao`.

### Regras incontornáveis (§49.3)

1. **Troca sem deploy** — upload no Hub, marcar versão ativa, o PWA puxa o manifest na próxima
   abertura. Nenhuma linha de código muda.
2. **Fallback obrigatório** — toda versão nova convive com a anterior. Se o asset novo falhar
   (404, codec, rede), o sistema cai automaticamente para a anterior. **O usuário nunca vê
   tela quebrada.**
3. **Variantes por dispositivo** — `video_16x9` (desktop/tablet) e `video_9x16` (celular em pé).
   Faltando a vertical, usa a horizontal com **letterbox — nunca corta o assunto**.
4. **Respeito à otimização adaptativa (§36)** — nos níveis Básico/Econômico usa a versão leve
   (poster + animação CSS mínima); com `prefers-reduced-motion`, **poster estático**.
   Avisos de segurança nunca são suprimidos.
5. **Emparelhamento de áudio** — trocar o vídeo **não** troca o áudio; são independentes,
   sync por timestamp do manifest.
6. **Aprovação antes de ativar** — nenhuma versão vira ativa sem `aprovado_por` preenchido
   + data. Fluxo: upload → pré-visualização → aprovação → ativação, com trilha de auditoria
   append-only (§37).
7. **Formatos v1** — MP4 (H.264), WebM (VP9/AV1), Lottie JSON, poster JPG/WebP.
   **Peso máximo: 8 MB (abertura), 3 MB (loading/microinteração).**
8. **Histórico** — máx. 5 versões por slot; mais antigas são **arquivadas, não apagadas**.

---

## Biblioteca de Áudio (§45) — status

Dez arquivos registrados em 29/08/2026, hospedados em URLs externas citadas no Guia.
**Nenhum foi entregue a este repositório** — ver [`ESCALACOES.md`](../ESCALACOES.md) §6.

Nota do próprio Guia (§45): esses sons carregam "a identidade sonora da época em que foram
feitos: vidro líquido / **aquarela [revogada]** / aurora". São **registro histórico**.
O áudio `business_abertura_som.mp3` está explicitamente marcado **[REVOGADO em 01/09/2026]**
porque acompanhava a animação da gota de aquarela.

Além disso, §44 registra que os **3 sons antigos do Elio** (Supernova, Galaxy Bloom,
Watercolor Whisp) foram **rejeitados pelo Fundador** em 23/08/2026 e os novos estão a definir.

**Nenhum áudio novo foi gerado.** §48 proíbe.

---

## Estética procedural × assets oficiais (regra 21)

A separação é estrutural, não organizacional:

| Categoria | Onde vive | Natureza |
|---|---|---|
| **Assets oficiais** — logos, símbolos, wordmarks, imagens canônicas, arquivos do operador | `assets/oficiais/` | Arquivo. Preservado, verificado, nunca regenerado. |
| **Estética procedural** — céu, partículas, estrelas, aurora, ondas, bolhas, rastros, microinterações, notificações, transições | Código/runtime (**bloqueado até o "pode ir"**, §71) | Comportamento. **Nunca uma coleção de imagens estáticas.** |

§65.1 é explícito: a renderização final da assinatura de cada sistema **"será procedural
(canvas/WebGL) — nunca imagem estática"**.

§71: **"leveza (tudo em CSS/JS e texto, sem gerar novos assets de mídia)"**.

Por isso este repositório **não contém uma única imagem de céu, partícula, bolha, onda ou
rastro**. Gerá-las contrariaria §48 e §71 ao mesmo tempo.
