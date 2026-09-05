/* Localiza Playwright e Chromium sem depender de caminho fixo nem de um
   node_modules ao lado. As suítes originais tinham
   /opt/pw-browsers/chromium-1194/... escrito à mão e dependiam de um
   `npm i playwright-core` na mesma pasta — as duas coisas só valiam naquela
   máquina, o que tornava a verificação irreproduzível. */
import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

export const BASE = process.env.LUM_BASE || 'http://localhost:8765';

function raizesGlobais() {
  const fora = [];
  for (const cmd of [['npm', ['root', '-g']], ['pnpm', ['root', '-g']]]) {
    try {
      const p = execFileSync(cmd[0], cmd[1], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (p && existsSync(p)) fora.push(p);
    } catch { /* gerenciador ausente */ }
  }
  for (const p of ['/opt/node22/lib/node_modules', '/usr/lib/node_modules', '/usr/local/lib/node_modules']) {
    if (existsSync(p) && !fora.includes(p)) fora.push(p);
  }
  return fora;
}

/** Importa `chromium` de playwright-core ou playwright, onde quer que estejam. */
export async function carregarChromium() {
  // Playwright é CommonJS: importado como ESM, tudo cai sob `default`.
  const pegar = (m) => m?.chromium ?? m?.default?.chromium;

  for (const pacote of ['playwright-core', 'playwright']) {
    try {
      const c = pegar(await import(pacote));
      if (c) return c;
    } catch { /* tenta o próximo */ }
  }
  const req = createRequire(import.meta.url);
  for (const raiz of raizesGlobais()) {
    for (const pacote of ['playwright-core', 'playwright']) {
      const dir = `${raiz}/${pacote}`;
      if (!existsSync(dir)) continue;
      try {
        const c = pegar(await import(`file://${req.resolve(dir)}`));
        if (c) return c;
      } catch { /* tenta o próximo */ }
    }
  }
  throw new Error(
    'Playwright não encontrado. Instale com:  npm i -D playwright-core\n' +
    '(ou defina o pacote globalmente — este script também procura em npm root -g)');
}

/** Caminho do executável do Chromium. */
export function acharChromium() {
  if (process.env.LUM_CHROMIUM && existsSync(process.env.LUM_CHROMIUM)) {
    return process.env.LUM_CHROMIUM;
  }
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (existsSync(base)) {
    const dirs = readdirSync(base).filter((d) => d.startsWith('chromium-')).sort().reverse();
    for (const d of dirs) {
      for (const rel of ['chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
        const p = `${base}/${d}/${rel}`;
        if (existsSync(p)) return p;
      }
    }
  }
  for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) {
    if (existsSync(p)) return p;
  }
  // Playwright acha o próprio navegador quando foi ele que o baixou.
  return undefined;
}
