#!/usr/bin/env node
/* ==========================================================================
   lumora-blueprint — §50, passo 1 da §50.5 e só ele.

   O que existe aqui:  validar   (parser + validador de schema)
   O que NÃO existe:   plan / build / apply / destroy

   Isso não é lacuna: os passos 2–6 da §50.5 compilam a pilha de uma aplicação
   Lumora que ainda não foi construída. Um `build` que emitisse Terraform para
   nada seria pior que a ausência — daria a impressão de que a §50 está de pé.
   Por isso o comando existe, é reconhecido, e RECUSA com o motivo.
   ========================================================================== */

'use strict';

import { readFileSync } from 'node:fs';
import { validar, formatar } from './validador.mjs';
import { API_VERSION, PLANOS, DESTINOS, BLOCOS } from './esquema.mjs';

const NAO_IMPLEMENTADOS = {
  plan:    ['§50.5 passo 2–3', 'dry-run do delta contra o estado existente'],
  build:   ['§50.5 passo 2–3', 'emissão de Terraform (AWS) / render.yaml / docker-compose'],
  apply:   ['§50.5 passo 2–3', 'aplicação do delta com rollback'],
  destroy: ['§50.3',           'destruição protegida, com dupla confirmação e retenção de 30 dias'],
};

const USO = `lumora-blueprint — validador do ${API_VERSION}

  lumora-blueprint validar <arquivo.yaml> [...]   valida um ou mais Blueprints
  lumora-blueprint esquema                        imprime o que o formato aceita
  lumora-blueprint ajuda

Saída: 0 tudo válido · 1 algum erro de validação · 2 uso incorreto
       3 comando reconhecido pela §50 mas ainda não construído`;

function esquema() {
  const l = [];
  l.push(`apiVersion: ${API_VERSION}`);
  l.push('');
  l.push('Blocos:');
  for (const [nome, r] of Object.entries(BLOCOS)) {
    l.push(`  ${nome.padEnd(11)} ${r.obrigatorio ? 'obrigatório' : `opcional — deriva de ${r.derivavel}`}`);
  }
  l.push('');
  l.push('Planos (§27, identificador técnico interno):');
  for (const [id, p] of Object.entries(PLANOS)) l.push(`  ${id.padEnd(16)} ${p.sistema} · ${p.nome}`);
  l.push('');
  l.push('Destinos (§50.2):');
  for (const [id, d] of Object.entries(DESTINOS)) l.push(`  ${id.padEnd(13)} ${d.obs}`);
  l.push('');
  l.push('Regras que reprovam, e a seção de cada uma:');
  l.push('  §50.3  segredo por valor no YAML — só referência `secret: familia/nome`');
  l.push('  §37    segurança nasce ligada: mfa, criptografia_repouso, backup_imutavel');
  l.push('  §37    logs_auditoria é append-only');
  l.push('  §17/34 o Lumora Hub é interno e nunca é plano de cliente');
  l.push('  §27    plano fora da matriz oficial');
  l.push('  §50.2  destino fora da v1, ou região faltando/sobrando');
  l.push('  §50.3  chave repetida, âncora, alias — leitura precisa ser determinística');
  return l.join('\n');
}

const [, , comando, ...resto] = process.argv;

if (!comando || comando === 'ajuda' || comando === '--help' || comando === '-h') {
  console.log(USO);
  process.exit(comando ? 0 : 2);
}

if (comando === 'esquema') { console.log(esquema()); process.exit(0); }

if (comando in NAO_IMPLEMENTADOS) {
  const [passo, oque] = NAO_IMPLEMENTADOS[comando];
  console.error(
    `"${comando}" é comando da §50 e ainda não foi construído (${passo}: ${oque}).\n` +
    'Motivo: os compiladores provisionam a pilha da aplicação Lumora, que não existe neste\n' +
    'repositório. Deste roteiro só o passo 1 — formato, parser e validador — é construível\n' +
    'antes dela. Ver blueprint/README.md.');
  process.exit(3);
}

if (comando !== 'validar') { console.error(`comando desconhecido: ${comando}\n\n${USO}`); process.exit(2); }
if (!resto.length) { console.error(`validar precisa de ao menos um arquivo.\n\n${USO}`); process.exit(2); }

let falhou = false;
for (const arquivo of resto) {
  let texto;
  try { texto = readFileSync(arquivo, 'utf8'); }
  catch { console.error(`ERRO   ${arquivo}  não consegui ler o arquivo`); falhou = true; continue; }
  const r = validar(texto);
  console.log(formatar(r, arquivo));
  if (!r.ok) falhou = true;
}
process.exit(falhou ? 1 : 0);
