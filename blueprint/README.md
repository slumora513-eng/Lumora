# Blueprint Universal — §50, passo 1

> **Decisão do Fundador em 30/08/2026 (§50):** *"fazer uma blueprint universal, pra AWS,
> Render e tudo mais"*.

A §50 define um produto: um arquivo declarativo único que provisiona a pilha inteira de um
**cliente** — banco, serviços, variáveis, integrações e recursos do plano — em qualquer destino
suportado, *"sem o cliente ver infraestrutura"*.

O roteiro da §50.5 tem seis passos. **Aqui está o passo 1, e só ele:**

> *"Especificação e parser do formato v1 + validador de schema (com exemplos de teste)."*

---

## Por que só o passo 1

Os passos 2 a 6 compilam a pilha de uma aplicação Lumora que **ainda não foi construída**.
Não há serviço para emitir em Terraform, não há migrations para viajar dentro do Blueprint,
não há estado remoto contra o qual detectar *drift*. Um `build` que emitisse Terraform para
nada seria pior do que a ausência: daria a impressão de que a §50 está de pé.

O passo 1 é diferente. Ele é **sobre o arquivo**, e o arquivo já pode existir por inteiro —
a §50.1 o publica completo. Por isso ele é construível hoje, e é o único que é.

`lumora-blueprint` reconhece `plan`, `build`, `apply` e `destroy`, e **recusa cada um com o
motivo e a seção**, saindo com código 3. Comando que não existe é diferente de comando que
existe e mente.

> **Isto não é `infra/`.** [`../infra/`](../infra/) publica *este repositório* — a identidade
> visual — como site estático em Render e AWS. É outro assunto e outro tamanho. A §50
> provisiona a **aplicação Lumora** para um cliente pagante.

---

## O formato

```
apiVersion: blueprint.lumora/v1
```

Cinco blocos. Os campos e o exemplo de referência são os da §50.1 —
[`exemplos/padaria-do-ze.yaml`](exemplos/padaria-do-ze.yaml) é a transcrição dele.

| Bloco | Obrigatório | Se faltar |
|---|---|---|
| `apiVersion` | sim | — |
| `metadata` | sim | — |
| `stack` | sim | — |
| `provedores` | não | o compilador usa a tabela de provedores ativos do Hub (§46/§50.3) |
| `recursos` | não | derivado do plano + add-ons (§27/§47/§50.3) |
| `seguranca` | não | **tudo ligado** — §37 diz que nasce ligada |

Os três opcionais não são frouxidão: a §50.3 diz literalmente que os recursos vêm do plano e
que os provedores vêm do Hub. Exigi-los no arquivo obrigaria a repetir no YAML o que o sistema
já sabe — e a §50.1 avisa que *"quem assina não escreve YAML"*.

### O subconjunto de YAML, e por que é um subconjunto

YAML inteiro tem âncoras, aliases, chaves de mesclagem, tags e escalares de bloco. São
recursos que fazem o **mesmo arquivo produzir árvores diferentes** conforme o leitor. A §50.3
exige idempotência total, com o compilador comparando estado desejado e existente: um formato
que não lê igual duas vezes não sustenta essa exigência.

Então tudo que sai do subconjunto é **erro explícito, com número de linha** — nunca
comportamento surpresa:

| Fora do formato | Motivo |
|---|---|
| `&âncora` e `*alias` | leitura deixa de ser determinística (§50.3) |
| `<<:` (mesclagem) | idem |
| `!tag` | idem |
| `\|` e `>` (escalares de bloco) | idem |
| `---` / `...` | um Blueprint por arquivo |
| chave repetida | não existe resposta certa para qual das duas vale |
| tabulação na indentação | ambiguidade clássica de YAML |

Dentro do subconjunto está o que a §50.1 usa: mapas aninhados, listas em bloco e em linha
(`[sefaz-sp]`), mapas em linha (`{ tier: "db.t4g.medium", storage_gb: 50 }`), aspas simples e
duplas, comentários, booleanos, inteiros e nulos.

---

## As regras que reprovam, e a seção de cada uma

O validador separa **erro** de **aviso** por uma regra só: **o Guia decide, o Hub edita.**

O que o Guia fixa é erro. O que a §46/§47 mandam manter editável no Hub *"sem novo deploy"* é
aviso — reprovar ali transformaria edição de catálogo em release de código.

| Código | Reprova quando | Seção |
|---|---|---|
| `api-version` | `apiVersion` não é exatamente `blueprint.lumora/v1` | §50.1 |
| `bloco-obrigatorio` · `campo-obrigatorio` | falta bloco ou campo que não tem derivação | §50.1 |
| `bloco-desconhecido` | bloco de primeiro nível que não é do formato | §50.1 |
| `tipo` · `formato` · `faixa` | tipo errado, `tenant_id`/`moeda`/`idioma` malformado, número fora da faixa | §50.1/§50.3 |
| `plano-desconhecido` | plano fora da matriz da §27 | §27 |
| **`hub-nao-e-produto`** | **plano `hub-*`** | **§17/§34** |
| `addon-quantidade` | add-on que não é inteiro ≥ 1 | §47 |
| `destino-desconhecido` | destino fora dos cinco da v1 | §50.2 |
| `regiao-obrigatoria` · `regiao-em-self-host` | região faltando em nuvem, ou sobrando em `docker` | §50.2 |
| **`seguranca-desligada`** | **`mfa`, `criptografia_repouso` ou `backup_imutavel` em `false`** | **§37** |
| `auditoria-mutavel` | `logs_auditoria` diferente de `append-only` | §37/§50.3 |
| **`segredo-no-yaml`** | **qualquer segredo por valor, em qualquer lugar da árvore** | **§50.3/§37** |
| `sintaxe` | tudo que sai do subconjunto acima | §50.1 |

Três delas merecem nota, porque são as que fazem o validador ser da Lumora e não genérico:

**`hub-nao-e-produto`.** §17 é incontornável: *"O Lumora Hub não é público. O Hub é usado
exclusivamente pela equipe Lumora."* Um Blueprint provisiona a pilha de um **cliente**.
Não existe cliente do Hub, logo não existe Blueprint de Hub — e o validador diz isso em vez
de aceitar `hub-p2` como se fosse um plano qualquer que faltou no catálogo.

**`seguranca-desligada`.** §50.1 comenta o bloco com *"§37 — nasce ligada, nunca opcional"*.
Se nunca é opcional, `mfa: false` não é uma preferência do cliente: é um arquivo inválido.
Omitir o bloco inteiro é válido (vale tudo ligado); **desligar explicitamente não é.**

**`segredo-no-yaml`.** §50.3: *"Segredos nunca no YAML (…) o Blueprint referencia segredos por
nome (`secret: payments/asaas`), nunca por valor."* A varredura é da árvore inteira, por dois
caminhos: **pelo nome da chave** (`senha`, `token`, `api_key`, `certificado`, `chave`,
`private_key`…) e **pela forma do valor** (chave privada PEM, certificado, `sk_live_…`,
`ghp_…`, `AKIA…`, JWT, hex ou base64 longos). A única forma aceita de citar um segredo é
`secret: familia/nome`.

### Avisos (não reprovam)

`bloco-derivado` (o compilador preenche) · `addon-fora-do-catalogo` e `provedor-fora-da-tabela`
(§46/§47 — o catálogo vivo é o do Hub) · `comunidade-omitida` (§16, opt-in) ·
`open-finance-pendente` (§25 — só ativa com mTLS/ICP-Brasil) · `sefaz-nao-substituida` (§22 —
§50.4 é explícita: o Blueprint **não** substitui a homologação) · `destino-fase-2` (GCP, §50.2)
· `tamanho-fora-da-escala`.

---

## Uso

```bash
node blueprint/lumora-blueprint.mjs validar blueprint/exemplos/*.yaml
node blueprint/lumora-blueprint.mjs esquema        # planos, destinos e regras
node blueprint/lumora-blueprint.mjs ajuda
```

Códigos de saída: `0` válido · `1` erro de validação · `2` uso incorreto ·
`3` comando da §50 ainda não construído.

Como biblioteca:

```js
import { validar, formatar } from './blueprint/validador.mjs';
const r = validar(texto);          // { ok, erros[], avisos[] }
console.log(formatar(r, arquivo)); // cada achado com linha e seção do Guia
```

Cada achado é `{ codigo, caminho, linha, mensagem, secao }` — a `secao` existe para que
nenhuma regra deste validador seja opinião: ou está no Guia, ou não está aqui.

**Zero dependência**, como o resto do repositório. O parser é `yaml.mjs`, escrito para este
subconjunto.

## Exemplos

| Arquivo | O que demonstra |
|---|---|
| [`exemplos/padaria-do-ze.yaml`](exemplos/padaria-do-ze.yaml) | o exemplo de referência da §50.1, transcrito |
| [`exemplos/rota-mvp-render.yaml`](exemplos/rota-mvp-render.yaml) | Render como MVP, com `recursos` e `seguranca` **omitidos** |
| [`exemplos/ecossistema-selfhost.yaml`](exemplos/ecossistema-selfhost.yaml) | `docker` self-host, sem região, com add-ons de §47 |
| [`exemplos/invalidos/`](exemplos/invalidos/) | onze arquivos, um por regra que reprova |

Os inválidos não são enfeite: `ferramentas/testes/tblueprint.mjs` **exige que cada um reprove
pelo código previsto** e que nenhum arquivo do diretório fique sem expectativa declarada. Um
validador que só é testado com arquivos bons não é testado.

```bash
node ferramentas/testes/tblueprint.mjs      # sozinha, sem navegador
node ferramentas/testes/rodar.mjs           # junto das demais suítes
```

---

## O que este passo NÃO faz

Além dos passos 2–6 da §50.5, os limites explícitos da §50.4 continuam valendo e o validador
os repete como aviso quando encontra o campo correspondente:

- **não substitui a homologação SEFAZ (§22) nem as credenciais Open Finance (§25)** — quando
  essas pendências forem resolvidas, o Blueprint passa a incluí-las automaticamente;
- **não decide preço nem plano** — só consome as decisões das §27 e §47;
- **não é visível ao cliente final** — ele vê *"Configurando o seu sistema…"*, com a animação
  do slot `loading.otimizar` (§49), que existe em [`../runtime/animacoes.js`](../runtime/animacoes.js);
- **não cobra nada** — é funcionalidade interna, não add-on vendável na v1.

E as regras de execução da §50.3 que dependem de um compilador — idempotência, `plan`
obrigatório antes de `apply`, confirmação humana, rollback em falha, auditoria append-only de
cada execução, destruição protegida com retenção de 30 dias — **não existem ainda**, porque
não existe execução. Elas estão registradas aqui para que o passo 2 não precise redescobri-las.

---

## Defaults do agente

Conforme a regra 22. Nenhum é decisão do Fundador.

- **(DEFAULT DO AGENTE — a §50.1 exemplifica `tamanho: medium` e não enumera a escala.)**
  `small | medium | large`, e valor fora disso é **aviso**, não erro.
- **(DEFAULT DO AGENTE — a §50.1 mostra `tenant_id: "t_9f3ac1"` e não publica a regra.)**
  O formato conferido é `t_` seguido de 6+ caracteres alfanuméricos minúsculos.
- **(DEFAULT DO AGENTE — o Guia não lista quais chaves denunciam segredo.)** A lista de nomes
  e de formas de valor de `esquema.mjs` é deste agente. A **regra** é da §50.3; o **detector**
  é default.
- **(DEFAULT DO AGENTE — o Guia não diz o que fazer com catálogo desconhecido.)** Add-on ou
  família de provedor fora das listas vira aviso, nunca erro, porque §47 e §46 exigem que
  esses catálogos sejam editáveis no Hub sem novo deploy.
- **(DEFAULT DO AGENTE — a §50.5 não diz o que o CLI faz com os comandos ainda não
  construídos.)** Recusar com motivo e sair com 3, em vez de omitir o comando.

---

*Fonte: Lumora — Guia de Referência Completo, Especificação de Referência v3, §50 (Adendo
v5.3, 30/08/2026), páginas 28–30.*
