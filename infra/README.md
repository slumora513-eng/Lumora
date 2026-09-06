# Blueprints de publicação

Dois caminhos para pôr este repositório no ar como site estático:

| | Arquivo | Quando faz sentido |
|---|---|---|
| **Render** | [`../render.yaml`](../render.yaml) | Um comando, previews por PR, zero infraestrutura para cuidar |
| **AWS** | [`aws/lumora-site.yaml`](aws/lumora-site.yaml) | Domínio próprio, controle de cache fino, bucket privado, conta da empresa |

Os dois servem **o repositório como está**. Não há build porque não há dependência:
a §65.5 exige *"custo zero — nenhuma rede, nenhuma dependência"*, e o runtime é
ES modules + CSS servidos direto.

---

## A decisão que vale para os dois: o CSP

O cabeçalho mais importante não é de segurança genérica — é de identidade:

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self'; connect-src 'self';
base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'
```

O "custo zero" da §65.5 era, até aqui, uma **convenção**: o código não fazia pedidos
externos porque quem escreveu tomou cuidado. Com este CSP vira **garantia**: o navegador
recusa qualquer pedido para fora, tenha o código pedido de propósito ou por acidente.

**Verificado, não suposto.** Servindo o site com e sem os cabeçalhos e escutando
`securitypolicyviolation`:

| | `fetch` externo | `<img>` externo | `<script>` de CDN |
|---|---|---|---|
| **com** o CSP | bloqueado por `connect-src` | bloqueado por `img-src` | bloqueado por `script-src-elem` |
| **sem** o CSP | nenhuma violação registrada | nenhuma | nenhuma |

E as **135 checagens do runtime passam inteiras** sob exatamente estes cabeçalhos.

### Três detalhes que parecem exagero e não são

- **`img-src` precisa de `data:`.** `marca-com-alfa.js` entrega a L canônica como data URL
  gerada em memória (`ESCALACOES.md` §3). Sem `data:` a marca não aparece — **e falha em
  silêncio**, que é o pior jeito de falhar.

- **`microphone=(self)`, nunca `microphone=()`.** Os Comandos de Voz da §68 usam
  `SpeechRecognition`. Bloquear o microfone no `Permissions-Policy` desligaria uma feature
  de acessibilidade sem que ninguém percebesse.

- **`script-src 'self'` sem `'unsafe-inline'` só funciona** porque o script da bancada mora
  em `runtime/verificacao.js`, e não embutido no HTML. Se alguém devolver o script para
  dentro da página, a bancada quebra em produção e passa no desenvolvimento.

`style-src` mantém `'unsafe-inline'`: a bancada usa atributos `style=""`. Estilo injetado é
um risco muito menor que script, e a alternativa (nonce por resposta) exige servidor
dinâmico — que este site não tem e não quer.

---

## Cache

| Caminho | Política | Por quê |
|---|---|---|
| `assets/oficiais/*` | `max-age=31536000, immutable` | Os 13 oficiais são **imutáveis por regra**: preservados byte a byte, sha256 conferido. Nunca mudam sem virar outro arquivo |
| todo o resto | `max-age=0, must-revalidate` | Serve do cache enquanto não mudou, mas nunca serve versão velha |

Na AWS os oficiais também saem de `Compress`: são JPEG, já comprimidos — gzip por cima só
gasta CPU dos dois lados.

---

## Render

```bash
# dashboard.render.com → New → Blueprint → apontar para o repositório
```

O `render.yaml` já traz serviço, cabeçalhos e cache. `pullRequestPreviewsEnabled` dá um
ambiente por PR, o que é útil justamente para revisar mudança de identidade antes de mesclar.

**Atenção:** o Render publica a pasta inteira, então `docs/`, `ferramentas/` e `ESCALACOES.md`
ficam acessíveis. Para este repositório isso é intencional — é material de referência de marca,
e o `index.html` linka para ele. Se um dia precisar ser privado, é o Render que resolve
(autenticação no serviço), não o blueprint.

---

## AWS

Bucket **privado** (nunca público) + CloudFront com Origin Access Control. Só a distribuição
lê o bucket, e a política do bucket amarra isso ao ARN daquela distribuição específica.

```bash
# 1. criar a pilha
aws cloudformation deploy \
  --template-file infra/aws/lumora-site.yaml \
  --stack-name lumora-identidade \
  --parameter-overrides NomeDoBucket=SEU-BUCKET-UNICO

# 2. publicar o conteúdo (confere os oficiais antes, sincroniza, invalida o cache)
./infra/aws/publicar.sh lumora-identidade
```

Com domínio próprio, o certificado ACM **precisa estar em us-east-1** — CloudFront não aceita
outra região:

```bash
aws cloudformation deploy ... --parameter-overrides \
  NomeDoBucket=SEU-BUCKET-UNICO \
  Dominio=identidade.exemplo.com \
  CertificadoArn=arn:aws:acm:us-east-1:...:certificate/...
```

O bucket tem `DeletionPolicy: Retain` e versionamento ligado. Os dois protegem a mesma coisa:
um `delete-stack` distraído ou um upload errado não podem levar a biblioteca oficial junto.

---

## Conferir o que subiu

As mesmas suítes rodam contra a URL publicada:

```bash
LUM_BASE=https://seu-endereco node ferramentas/testes/rodar.mjs
```

Isso testa o **deploy**, não só o código: cabeçalhos errados, MIME type quebrado ou arquivo
faltando aparecem como falha.

### O detalhe que não pode ser "corrigido"

Os 13 oficiais são **JPEG com extensão `.png`** (`assets/oficiais/MANIFESTO.md`). O S3 e o
Render vão declará-los como `image/png`, que é o tipo errado — e **está tudo bem**: navegador
decodifica imagem por conteúdo, não pelo cabeçalho. Testado com `X-Content-Type-Options:
nosniff` ligado; a extração de alfa da L canônica continua funcionando.

**Não renomeie os arquivos para `.jpg` para "arrumar" isso.** Os nomes são os do MANIFESTO e
da verificação de integridade; renomear quebra a rastreabilidade sem ganhar nada.
