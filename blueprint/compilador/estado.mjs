/* ==========================================================================
   blueprint/compilador/estado.mjs — a idempotência da §50.3

   §50.3: "Idempotência total: aplicar o mesmo Blueprint duas vezes não cria
   nada duplicado — o compilador compara o estado desejado com o existente
   (drift detection) e só aplica o delta."

   ONDE ESTE ARQUIVO PARA, E ISSO PRECISA FICAR CLARO: o estado comparado aqui
   é o dos ARTEFATOS, não o da nuvem. Comparar com a nuvem de verdade exige
   credencial, chamada de API e o `terraform state` — e é trabalho do `apply`,
   que não existe porque a aplicação Lumora não existe.

   O que existe é a metade que dá para fazer sem nuvem, e ela não é pouca:
   dado o mesmo Blueprint, a saída é byte a byte idêntica; dado um Blueprint
   mudado, dá para dizer exatamente qual recurso nasce, qual muda e qual some
   ANTES de qualquer coisa acontecer. Que é o que a §50.3 chama de dry-run
   obrigatório.
   ========================================================================== */

'use strict';

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

export const ARQUIVO_DE_ESTADO = '.lumora-blueprint-estado.json';

const resumo = (texto) => createHash('sha256').update(texto, 'utf8').digest('hex').slice(0, 16);

/**
 * Estado desejado de uma compilação. Determinístico: sem data, sem caminho
 * absoluto, sem nada que mude entre duas execuções iguais.
 */
export function estadoDesejado(saida) {
  const arquivos = {};
  for (const nome of Object.keys(saida.arquivos).sort()) {
    arquivos[nome] = resumo(saida.arquivos[nome]);
  }
  return {
    formato: 'lumora.estado/v1',
    tenant: saida.plano.tenant.id,
    plano: saida.plano.plano.id,
    destino: saida.plano.stack.destino,
    arquivos,
    recursos: saida.recursos.slice().sort(),
  };
}

export function lerEstado(diretorio) {
  const caminho = join(diretorio, ARQUIVO_DE_ESTADO);
  if (!existsSync(caminho)) return null;
  try { return JSON.parse(readFileSync(caminho, 'utf8')); } catch { return null; }
}

export function gravarEstado(diretorio, estado) {
  mkdirSync(diretorio, { recursive: true });
  writeFileSync(join(diretorio, ARQUIVO_DE_ESTADO), `${JSON.stringify(estado, null, 2)}\n`);
}

/** O nome do recurso sem os parâmetros entre parênteses — é a identidade. */
const identidade = (r) => r.split(' (')[0];

/**
 * Compara desejado com existente.
 * @returns {{criar: string[], alterar: string[], destruir: string[],
 *            arquivosNovos: string[], arquivosMudados: string[], semMudanca: boolean}}
 */
export function diferenca(anterior, desejado) {
  const antes = anterior?.recursos || [];
  const antesPorId = new Map(antes.map((r) => [identidade(r), r]));
  const agoraPorId = new Map(desejado.recursos.map((r) => [identidade(r), r]));

  const criar = [];
  const alterar = [];
  for (const [id, r] of agoraPorId) {
    if (!antesPorId.has(id)) criar.push(r);
    else if (antesPorId.get(id) !== r) alterar.push(`${antesPorId.get(id)}  →  ${r}`);
  }
  const destruir = [...antesPorId.keys()].filter((id) => !agoraPorId.has(id)).map((id) => antesPorId.get(id));

  const arquivosAntes = anterior?.arquivos || {};
  const arquivosNovos = Object.keys(desejado.arquivos).filter((f) => !(f in arquivosAntes));
  const arquivosMudados = Object.keys(desejado.arquivos)
    .filter((f) => f in arquivosAntes && arquivosAntes[f] !== desejado.arquivos[f]);

  return {
    criar, alterar, destruir, arquivosNovos, arquivosMudados,
    semMudanca: anterior !== null && !criar.length && !alterar.length && !destruir.length
      && !arquivosNovos.length && !arquivosMudados.length,
  };
}

/** Escreve os artefatos. Só é chamado depois de o plano ter sido mostrado. */
export function escreverArquivos(diretorio, arquivos) {
  const escritos = [];
  for (const nome of Object.keys(arquivos).sort()) {
    const caminho = join(diretorio, nome);
    mkdirSync(dirname(caminho), { recursive: true });
    writeFileSync(caminho, arquivos[nome]);
    escritos.push(caminho);
  }
  return escritos;
}
