#!/usr/bin/env bash
# Publica o repositório no bucket da pilha e invalida o cache do CloudFront.
#
#   ./infra/aws/publicar.sh <nome-da-pilha> [perfil-aws]
#
# O sync roda em duas passadas de propósito: os 13 oficiais são imutáveis por
# regra do repositório (preservados byte a byte, sha256 conferido) e levam
# cache de um ano; todo o resto revalida sempre.
set -euo pipefail

PILHA="${1:?uso: publicar.sh <nome-da-pilha> [perfil-aws]}"
PERFIL="${2:-}"
AWS=(aws)
[ -n "$PERFIL" ] && AWS+=(--profile "$PERFIL")

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RAIZ"

saida() {
  "${AWS[@]}" cloudformation describe-stacks --stack-name "$PILHA" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

BUCKET="$(saida Bucket)"
DIST="$(saida DistribuicaoId)"
ENDERECO="$(saida Endereco)"
[ -n "$BUCKET" ] || { echo "pilha '$PILHA' não encontrada"; exit 1; }

echo "→ bucket $BUCKET"

# Antes de publicar, conferir que os oficiais continuam intactos. Publicar um
# oficial alterado seria pior do que não publicar.
python3 ferramentas/verificar_assets.py >/dev/null

COMUNS=(--delete
  --exclude ".git/*" --exclude ".github/*" --exclude "node_modules/*"
  --exclude "__pycache__/*" --exclude "*.pyc" --exclude ".gitignore")

# 1) tudo, menos os oficiais — revalida sempre
"${AWS[@]}" s3 sync . "s3://$BUCKET" "${COMUNS[@]}" \
  --exclude "assets/oficiais/*" \
  --cache-control "public, max-age=0, must-revalidate"

# 2) os oficiais — imutáveis
"${AWS[@]}" s3 sync assets/oficiais "s3://$BUCKET/assets/oficiais" \
  --cache-control "public, max-age=31536000, immutable"

echo "→ invalidando o cache"
ID="$("${AWS[@]}" cloudfront create-invalidation --distribution-id "$DIST" \
      --paths "/*" --query 'Invalidation.Id' --output text)"
"${AWS[@]}" cloudfront wait invalidation-completed --distribution-id "$DIST" --id "$ID"

echo "→ no ar: $ENDERECO"
echo
echo "Para conferir o deploy com as mesmas 135 checagens:"
echo "    LUM_BASE=$ENDERECO node ferramentas/testes/rodar.mjs"
