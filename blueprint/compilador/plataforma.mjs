/* ==========================================================================
   blueprint/compilador/plataforma.mjs
   As constantes que NÃO vêm do Blueprint do cliente, e sim de decisões já
   tomadas para a plataforma inteira.

   Isto existe para separar duas coisas que é fácil misturar: o que o tenant
   escolhe (plano, add-ons, destino, região) e o que a Lumora já decidiu para
   todo mundo (retenção de backup, rotação de segredos, WAF, região de
   produção). O segundo grupo não é default de agente — cada linha aqui tem
   data e autor no Guia, e a maior parte vem do bloco "Status de projeto —
   registro 01/09/2026", nas decisões de segurança delegadas pelo fundador.
   ========================================================================== */

'use strict';

/* --------------------------------------------------------- ambiente ------
   "Render = ambiente de testes (staging) e AWS = produção. O Render é apenas
   a área de testes do fundador para validar o sistema (dados descartáveis,
   disco efêmero, SEM DADOS DE CLIENTE); o sistema real fica na AWS."
   — Status de projeto, decisão do fundador em 01/09/2026.                  */
export const AMBIENTE_POR_DESTINO = {
  aws:          'producao',
  render:       'staging',
  docker:       'self-host',
  digitalocean: 'alternativo',
  gcp:          'fase-2',
};

/** "variáveis de ambiente e segredos separados por ambiente (staging ≠ produção)" */
export const SEGREDOS_ISOLADOS_POR_AMBIENTE = true;

/* ---------------------------------------------------------- região -------
   "Região e residência de dados: produção em sa-east-1 (São Paulo) — dados de
   clientes permanecem no Brasil (LGPD); failover multi-região avaliado
   pós-v1." — decisão de segurança 3, 01/09/2026.                           */
export const REGIAO_DE_PRODUCAO = 'sa-east-1';

/* ---------------------------------------------------------- backup -------
   "Backup (final): diário com retenção de 7 dias + snapshot semanal retido 30
   dias; RPO ≤ 24h e RTO ≤ 4h validados como finais para produção AWS; teste
   de restauração trimestral obrigatório; backup imutável anti-ransomware."
   — decisão de segurança 6, 01/09/2026.                                    */
export const BACKUP = {
  diarioRetencaoDias: 7,
  semanalRetencaoDias: 30,
  rpoHoras: 24,
  rtoHoras: 4,
  testeDeRestauracao: 'trimestral',
  imutavel: true,                 // anti-ransomware → Vault Lock, na AWS
};

/* --------------------------------------------------------- segredos ------
   "Segredos: AWS Secrets Manager com rotação programada (chaves de API a cada
   90 dias; credenciais de banco a cada 30 dias); acesso por IAM roles;
   NENHUM SEGREDO EM VARIÁVEIS DE AMBIENTE NA PRODUÇÃO."
   — decisão de segurança 2, 01/09/2026.                                    */
export const ROTACAO_DIAS = { api: 90, banco: 30 };
export const SEGREDO_EM_VARIAVEL_DE_AMBIENTE = false;

/* ------------------------------------------------------------- borda -----
   "Edge/WAF (AWS): CloudFront + AWS WAF (regras gerenciadas) + Shield
   Standard no dia 1 da produção; Shield Advanced apenas se o volume de
   ataques justificar o custo." — decisão de segurança 1, 01/09/2026.
   Shield Standard não é recurso: vem ligado e sem custo em toda distribuição
   CloudFront. Por isso não aparece no Terraform — aparece no relatório.     */
export const WAF_REGRAS_GERENCIADAS = [
  'AWSManagedRulesCommonRuleSet',
  'AWSManagedRulesKnownBadInputsRuleSet',
  'AWSManagedRulesAmazonIpReputationList',
  'AWSManagedRulesSQLiRuleSet',
];

/* -------------------------------------------------- destruição protegida --
   §50.3: "destroy exige dupla confirmação + janela de retenção de backup
   imutável de 30 dias antes de apagar dados do tenant (LGPD, §26)."        */
export const RETENCAO_ANTES_DE_APAGAR_DIAS = 30;

/* ------------------------------------------------------- a aplicação -----
   O artefato da aplicação Lumora (imagem de contêiner ou repositório) NÃO é
   dado do tenant e NÃO existe ainda: a aplicação não foi construída. O
   compilador emite este sentinela no lugar, e `plan` o reporta como bloqueio.

   Preencher via `--imagem <ref>` ou LUMORA_IMAGEM. Sem isso, a saída é válida
   como plano e INAPLICÁVEL de propósito — falha alto em vez de subir um
   contêiner que não existe.                                                */
export const IMAGEM_SENTINELA = 'LUMORA_IMAGEM_NAO_DEFINIDA';
export const COMANDO_MIGRATIONS = 'lumora migrate deploy';   // §50.3, migrations viajam no Blueprint

export function imagemDaAplicacao(opcoes = {}) {
  return opcoes.imagem
    || (typeof process === 'object' ? process.env?.LUMORA_IMAGEM : null)
    || IMAGEM_SENTINELA;
}

/** A saída é aplicável? Só quando o artefato da aplicação foi informado. */
export function aplicavel(imagem) { return imagem !== IMAGEM_SENTINELA; }
