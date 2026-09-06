#!/usr/bin/env node
/* Roda as suítes do runtime e soma o resultado.
   Exige um servidor local na raiz do repositório:
       python3 -m http.server 8765
   Variáveis: LUM_BASE (padrão http://localhost:8765), LUM_CHROMIUM. */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { BASE } from './navegador.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SUITES = [
  ['teste',    'Fase 3A (§71)'],
  ['t2',       'Animações, notificações, navegação, Interface Viva'],
  ['reduzido', 'Movimento reduzido — Fase 3A'],
  ['red2',     'Movimento reduzido — módulos novos'],
  ['t3d2',     'Aberturas em WebGL 3D'],
  ['tleg',     'Camada de texto das aberturas'],
  ['tatlas',   'Atlas Estelar'],
  ['tmarca',   'Marca com alfa'],
  ['tcamada',  'Camada de sistema (§65.1)'],
  ['tblueprint', 'Blueprint Universal (§50) — formato e validador'],
];

try {
  const r = await fetch(`${BASE}/runtime/verificacao.html`);
  if (!r.ok) throw new Error(String(r.status));
} catch {
  console.error(`Sem servidor em ${BASE}.\nRode na raiz do repositório:  python3 -m http.server 8765`);
  process.exit(2);
}

const rodar = (arq) => new Promise((ok) => {
  const p = spawn(process.execPath, [join(AQUI, `${arq}.mjs`)], { encoding: 'utf8' });
  let saida = '';
  p.stdout.on('data', (d) => { saida += d; });
  p.stderr.on('data', (d) => { saida += d; });
  p.on('close', () => ok(saida));
});

let total = 0, falhas = 0;
for (const [arq, titulo] of SUITES) {
  const saida = await rodar(arq);
  const passou = (saida.match(/^PASS/gm) || []).length;
  const ruim = (saida.match(/^FALHA/gm) || []).length + (saida.match(/^PAGEERROR/gm) || []).length;
  total += passou; falhas += ruim;
  console.log(`${String(passou).padStart(3)} ok  ${String(ruim).padStart(2)} falhas   ${titulo}`);
  for (const l of saida.split('\n').filter((l) => l.startsWith('FALHA') || l.startsWith('PAGEERROR'))) {
    console.log(`        ${l}`);
  }
}
console.log('—'.repeat(60));
console.log(`${total} verificações, ${falhas} falhas`);
process.exit(falhas ? 1 : 0);
