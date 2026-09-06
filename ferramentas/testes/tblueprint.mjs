#!/usr/bin/env node
/* Blueprint Universal (§50) — passo 1 da §50.5.
   Suíte em Node puro: o formato é arquivo, não interface, e não precisa de
   navegador. Roda junto das demais por `node ferramentas/testes/rodar.mjs`. */

import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { analisar, ErroDeSintaxe } from '../../blueprint/yaml.mjs';
import { validar } from '../../blueprint/validador.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const EX = join(RAIZ, 'blueprint', 'exemplos');

let ok = 0, mau = 0;
const checar = (nome, cond, detalhe = '') => {
  if (cond) { ok += 1; console.log(`PASS ${nome}`); }
  else { mau += 1; console.log(`FALHA ${nome}${detalhe ? ` — ${detalhe}` : ''}`); }
};
const erroDeSintaxe = (texto) => {
  try { analisar(texto); return null; } catch (e) { return e instanceof ErroDeSintaxe ? e : null; }
};
const codigos = (r) => r.erros.map((e) => e.codigo);

/* ---------------------------------------------------------------- parser -- */

{
  const { valor, linhas } = analisar(`
apiVersion: blueprint.lumora/v1
metadata:
  nome: "Padaria do Ze"   # comentário depois de valor
  addons:
    veiculo_extra: 2
  comunidade: false
provedores:
  fiscal: [sefaz-sp, sefaz-mg]
recursos:
  postgres: { tier: "db.t4g.medium", storage_gb: 50 }
  app_replicas: 2
`);
  checar('parser: escalar com aspas e comentário na mesma linha', valor.metadata.nome === 'Padaria do Ze');
  checar('parser: bloco aninhado em dois níveis', valor.metadata.addons.veiculo_extra === 2);
  checar('parser: booleano é booleano, não string', valor.metadata.comunidade === false);
  checar('parser: lista em linha', Array.isArray(valor.provedores.fiscal) && valor.provedores.fiscal[1] === 'sefaz-mg');
  checar('parser: mapa em linha', valor.recursos.postgres.storage_gb === 50);
  checar('parser: inteiro é número', valor.recursos.app_replicas === 2);
  checar('parser: guarda a linha de cada caminho', linhas.get('metadata.addons.veiculo_extra') === 6,
    `veio ${linhas.get('metadata.addons.veiculo_extra')}`);
}

{
  const { valor } = analisar('nota: "isto # não é comentário"\noutra: valor  # isto é');
  checar('parser: "#" dentro de aspas não vira comentário', valor.nota === 'isto # não é comentário');
  checar('parser: comentário no fim é removido', valor.outra === 'valor');
}

{
  const { valor } = analisar('lista:\n  - um\n  - dois\nmapas:\n  - nome: a\n    n: 1\n  - nome: b\n    n: 2');
  checar('parser: sequência de escalares', valor.lista.length === 2 && valor.lista[1] === 'dois');
  checar('parser: sequência de mapas', valor.mapas[1].nome === 'b' && valor.mapas[0].n === 1);
}

checar('parser: tabulação na indentação é erro', !!erroDeSintaxe('a:\n\tb: 1'));
checar('parser: alias é erro', !!erroDeSintaxe('a: *ref'));
checar('parser: escalar de bloco é erro', !!erroDeSintaxe('a: |\n  texto'));
checar('parser: documento múltiplo é erro', !!erroDeSintaxe('---\na: 1'));
checar('parser: chave repetida é erro', !!erroDeSintaxe('a: 1\na: 2'));
checar('parser: chave repetida em mapa em linha é erro', !!erroDeSintaxe('a: { x: 1, x: 2 }'));
checar('parser: valor e bloco na mesma chave é erro', !!erroDeSintaxe('a: 1\n  b: 2'));
checar('parser: aspas não fechadas é erro', !!erroDeSintaxe('a: "sem fim'));
checar('parser: lista sem fechamento é erro', !!erroDeSintaxe('a: [1, 2'));
checar('parser: linha inicial recuada é erro', !!erroDeSintaxe('  a: 1'));
{
  const e = erroDeSintaxe('a: 1\nb: 2\nc: [1, 2');
  checar('parser: o erro aponta a linha certa', e && e.linha === 3, `veio ${e && e.linha}`);
}

/* ------------------------------------------------------------- exemplos -- */

for (const arq of readdirSync(EX).filter((f) => f.endsWith('.yaml'))) {
  const r = validar(readFileSync(join(EX, arq), 'utf8'));
  checar(`exemplo válido: ${arq}`, r.ok, codigos(r).join(', '));
}

const ESPERADO = {
  'addon-quantidade.yaml':      'addon-quantidade',
  'ancora.yaml':                'sintaxe',
  'api-version.yaml':           'api-version',
  'auditoria-mutavel.yaml':     'auditoria-mutavel',
  'chave-repetida.yaml':        'sintaxe',
  'destino-desconhecido.yaml':  'destino-desconhecido',
  'hub-como-plano.yaml':        'hub-nao-e-produto',
  'plano-desconhecido.yaml':    'plano-desconhecido',
  'regiao-em-selfhost.yaml':    'regiao-em-self-host',
  'segredo-no-yaml.yaml':       'segredo-no-yaml',
  'seguranca-desligada.yaml':   'seguranca-desligada',
};
const dirInv = join(EX, 'invalidos');
const invalidos = readdirSync(dirInv).filter((f) => f.endsWith('.yaml'));
checar('inválidos: todo arquivo do diretório tem expectativa declarada',
  invalidos.every((f) => f in ESPERADO), invalidos.filter((f) => !(f in ESPERADO)).join(', '));

for (const [arq, codigo] of Object.entries(ESPERADO)) {
  const r = validar(readFileSync(join(dirInv, arq), 'utf8'));
  checar(`inválido reprovado por "${codigo}": ${arq}`,
    !r.ok && codigos(r).includes(codigo), codigos(r).join(', ') || 'passou');
}

/* ------------------------------------------------------- regras isoladas -- */

const BASE = `apiVersion: blueprint.lumora/v1
metadata:
  nome: "T"
  tenant_id: "t_abc123"
  plano: business-p1
  comunidade: false
stack:
  destino: render
  regiao: oregon
`;
const com = (extra) => validar(BASE + extra);

checar('base mínima é válida', com('').ok, codigos(com('')).join(', '));

checar('§50.1: bloco desconhecido reprova', codigos(com('extra:\n  a: 1')).includes('bloco-desconhecido'));
checar('§50.1: metadata sem tenant_id reprova',
  codigos(validar(BASE.replace('  tenant_id: "t_abc123"\n', ''))).includes('campo-obrigatorio'));
checar('§50.1: tenant_id fora do formato reprova',
  codigos(validar(BASE.replace('t_abc123', 'padaria'))).includes('formato'));
checar('§50.1: moeda fora de ISO-4217 reprova',
  codigos(validar(BASE.replace('  comunidade: false', '  moeda: reais\n  comunidade: false'))).includes('formato'));

checar('§50.2: aws sem região reprova',
  codigos(validar(BASE.replace('  destino: render\n  regiao: oregon', '  destino: aws'))).includes('regiao-obrigatoria'));
checar('§50.2: gcp avisa que é Fase 2',
  validar(BASE.replace('destino: render', 'destino: gcp')).avisos.some((a) => a.codigo === 'destino-fase-2'));

checar('§37: criptografia_repouso desligada reprova',
  codigos(com('seguranca:\n  criptografia_repouso: false')).includes('seguranca-desligada'));
checar('§37: backup_imutavel desligado reprova',
  codigos(com('seguranca:\n  backup_imutavel: false')).includes('seguranca-desligada'));
checar('§37: bloco seguranca ausente é aviso, não erro',
  com('').ok && com('').avisos.some((a) => a.codigo === 'bloco-derivado' && a.caminho === 'seguranca'));

checar('§50.3: chave privada em texto reprova',
  codigos(com('recursos:\n  storage_gb: 10\n  postgres: { tier: "-----BEGIN RSA PRIVATE KEY-----" }')).includes('segredo-no-yaml'));
checar('§50.3: chave de acesso AWS em texto reprova',
  codigos(com('recursos:\n  storage_gb: 10\n  postgres: { tier: "AKIAIOSFODNN7EXAMPLE" }')).includes('segredo-no-yaml'));
checar('§50.3: chave chamada "senha" com valor literal reprova',
  codigos(com('provedores:\n  senha: batata')).includes('segredo-no-yaml'));
checar('§50.3: referência `secret: familia/nome` é aceita',
  com('provedores:\n  credencial: "secret: payments/asaas"').ok);

checar('§16: comunidade omitida vira aviso',
  validar(BASE.replace('  comunidade: false\n', '')).avisos.some((a) => a.codigo === 'comunidade-omitida'));
{
  const r = validar(BASE.replace('  comunidade: false', '  addons:\n    coisa_nova: 1\n  comunidade: false'));
  checar('§47: add-on fora do catálogo é aviso, não erro',
    r.ok && r.avisos.some((a) => a.codigo === 'addon-fora-do-catalogo'), codigos(r).join(', '));
}
checar('§46: família de provedor fora da tabela é aviso, não erro',
  com('provedores:\n  antifraude: stripe-radar').ok);
checar('§50.1: fiscal escalar em vez de lista reprova',
  codigos(com('provedores:\n  fiscal: sefaz-sp')).includes('tipo'));
checar('§50.3: app_replicas zero reprova',
  codigos(com('recursos:\n  app_replicas: 0')).includes('faixa'));

/* ------------------------------------------------------------------ CLI -- */

const cli = (args) => {
  try {
    const saida = execFileSync(process.execPath, [join(RAIZ, 'blueprint', 'lumora-blueprint.mjs'), ...args],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { codigo: 0, saida };
  } catch (e) { return { codigo: e.status, saida: `${e.stdout || ''}${e.stderr || ''}` }; }
};

checar('CLI: exemplo válido sai com 0', cli(['validar', join(EX, 'padaria-do-ze.yaml')]).codigo === 0);
checar('CLI: exemplo inválido sai com 1', cli(['validar', join(dirInv, 'hub-como-plano.yaml')]).codigo === 1);
checar('CLI: sem argumento sai com 2', cli(['validar']).codigo === 2);
for (const c of ['plan', 'build', 'apply', 'destroy']) {
  const r = cli([c, 'x.yaml']);
  checar(`CLI: "${c}" recusa com motivo e sai com 3`,
    r.codigo === 3 && /não foi construído/.test(r.saida), `código ${r.codigo}`);
}
checar('CLI: "esquema" imprime planos e destinos',
  /business-p2/.test(cli(['esquema']).saida) && /sa-east|render/.test(cli(['esquema']).saida));

console.log(`${ok} PASS, ${mau} FALHA`);
process.exit(mau ? 1 : 0);
