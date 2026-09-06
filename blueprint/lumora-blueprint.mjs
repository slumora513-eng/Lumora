#!/usr/bin/env node
/* ==========================================================================
   lumora-blueprint — §50

   Construído do roteiro da §50.5:
     passo 1  especificação, parser e validador          →  validar
     passo 2  compilador para Render                     →  plan / build
     passo 3  compilador para AWS (Terraform)            →  plan / build

   Ainda NÃO construído, e recusado com o motivo em vez de simulado:
     passo 4  saída Docker self-host
     passo 6  DigitalOcean e GCP
     apply / destroy — provisionam de verdade, e provisionar exige credencial
     de nuvem e uma aplicação Lumora que ainda não existe.

   §50.3 manda a ordem: `plan` SEMPRE mostra o que será criado, alterado e
   destruído antes de qualquer coisa acontecer. `build` mostra o mesmo plano e
   só destrói recurso com --confirmar, que é a confirmação humana que a mesma
   seção exige.
   ========================================================================== */

'use strict';

import { readFileSync } from 'node:fs';
import { validar, formatar } from './validador.mjs';
import { API_VERSION, PLANOS, DESTINOS as DESTINOS_DO_FORMATO, BLOCOS } from './esquema.mjs';
import { planejar, emitir, DESTINOS, DESTINOS_PENDENTES } from './compilador/index.mjs';
import { IMAGEM_SENTINELA, REGIAO_DE_PRODUCAO, BACKUP, ROTACAO_DIAS } from './compilador/plataforma.mjs';

const NAO_IMPLEMENTADOS = {
  apply: ['§50.3', 'aplicação do delta com rollback — exige credencial de nuvem e a aplicação Lumora'],
  destroy: ['§50.3', 'destruição protegida, com dupla confirmação e retenção de 30 dias'],
};

const USO = `lumora-blueprint — formato e compilador do ${API_VERSION}

  validar <arquivo.yaml> [...]         valida um ou mais Blueprints
  plan    <arquivo.yaml> [opções]      dry-run: o que será criado/alterado/destruído
  build   <arquivo.yaml> [opções]      emite a saída nativa do destino declarado
  esquema                              imprime o que o formato aceita
  ajuda

Opções de plan/build
  --saida <dir>      onde os artefatos são lidos/escritos (padrão: ./saida-blueprint)
  --imagem <ref>     artefato da aplicação Lumora (ou a variável LUMORA_IMAGEM)
  --confirmar        autoriza destruir recurso que existia antes (§50.3)

Destinos com emissor construído: ${Object.keys(DESTINOS).join(', ')}
Destinos ainda sem emissor:      ${Object.keys(DESTINOS_PENDENTES).join(', ')}

Saída: 0 tudo certo · 1 erro de validação ou compilação · 2 uso incorreto
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
  for (const [id, d] of Object.entries(DESTINOS_DO_FORMATO)) {
    const estado = DESTINOS[id] ? 'emissor construído' : `emissor pendente (${DESTINOS_PENDENTES[id]?.[0] || '§50.5'})`;
    l.push(`  ${id.padEnd(13)} ${d.obs}  —  ${estado}`);
  }
  l.push('');
  l.push('Regras que reprovam, e a seção de cada uma:');
  l.push('  §50.3  segredo por valor no YAML — só referência `secret: familia/nome`');
  l.push('  §37    segurança nasce ligada: mfa, criptografia_repouso, backup_imutavel');
  l.push('  §37    logs_auditoria é append-only');
  l.push('  §17/34 o Lumora Hub é interno e nunca é plano de cliente');
  l.push('  §27    plano fora da matriz oficial');
  l.push('  §50.2  destino fora da v1, ou região faltando/sobrando');
  l.push('  §50.3  chave repetida, âncora, alias — leitura precisa ser determinística');
  l.push('');
  l.push('Decisões que o compilador carrega (Status de projeto, 01/09/2026):');
  l.push(`  produção em ${REGIAO_DE_PRODUCAO}, dados de clientes no Brasil (LGPD)`);
  l.push(`  backup diário ${BACKUP.diarioRetencaoDias} dias + semanal ${BACKUP.semanalRetencaoDias}, imutável`);
  l.push(`  rotação de segredos: ${ROTACAO_DIAS.api} dias (API) e ${ROTACAO_DIAS.banco} dias (banco)`);
  l.push('  nenhum segredo em variável de ambiente na produção');
  return l.join('\n');
}

/* ------------------------------------------------------------ argumentos */

function opcoesDe(args) {
  const o = { saida: 'saida-blueprint' };
  const livres = [];
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--confirmar') o.confirmar = true;
    else if (a === '--saida') o.saida = args[++i];
    else if (a === '--imagem') o.imagem = args[++i];
    else if (a.startsWith('--')) { console.error(`opção desconhecida: ${a}`); process.exit(2); }
    else livres.push(a);
  }
  return { o, livres };
}

const ler = (arquivo) => {
  try { return readFileSync(arquivo, 'utf8'); }
  catch { console.error(`ERRO   ${arquivo}  não consegui ler o arquivo`); process.exit(1); }
};

function relatarAchados(r) {
  for (const e of r.erros || []) {
    console.error(`ERRO   ${e.linha ? `linha ${e.linha}  ` : ''}[${e.codigo}] ${e.mensagem}  (${e.secao})`);
  }
  for (const a of r.avisos || []) {
    console.log(`aviso  ${a.linha ? `linha ${a.linha}  ` : ''}[${a.codigo}] ${a.mensagem}  (${a.secao})`);
  }
}

function relatarPlano(p, arquivo) {
  console.log(`\n${arquivo} → ${p.destino}  ·  tenant ${p.plano.tenant.id}  ·  plano ${p.plano.plano.id}`
    + `  ·  ambiente ${p.plano.stack.ambiente}`);
  relatarAchados(p);

  const { criar, alterar, destruir, arquivosNovos, arquivosMudados, semMudanca } = p.delta;
  console.log('');
  if (p.primeiraVez) console.log('Nenhum estado anterior nesta saída: tudo é criação.');
  if (semMudanca) {
    console.log('Sem mudança: o estado desejado já é o existente.');
    console.log('§50.3 — idempotência total: aplicar de novo não cria nada duplicado.');
  }
  for (const r of criar) console.log(`  + criar     ${r}`);
  for (const r of alterar) console.log(`  ~ alterar   ${r}`);
  for (const r of destruir) console.log(`  - destruir  ${r}`);
  if (arquivosNovos.length || arquivosMudados.length) {
    console.log('');
    for (const f of arquivosNovos) console.log(`  + arquivo   ${f}`);
    for (const f of arquivosMudados) console.log(`  ~ arquivo   ${f}`);
  }
  for (const b of p.bloqueios) console.log(`\nBLOQUEIO  ${b}`);
  console.log(`\n${criar.length} a criar, ${alterar.length} a alterar, ${destruir.length} a destruir.`);
}

/* ----------------------------------------------------------------- main */

const [, , comando, ...resto] = process.argv;

if (!comando || comando === 'ajuda' || comando === '--help' || comando === '-h') {
  console.log(USO);
  process.exit(comando ? 0 : 2);
}

if (comando === 'esquema') { console.log(esquema()); process.exit(0); }

if (comando in NAO_IMPLEMENTADOS) {
  const [secao, oque] = NAO_IMPLEMENTADOS[comando];
  console.error(
    `"${comando}" é comando da §50 e ainda não foi construído (${secao}: ${oque}).\n`
    + 'Motivo: provisionar de verdade exige credencial de nuvem e a aplicação Lumora, que não\n'
    + 'existe neste repositório. O que existe é o caminho até a saída nativa: validar, plan e\n'
    + 'build. Ver blueprint/README.md.');
  process.exit(3);
}

if (comando === 'validar') {
  const { livres } = opcoesDe(resto);
  if (!livres.length) { console.error(`validar precisa de ao menos um arquivo.\n\n${USO}`); process.exit(2); }
  let falhou = false;
  for (const arquivo of livres) {
    const r = validar(ler(arquivo));
    console.log(formatar(r, arquivo));
    if (!r.ok) falhou = true;
  }
  process.exit(falhou ? 1 : 0);
}

if (comando === 'plan' || comando === 'build') {
  const { o, livres } = opcoesDe(resto);
  if (livres.length !== 1) { console.error(`${comando} precisa de exatamente um arquivo.\n\n${USO}`); process.exit(2); }
  const arquivo = livres[0];
  const texto = ler(arquivo);

  const p = comando === 'plan' ? planejar(texto, o) : emitir(texto, o);
  if (!p.ok) { relatarAchados(p); console.error(`\nFALHOU ${arquivo}`); process.exit(1); }

  relatarPlano(p, arquivo);

  if (comando === 'plan') {
    console.log('\nDry-run. Nada foi escrito — §50.3 manda mostrar antes de aplicar.');
    console.log(`Para emitir:  lumora-blueprint build ${arquivo} --saida ${o.saida}`);
    process.exit(0);
  }
  if (p.recusado) { console.error(`\nRECUSADO  ${p.recusado}`); process.exit(1); }
  console.log('');
  for (const f of p.escritos) console.log(`  escrito   ${f}`);
  if (p.bloqueios.length) {
    console.log(`\nA saída é um PLANO, não algo aplicável: ${IMAGEM_SENTINELA} está no lugar do artefato.`);
  }
  process.exit(0);
}

console.error(`comando desconhecido: ${comando}\n\n${USO}`);
process.exit(2);
