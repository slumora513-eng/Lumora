# Blueprint Universal — §50

> **Decisão do Fundador em 30/08/2026 (§50):** *"fazer uma blueprint universal, pra AWS,
> Render e tudo mais"*.

A §50 define um produto: um arquivo declarativo único que provisiona a pilha inteira de um
**cliente** — banco, serviços, variáveis, integrações e recursos do plano — em qualquer destino
suportado, *"sem o cliente ver infraestrutura"*.

O roteiro da §50.5 tem seis passos. **Três estão construídos:**

| Passo | O que é | Estado |
|---|---|---|
| **1** | *"Especificação e parser do formato v1 + validador de schema (com exemplos de teste)"* | ✅ `yaml.mjs` · `esquema.mjs` · `validador.mjs` |
| **2** | *"Compilador para Render (MVP) com plan/apply/idempotência"* | ✅ `compilador/render.mjs` |
| **3** | *"Compilador para AWS (produção) com Terraform"* | ✅ `compilador/aws.mjs` |
| 4 | Saída Docker self-host | ⏳ recusado com o motivo |
| 5 | Botão "Aplicar Blueprint" no Hub | ⏳ depende do Hub |
| 6 | DigitalOcean e GCP | ⏳ recusado com o motivo |

```bash
node blueprint/lumora-blueprint.mjs plan  meu-cliente.yaml --saida ./saida
node blueprint/lumora-blueprint.mjs build meu-cliente.yaml --saida ./saida --imagem registry/lumora:1.4.2
```

---

## O que os passos 2 e 3 fazem, e onde eles param

Fazem o que a §50.2 descreve: **"um compilador único lê o YAML e emite a saída nativa de cada
destino"**, com **"mesma entrada, saídas equivalentes"**.

| Destino | Saída | Banco |
|---|---|---|
| **render** | `render.yaml` nativo — `envVarGroups` + `services` (web, worker, keyvalue, cron) + `databases` | Render PostgreSQL |
| **aws** | `main.tf.json` — Terraform nativo em sintaxe JSON: RDS, ECS, S3, CloudFront, SQS, WAF, Secrets Manager, AWS Backup | RDS Postgres gerenciado |

**Onde eles param: `apply` e `destroy`.** Emitir o arquivo é uma coisa; criar recurso numa
conta de nuvem é outra, e precisa de credencial e de uma aplicação Lumora para subir — que
ainda não existe. Os dois comandos são reconhecidos e **recusados com o motivo**, saindo com
código 3. Comando que não existe é diferente de comando que existe e mente.

A mesma honestidade vale para o artefato da aplicação. Ele **não é dado do tenant** — é
constante da plataforma, e a plataforma não foi construída. Sem `--imagem` (ou `LUMORA_IMAGEM`)
a saída carrega `LUMORA_IMAGEM_NAO_DEFINIDA` e o `plan` a reporta como **BLOQUEIO**: é um plano
legítimo e deliberadamente inaplicável, em vez de um arquivo que sobe um contêiner inexistente.

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

## O compilador: uma tradução, dois emissores

A §50.2 promete **"mesma entrada, saídas equivalentes"**. Isso só é verdade se a derivação de
recursos acontecer **uma vez**, antes dos emissores — senão "equivalente" vira coincidência
que um dia deixa de acontecer.

```
Blueprint  →  validador  →  plano de recursos  →  render.mjs  →  render.yaml
   .yaml       (§50.1)         (plano.mjs)      └→  aws.mjs    →  main.tf.json
```

`plano.mjs` **é** a tabela de tradução que a §50.3 descreve: *"plano define o tier base; cada
add-on do §47 soma recursos"*. Ela mora num arquivo só justamente porque a mesma §47 manda
mantê-la editável no Hub *"sem novo deploy"* — trocar a tabela não toca em emissor nenhum.

Os três efeitos de add-on que o Guia nomeia estão implementados literalmente: *filial extra →
schema lógico adicional*, *recarga Aurora → cota de tokens*, *armazenamento extra → +10 GB por
bloco*. Os add-ons de operação (veículo, entregador, usuário) somam **limite**, não
infraestrutura — mudam o que o plano permite, não o que a nuvem provisiona.

O único ponto de referência numérico que o Guia publica é o `business-p2` da §50.1 (2 réplicas,
`db.t4g.medium`/50 GB, `cache.t4g.micro`, 20 GB, 2 workers). A suíte exige que ele resolva
exatamente nesses números — se a tabela se afastar dele, o teste quebra.

### O que o compilador carrega sem ninguém pedir

Estas não são escolhas do emissor: são decisões do Fundador registradas no **"Status de
projeto — 01/09/2026"**, e o compilador as emite porque elas já foram tomadas.

| Decisão | O que sai no Terraform |
|---|---|
| **3 — região** *"produção em sa-east-1 (São Paulo), dados de clientes no Brasil (LGPD)"* | `provider aws { region = "sa-east-1" }`; outra região vira **aviso** citando LGPD |
| **1 — borda** *"CloudFront + AWS WAF (regras gerenciadas) + Shield Standard no dia 1"* | `aws_wafv2_web_acl` com 4 grupos gerenciados, escopo `CLOUDFRONT`, ligado à distribuição. Shield Standard não é recurso — vem ligado e sem custo |
| **2 — segredos** *"rotação (90 dias API, 30 dias banco); IAM roles; **nenhum segredo em variável de ambiente na produção**"* | `aws_secretsmanager_secret_rotation` com 90/30; no ECS, segredo entra em `secrets`/`valueFrom` e **nunca** em `environment` |
| **6 — backup** *"diário retido 7 dias + semanal retido 30; imutável anti-ransomware; RPO ≤ 24h / RTO ≤ 4h"* | `backup_retention_period = 7`, `aws_backup_plan` com duas regras e `aws_backup_vault_lock_configuration` — o Vault Lock **é** a imutabilidade |
| **§50.3 — destruição protegida** | `deletion_protection`, `prevent_destroy`, `skip_final_snapshot = false`, `recovery_window_in_days = 30` |

A última linha da decisão 2 é a que mais muda o código emitido, e é a mais fácil de violar sem
perceber: `environment` e `secrets` são dois campos da mesma definição de contêiner. A suíte
confere os dois separadamente.

### E o aviso que todo Blueprint de Render recebe

O Render **não tem região na América do Sul**. Isso não cabe junto com a decisão 3 — e é
exatamente por isso que o mesmo registro de 01/09/2026 diz: *"Render = ambiente de testes
(staging) (…) dados descartáveis, disco efêmero, **sem dados de cliente**"*. O emissor repete
isso em todo `render.yaml` que produz, no cabeçalho e no relatório, em vez de deixar alguém
descobrir depois.

### Idempotência e dry-run (§50.3)

> *"Aplicar o mesmo Blueprint duas vezes não cria nada duplicado."*
> *"`plan` sempre mostra o que será criado/alterado/destruído ANTES de aplicar."*

- **A saída é determinística.** Mesma entrada → bytes idênticos. Nada de data, hora, aleatório
  ou ordem de iteração instável; add-ons e segredos saem ordenados, para que a ordem em que
  alguém escreveu o YAML não mude o resultado.
- **`plan` não escreve nada.** Compara o estado desejado com `.lumora-blueprint-estado.json`
  na pasta de saída e lista `+ criar`, `~ alterar`, `- destruir`, recurso a recurso.
- **Destruir exige confirmação humana.** `build` que apagaria um recurso existente **recusa**
  sem `--confirmar` — a "confirmação humana" que a §50.3 exige.

> **O limite honesto disto:** o estado comparado é o dos **artefatos**, não o da nuvem.
> *Drift detection* de verdade exige credencial e `terraform state`, e é trabalho do `apply`,
> que não existe. O que existe é a metade que dá para fazer sem nuvem — e ela já responde
> "o que muda se eu compilar isto?" antes de qualquer coisa acontecer.

---

## Uso

```bash
node blueprint/lumora-blueprint.mjs validar blueprint/exemplos/*.yaml
node blueprint/lumora-blueprint.mjs plan    cliente.yaml --saida ./saida
node blueprint/lumora-blueprint.mjs build   cliente.yaml --saida ./saida --imagem registry/lumora:1.4.2
node blueprint/lumora-blueprint.mjs esquema        # planos, destinos e regras
node blueprint/lumora-blueprint.mjs ajuda
```

| Opção | Para quê |
|---|---|
| `--saida <dir>` | onde os artefatos e o estado são lidos e escritos |
| `--imagem <ref>` | o artefato da aplicação Lumora (ou a variável `LUMORA_IMAGEM`) |
| `--confirmar` | autoriza destruir recurso que existia antes (§50.3) |

Códigos de saída: `0` tudo certo · `1` erro de validação ou compilação · `2` uso incorreto ·
`3` comando da §50 ainda não construído.

Como biblioteca:

```js
import { validar, formatar } from './blueprint/validador.mjs';
const r = validar(texto);          // { ok, erros[], avisos[] }
console.log(formatar(r, arquivo)); // cada achado com linha e seção do Guia

import { planejar, emitir } from './blueprint/compilador/index.mjs';
const p = planejar(texto, { saida: './saida' });   // { delta, bloqueios, arquivos, … }
emitir(texto, { saida: './saida', imagem: 'registry/lumora:1.4.2' });
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
| [`exemplos/ecossistema-selfhost.yaml`](exemplos/ecossistema-selfhost.yaml) | `docker` self-host, sem região, com add-ons de §47. **Válido, e não compilável** — o emissor de docker é o passo 4 |
| [`exemplos/invalidos/`](exemplos/invalidos/) | onze arquivos, um por regra que reprova |

Os inválidos não são enfeite: `ferramentas/testes/tblueprint.mjs` **exige que cada um reprove
pelo código previsto** e que nenhum arquivo do diretório fique sem expectativa declarada. Um
validador que só é testado com arquivos bons não é testado.

```bash
node ferramentas/testes/tblueprint.mjs      # formato e validador — 62 checagens
node ferramentas/testes/tcompilador.mjs     # compilador — 74 checagens
node ferramentas/testes/rodar.mjs           # junto das demais suítes
```

As duas rodam **sem navegador e sem servidor**: o Blueprint é arquivo entrando e arquivo
saindo. `tcompilador.mjs` compila de verdade em diretório temporário e confere o que saiu —
que `plan` não escreve nada, que a segunda emissão produz bytes idênticos, que tirar um
provedor aparece como `destruir` e que o `build` recusa isso sem `--confirmar`.

---

## O que ainda NÃO existe

**`apply` e `destroy`.** Provisionar de verdade exige credencial de nuvem e uma aplicação
Lumora para subir. Com eles ficam de fora as regras da §50.3 que só existem em execução:
rollback em falha, auditoria append-only de cada `plan`/`apply`/`destroy`, e a dupla
confirmação do `destroy`. Ficam registradas aqui para que quem construir o passo seguinte não
precise redescobri-las.

**Os passos 4, 5 e 6.** Docker self-host, o botão no Hub e DigitalOcean/GCP. Os destinos são
reconhecidos pelo formato e o compilador **recusa nomeando o passo** — um Blueprint com
`destino: docker` não emite "quase certo", ele para e diz que o emissor é o passo 4.

**O artefato da aplicação.** Sem `--imagem`, a saída sai marcada e o `plan` reporta bloqueio.

Os limites explícitos da §50.4 continuam valendo, e o validador os repete como aviso quando
encontra o campo correspondente:

- **não substitui a homologação SEFAZ (§22) nem as credenciais Open Finance (§25)** — quando
  essas pendências forem resolvidas, o Blueprint passa a incluí-las automaticamente;
- **não decide preço nem plano** — só consome as decisões das §27 e §47;
- **não é visível ao cliente final** — ele vê *"Configurando o seu sistema…"*, com a animação
  do slot `loading.otimizar` (§49), que existe em [`../runtime/animacoes.js`](../runtime/animacoes.js);
- **não cobra nada** — é funcionalidade interna, não add-on vendável na v1.


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

- **(DEFAULT DO AGENTE — a §50.1 publica UM ponto de referência de recursos, o `business-p2`.)**
  As outras nove linhas de `RECURSOS_POR_PLANO` são extrapolação deste agente, ancoradas nos
  limites de usuários e veículos que a §27 registra por plano. **A linha `business-p2` não é
  default:** ela é a da §50.1, verbatim, e a suíte a trava.

- **(DEFAULT DO AGENTE — a §50.2 diz "render.yaml nativo" e "Terraform", sem mapear tamanho
  para plano de instância.)** As escalas `starter/standard/pro/pro plus` (Render) e
  `db.t4g.small…db.r7g.xlarge` (RDS) são deste agente. Os dois valores do `business-p2` —
  `db.t4g.medium` e `cache.t4g.micro` — vêm da §50.1.

- **(DEFAULT DO AGENTE — a §50.2 pede "cron" na saída do Render e não diz qual.)** O cron
  emitido é a verificação diária de backup, que existe porque a política de 01/09/2026 exige
  backup diário com RPO ≤ 24h. Não é rotina de produto.

- **(DEFAULT DO AGENTE — o Guia não define como referenciar um segredo por nome além do
  exemplo `secret: payments/asaas`.)** Os nomes derivados seguem `familia/provedor`, e o banco
  ganha `banco/<tenant_id>`. **A regra não é default:** segredo nunca por valor é §50.3.

- **(DEFAULT DO AGENTE — o Guia não diz o que fazer sem o artefato da aplicação.)** Emitir o
  sentinela `LUMORA_IMAGEM_NAO_DEFINIDA` e reportar bloqueio, em vez de inventar uma imagem ou
  de recusar a compilação inteira.

---

*Fonte: Lumora — Guia de Referência Completo, Especificação de Referência v3, §50 (Adendo
v5.3, 30/08/2026), páginas 28–30.*
