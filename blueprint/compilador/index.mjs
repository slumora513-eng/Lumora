/* ==========================================================================
   blueprint/compilador/index.mjs — o compilador da §50.2

   "Um compilador único (lumora-blueprint build) lê o YAML e emite a saída
    nativa de cada destino. (...) Mesma entrada, saídas equivalentes. Novos
    destinos entram como módulos do compilador, sem mudar o formato do
    Blueprint."

   É por isso que `DESTINOS` é um mapa e não um `switch`: acrescentar
   DigitalOcean ou GCP (passo 6 da §50.5) é acrescentar um módulo aqui, sem
   tocar no formato, no validador nem nos outros emissores.

   A ORDEM É INEGOCIÁVEL: validar → resolver → emitir. Um Blueprint que não
   passa no validador não chega ao emissor. Compilar entrada inválida é o
   caminho mais curto para uma pilha errada que ninguém entende depois.
   ========================================================================== */

'use strict';

import { validar } from '../validador.mjs';
import { resolver } from './plano.mjs';
import { compilar as render } from './render.mjs';
import { compilar as aws } from './aws.mjs';
import { estadoDesejado, lerEstado, diferenca, escreverArquivos, gravarEstado } from './estado.mjs';
import { imagemDaAplicacao, aplicavel } from './plataforma.mjs';

/** Destinos com emissor construído. §50.5: passo 2 (Render) e passo 3 (AWS). */
export const DESTINOS = { render, aws };

/** Destinos que a §50.2 lista e cujos emissores são passos 4 e 6 da §50.5. */
export const DESTINOS_PENDENTES = {
  docker:       ['§50.5 passo 4', 'docker-compose.yml + .env.example + migrations'],
  digitalocean: ['§50.5 passo 6', 'App Platform spec (app.yaml)'],
  gcp:          ['§50.5 passo 6', 'Terraform (Cloud SQL, Cloud Run, GCS) — Fase 2'],
};

/**
 * Compila um Blueprint na saída nativa do destino que ele declara.
 *
 * @param {string} texto  conteúdo do arquivo .yaml
 * @param {object} [opcoes]
 * @param {string} [opcoes.imagem]  artefato da aplicação Lumora
 * @returns {{ok: boolean, erros: object[], avisos: object[], plano?: object,
 *            arquivos?: object, recursos?: string[], destino?: string}}
 */
export function compilar(texto, opcoes = {}) {
  const v = validar(texto);
  if (!v.ok) return { ok: false, erros: v.erros, avisos: v.avisos };

  const plano = resolver(texto);
  const destino = plano.stack.destino;

  const emissor = DESTINOS[destino];
  if (!emissor) {
    const pendente = DESTINOS_PENDENTES[destino];
    return {
      ok: false,
      avisos: v.avisos,
      erros: [{
        codigo: 'destino-sem-emissor',
        caminho: 'stack.destino',
        linha: null,
        mensagem: pendente
          ? `o emissor de "${destino}" é ${pendente[0]} (${pendente[1]}) e ainda não foi construído`
          : `sem emissor para "${destino}"`,
        secao: '§50.5',
      }],
    };
  }

  const saida = emissor(plano, opcoes);
  return {
    ok: true,
    destino,
    plano,
    arquivos: saida.arquivos,
    recursos: saida.recursos,
    erros: [],
    avisos: [...v.avisos, ...saida.avisos],
  };
}

/**
 * Dry-run da §50.3: "sempre mostra o que será criado/alterado/destruído ANTES
 * de aplicar".
 *
 * @param {string} texto
 * @param {object} opcoes  { saida: diretório, imagem }
 */
export function planejar(texto, opcoes = {}) {
  const c = compilar(texto, opcoes);
  if (!c.ok) return { ...c, delta: null };

  const desejado = estadoDesejado(c);
  const anterior = opcoes.saida ? lerEstado(opcoes.saida) : null;
  const delta = diferenca(anterior, desejado);

  // Bloqueios: coisas que impedem a saída de virar infraestrutura de verdade.
  const bloqueios = [];
  if (!aplicavel(imagemDaAplicacao(opcoes))) {
    bloqueios.push('o artefato da aplicação Lumora não foi informado (--imagem / LUMORA_IMAGEM)');
  }
  return { ...c, desejado, anterior, delta, bloqueios, primeiraVez: anterior === null };
}

/**
 * Emite os artefatos em disco. Nunca é a primeira coisa que acontece: o
 * chamador mostra o plano antes, e a destruição de recurso exige confirmação
 * humana explícita (§50.3).
 */
export function emitir(texto, opcoes = {}) {
  const p = planejar(texto, opcoes);
  if (!p.ok) return p;
  if (p.delta.destruir.length && !opcoes.confirmar) {
    return {
      ...p,
      escritos: [],
      recusado: 'a compilação destrói recurso que existia antes; §50.3 exige confirmação humana '
        + '— repita com --confirmar depois de ler o plano',
    };
  }
  const escritos = escreverArquivos(opcoes.saida, p.arquivos);
  gravarEstado(opcoes.saida, p.desejado);
  return { ...p, escritos };
}

export { resolver } from './plano.mjs';
export { estadoDesejado, diferenca } from './estado.mjs';
