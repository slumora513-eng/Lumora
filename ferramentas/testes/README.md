# Suítes de verificação do runtime

271 checagens: **207 em Chromium** sobre `runtime/verificacao.html` e **64 em Node
puro**, porque o Blueprint da §50 é formato de arquivo e não precisa de navegador.
Elas existiam antes como arquivos soltos fora do repositório, o que tornava a frase
"todas passando" impossível de conferir por quem lê. Agora rodam com um comando.

## Rodar

```bash
python3 -m http.server 8765           # na RAIZ do repositório, num terminal
node ferramentas/testes/rodar.mjs     # noutro
```

As suítes também rodam contra um site **publicado**, o que testa o deploy e não só o
código — cabeçalho errado, MIME quebrado ou arquivo faltando aparecem como falha:

```bash
LUM_BASE=https://seu-endereco node ferramentas/testes/rodar.mjs
```

Saída esperada: `271 verificações, 0 falhas`.

Precisa de Playwright (`npm i -D playwright-core`) e de um Chromium. O
`navegador.mjs` procura os dois sozinho — inclusive em instalação global e em
`PLAYWRIGHT_BROWSERS_PATH` — e só reclama se não achar.

| Variável | Para quê | Padrão |
|---|---|---|
| `LUM_BASE` | Onde o servidor está | `http://localhost:8765` |
| `LUM_CHROMIUM` | Caminho do executável, se a busca falhar | descoberto |
| `S` | Onde gravar as capturas de tela | `/tmp` |

## As suítes

| Arquivo | O que cobre | Checagens |
|---|---|---|
| `teste.mjs`    | Fase 3A (§71) — Céu Vivo, Sotaque, Viagem, Documentos, paletas | 13 |
| `t2.mjs`       | Animações dos slots, Notificações Vivas, navegação, Interface Viva | 24 |
| `reduzido.mjs` | `prefers-reduced-motion` na Fase 3A | 6 |
| `red2.mjs`     | `prefers-reduced-motion` nos módulos novos | 7 |
| `t3d2.mjs`     | Aberturas em WebGL 3D, e o recuo quando não há GPU | 11 |
| `tleg.mjs`     | Camada de texto das aberturas (§45 — som nunca é canal único) | 21 |
| `tatlas.mjs`   | Atlas Estelar (§16), modo 3D e modo lista | 22 |
| `tmarca.mjs`   | Marca com alfa (§3) — a matemática, o recorte e o caminho de falha | 14 |
| `tcamada.mjs`  | Camada de sistema (§65.1) — assinatura de cada sistema, paletas, §36 | 18 |
| `t72.mjs`      | Estados vivos, Centro de Notificações, snooze, telemetria local, Libras, onboarding e Vista de Pátio (§72.1 · §69.6 · §60.3 · §65.4) | 71 |
| `tblueprint.mjs` | Blueprint Universal (§50) — parser, validador e os onze inválidos. **Sem navegador** | 64 |

`tblueprint.mjs` roda sozinha, sem servidor e sem Chromium:

```bash
node ferramentas/testes/tblueprint.mjs
```

Fora do navegador, dois verificadores em Python:

```bash
python3 ferramentas/verificar_assets.py              # sha256, formato, fundo dos oficiais
python3 ferramentas/verificar_daltonismo.py --tudo   # as seis paletas sob dicromacia
```
