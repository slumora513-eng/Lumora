# Manifesto dos assets oficiais

Biblioteca entregue pelo operador em 02/09/2026 (`lumora_imagens_13_02092026.zip`).
Verificação técnica: **05/09/2026**.

## Regra de custódia

Os 13 arquivos foram copiados **byte a byte**, sem qualquer processamento. Confirmado por
comparação de sha256 antes e depois da cópia: **13/13 idênticos**.

**Não foi feito:** regeneração · filtro · alteração de pixel · alteração de cor · redesenho de
anatomia · reconstrução de wordmark · conversão de container · remoção de fundo · derivação de
tamanho · reamostragem.

Reverificar: `python3 ferramentas/verificar_assets.py`

---

## Inventário verificado

| # | Arquivo | Formato **real** | Dim. | Canais | Alfa | Fundo | Bytes |
|---|---|---|---|---|---|---|---|
| 01 | `01_lumora_glass_orb.png` | **JPEG** (JFIF, baseline) | 1024×1024 | 3 (YCbCr) | ❌ | ⚠️ **`#FFFFFF` branco** | 67.435 |
| 02 | `02_lumora_neon_coins.png` | **JPEG** | 1024×1024 | 3 | ❌ | ⚠️ **`#FFFFFF` branco** | 45.493 |
| 03 | `03_lumora_star_path.png` | **JPEG** | 1024×1024 | 3 | ❌ | Deep Space `#00020C` | 64.554 |
| 04 | `04_lumora_bubble_glyph.png` | **JPEG** | 1024×1024 | 3 | ❌ | Deep Space `#000512` | 64.780 |
| 05 | `05_lumora_aurora_glyph.png` | **JPEG** | 1024×1024 | 3 | ❌ | Deep Space `#00040D` | 60.043 |
| 06 | `06_lumora_atom_glyph.png` | **JPEG** | 1024×1024 | 3 | ❌ | Deep Space `#00080E` | 52.678 |
| 07 | `07_lumora_migration_glyph.png` | **JPEG** | 1024×1024 | 3 | ❌ | Deep Space `#00020C` | 51.621 |
| 08 | `08_lumora_ecosystem_orbit.png` | **JPEG** | 1024×1024 | 3 | ❌ | Deep Space `#00080F` | 60.487 |
| 09 | `09_lumora_comunidade_wordmark.png` | **JPEG** | 1024×1024 | 3 | ❌ | Deep Space `#000007` | 45.434 |
| 10 | `10_lumora_aurora_wordmark.png` | **JPEG** | 1024×1024 | 3 | ❌ | Deep Space `#000008` | 49.248 |
| 11 | `11_lumora_elio_wordmark.png` | **JPEG** | 1024×1024 | 3 | ❌ | Deep Space `#000006` | 40.693 |
| 12 | `12_lumora_migralumora_wordmark.png` | **JPEG** | 1024×1024 | 3 | ❌ | Deep Space `#000005` | 42.912 |
| 13 | `13_lumora_ecossistema_wordmark.png` | **JPEG** | 1024×1024 | 3 | ❌ | Preto puro `#000000` | 33.043 |

Todos: **8 bits por canal**, **scan baseline**, **perfil ICC RGB embutido** (456 bytes, PCS XYZ,
sem descrição textual), **sem EXIF**, **sem marcador Adobe APP14**.

---

## Checksums (SHA-256)

```
40bccea5b6395fcf40e870f8f0a2409d13e4977e7f2430853694c52cac0905ed  01_lumora_glass_orb.png
fa6a69b90dc0c19353f6afa8f8ce468e23dcacd9f30f20cf16ed90a6c219fe8f  02_lumora_neon_coins.png
1fcc14630b7a02421c2c46b998e5906da1dbceace5bbef70bb114a0a8b5338c8  03_lumora_star_path.png
7079af4ce3b6a722221da78d86daf9bbf5cdcf101c0c5e65899b10e699cb5ec8  04_lumora_bubble_glyph.png
eb4ad9864f26da8f2ca0b5824cec6ab1dc9f9a49bfa3a30f753d63ac76dcfe42  05_lumora_aurora_glyph.png
34690eb8215b0b7dc5b508525e45db1354fcf59f0f58fe991e852e1174367d05  06_lumora_atom_glyph.png
7fd7efe6b8f792584bb4f5f7e5ac42374a824defa2822e0767a0420088dbe67a  07_lumora_migration_glyph.png
aea2ef678b2c73e1d356c00684c913629a3d16a8948243b4ae750df4ea83c676  08_lumora_ecosystem_orbit.png
bcdeffbbc074d37a8266ff309bc67046f856adad4cbce1db46f4dd0bdc1b615d  09_lumora_comunidade_wordmark.png
f40f8f3f3f4881b097f241127f5a77dda4f0b3024d074b1f36bd8e9e298cdba9  10_lumora_aurora_wordmark.png
e861d3493c1dcbab2ce09684307d269798b1d37fbeee57c7fdf6546593e47860  11_lumora_elio_wordmark.png
8fd0871d500b4d235367290bab0ae35b82646a8797c966646f32ba5d80d9e2f9  12_lumora_migralumora_wordmark.png
7da77d438d3371d67741eaef4d88e7461a4a5aa40193d466df228f5209968a53  13_lumora_ecossistema_wordmark.png
```

---

## O que cada arquivo é

Descrição do conteúdo observado. **Não é atribuição de papel oficial** — o Guia não nomeia
nenhum destes arquivos, então a função de cada um permanece a definir pelo Fundador.

| # | Conteúdo observado | Coerência com o Guia |
|---|---|---|
| 01 | **Ícone de app**: L geométrica chapada (magenta→azul) dentro de bolha Liquid Glass, sobre campo estelar, em badge de canto arredondado | ✅ Deep Space + Liquid Glass. ⚠️ L de **anatomia diferente** da dominante; ⚠️ fundo branco |
| 02 | **Ícone de app**: L verde neon fundida a um gráfico de barras crescente, sobre campo estelar, em badge | ✅ Leitura do **Lumora Business** (organização, gestão, financeiro). ⚠️ fundo branco |
| 03 | L violeta/azul com **rota tracejada âmbar e estrela**, sobre campo estelar profundo | ✅ Leitura do **RotaCerta** (GPS espacial, rotas, waypoints). ⚠️ corpo violeta/azul, não teal (§65.1) |
| 04 | L de traço arredondado tipo bolha (violeta→ciano), com **bolhas de vidro flutuando** e estrelas | ✅ Linguagem do **Elio** (bolha, Liquid Glass). ⚠️ L de **anatomia diferente** da dominante |
| 05 | L com bolha-ponto sobre **cortinas de aurora boreal** verde/teal/violeta e campo estelar | ✅ Linguagem da **Aurora** — aurora boreal, nunca bolha como corpo |
| 06 | L violeta/azul com **anéis orbitais e esferas** tipo átomo, sobre nebulosa | ✅ Órbita/integração; dialoga com o "Núcleo de Controle" do Hub (§65.1) |
| 07 | L violeta/azul com **ícone de documento e seta de transferência** em ciano | ✅ Leitura do **MigraLumora** (§3, migração de dados) |
| 08 | L canônica dentro de **bolha Liquid Glass grande**, com símbolos dos sistemas orbitando dentro | ✅ **Ecossistema** como integração, não soma de logos (§17 do prompt) |
| 09 | **Lockup**: símbolo L com órbitas atômicas + wordmark `LUMORA` + descritor `COMUNIDADE` | ✅ Comunidade |
| 10 | **Lockup**: L com bolha-ponto sobre aurora + `LUMORA` + descritor `AURORA` em degradê aurora | ✅ Aurora |
| 11 | **Lockup**: L canônica + bolha de vidro ciano + `LUMORA` + descritor `ELIO` em ciano | ✅ Elio |
| 12 | **Lockup**: L com bolha-ponto atravessada por **faixa fluida verde/teal** + `LUMORA` + `MIGRALUMORA` | ✅ MigraLumora |
| 13 | **Lockup**: L canônica + os **3 símbolos de sistema** em linha + `LUMORA` + `ECOSSISTEMA` | ✅ Ecossistema |

---

## Auditoria ética (regra 12)

Inspeção visual dos 13 arquivos: **nenhuma bandeira, cruz, símbolo religioso, símbolo nacional,
guerreiro, estandarte partidário ou elemento de propaganda política.**
**Nenhum traço de aquarela** — todos são Deep Space + Liquid Glass, conforme §60.1.

As estrelas de 4 pontas em 08 e 13 são **sparkles cósmicos**, não cruzes. Aprovadas.
Detalhe em [`../../docs/07-etica-visual.md`](../../docs/07-etica-visual.md).

---

## Achados técnicos NÃO corrigidos

Corrigir qualquer um destes exigiria alterar arquivos oficiais — proibido sem autorização.
Estão registrados para decisão do Fundador, não resolvidos.

### 1. Extensão `.png` com conteúdo JPEG — todos os 13

Magic bytes `FF D8 FF E0` (JFIF), não `89 50 4E 47` (PNG). Consequências:

- **Sem canal alfa.** Nenhum dos glyphs ou wordmarks pode ser sobreposto ao Céu Vivo sem uma
  moldura opaca — o que introduz uma borda dura entre o asset e o céu.
- **Compressão com perda.** Bordas de alto contraste (o wordmark branco, o filete do gradiente)
  carregam artefatos de blocagem 8×8. Reencodar amplificaria a perda; escalar também.
- **Risco de pipeline.** Ferramentas que confiam na extensão podem falhar ou reescrever o
  arquivo silenciosamente.

### 2. Fundo branco em 01 e 02

`#FFFFFF` puro nos quatro cantos, contra `#000000`–`#00080F` nos outros onze (média dos 4 cantos). Sobre a interface
Deep Space, esses dois renderizam como **caixa branca**. Sem alfa, não há recorte possível sem
editar pixels.

### 3. Três anatomias de "L" na mesma biblioteca

- **Dominante (9 arquivos** — 05, 06, 07, 08, 09, 10, 11, 12, 13**)**: ombro arredondado,
  espinha interna curva, gradiente violeta→azul, frequentemente com bolha-ponto à direita.
- **Divergente A (01)**: L geométrica chapada, cantos vivos, sem ombro arredondado, sem bolha.
- **Divergente B (04)**: L de traço uniforme arredondado ("candy"), mais espessa.

O Guia cita **"a L canônica"** (§70.5, §71.5) sem nunca defini-la.
→ [`../../ESCALACOES.md`](../../ESCALACOES.md) §1.

### 4. Inconsistência no "A" do wordmark

Nos lockups 09, 10, 11 e 12 o **A de LUMORA não tem travessão** (forma `Λ`).
No lockup **13 o A tem travessão** (forma `A` convencional) — no wordmark e no descritor
`ECOSSISTEMA`. → [`../../ESCALACOES.md`](../../ESCALACOES.md) §2.

### 5. RotaCerta em violeta/azul, não teal

§65.1 especifica **"teal + âmbar"**. O âmbar confere (`#FFA238`); o corpo da L é violeta/azul.
→ [`../../ESCALACOES.md`](../../ESCALACOES.md) §4.

---

## Ausências registradas

Conforme a regra "se um ativo canônico não existir, não inventá-lo":

- **Nenhum asset oficial do Lumora Hub** (§65.1 descreve o "Núcleo de Controle").
- **Nenhum asset oficial do Lumora Business isolado** — 02 é a leitura mais próxima, mas o Guia
  não confirma.
- **Nenhum arquivo de fonte** e nenhuma família tipográfica nomeada em 59 páginas.
- **Nenhum vetor** (SVG/AI/EPS) — só raster 1024×1024 com perda.
- **Nenhum áudio da §45**, nenhum protótipo HTML da §65.6/§66.5/§67.10/§68.8, nenhuma amostra
  conceitual de fundo. → [`../../ESCALACOES.md`](../../ESCALACOES.md) §6.
