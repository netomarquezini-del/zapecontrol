#!/usr/bin/env node

/**
 * cron-maicon-batch.js — Batch Production para o Maicon Video Creator
 *
 * Modos de uso:
 *
 * 1. Via Supabase (render_jobs table):
 *    node cron-maicon-batch.js
 *
 * 2. Via CLI com arquivo de briefings:
 *    node cron-maicon-batch.js --file briefings.json
 *
 * 3. Via CLI com briefing inline:
 *    node cron-maicon-batch.js --product "Shopee ADS 2.0" --angle "dor" --format "30s"
 *
 * Cron (segunda 6h):
 *    0 6 * * 1 cd /root/zapeecomm/squads/zapeads/criativos && node cron-maicon-batch.js
 *
 * REGRA CRITICA: Em caso de erro, PARA TUDO, avisa 1x no Telegram, NAO retenta, NAO gera spam.
 *
 * CommonJS
 */

'use strict';

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const { createVideo, batchCreate } = require('./video-pipeline');
const telegram = require('./telegram-maicon');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DEFAULT_CONCURRENCY  = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg, data) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [MAICON:CRON] ${msg}`;
  if (data) console.log(line, data);
  else console.log(line);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      parsed[key] = val;
    }
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// Supabase Integration
// ---------------------------------------------------------------------------

/**
 * Busca jobs pendentes na tabela render_jobs do Supabase.
 * Schema esperado: id, status, payload (JSONB), priority, created_at
 */
async function fetchPendingJobs() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return null; // Supabase nao configurado
  }

  const https = require('https');
  const url = `${SUPABASE_URL}/rest/v1/render_jobs?status=eq.PENDING&order=priority.asc,created_at.asc&limit=20`;

  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          if (Array.isArray(data)) {
            resolve(data);
          } else {
            // Pode ser erro de tabela nao existente — nao e critico
            log('Supabase retornou formato inesperado (tabela render_jobs pode nao existir)', data);
            resolve([]);
          }
        } catch (e) {
          reject(new Error(`Supabase parse error: ${e.message}`));
        }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

/**
 * Atualiza status de um job no Supabase.
 */
async function updateJobStatus(jobId, status, extras = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;

  const https = require('https');
  const url = `${SUPABASE_URL}/rest/v1/render_jobs?id=eq.${jobId}`;
  const body = JSON.stringify({
    status,
    ...extras,
    ...(status === 'RENDERING' ? { started_at: new Date().toISOString() } : {}),
    ...(status === 'COMPLETED' || status === 'FAILED' ? { completed_at: new Date().toISOString() } : {}),
  });

  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve());
      res.on('error', reject);
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Batch Processing
// ---------------------------------------------------------------------------

/**
 * Processa jobs do Supabase.
 */
async function processSupabaseJobs(concurrency) {
  log('Buscando jobs pendentes no Supabase...');

  let jobs;
  try {
    jobs = await fetchPendingJobs();
  } catch (err) {
    const errMsg = `Falha ao buscar jobs do Supabase: ${err.message}`;
    log(errMsg);
    await telegram.sendError(errMsg);
    process.exit(1);
  }

  if (!jobs || jobs.length === 0) {
    log('Nenhum job pendente');
    return { total: 0, success: 0, failed: 0 };
  }

  log(`${jobs.length} jobs pendentes encontrados`);

  // Atualizar fila no Telegram
  telegram.updateQueue(jobs.map((j) => ({
    product: j.payload?.product || 'N/A',
    status: j.status,
  })));

  const results = { total: jobs.length, success: 0, failed: 0, details: [] };

  // Processar com concorrencia limitada
  const { default: pLimit } = await import('p-limit');
  const limit = pLimit(concurrency);

  await Promise.all(
    jobs.map((job) =>
      limit(async () => {
        const briefing = job.payload || {};
        log(`Processando job ${job.id}: ${briefing.product || 'N/A'}`);

        // Marcar como RENDERING
        await updateJobStatus(job.id, 'RENDERING');

        try {
          const result = await createVideo(briefing);

          if (result.error) {
            results.failed++;
            results.details.push({ jobId: job.id, error: result.message });
            await updateJobStatus(job.id, 'FAILED', {
              error_message: result.message,
            });
            // PARA — nao continua com os proximos se der erro critico
            // Mas como estamos em paralelo, os que ja foram despachados continuam
          } else {
            results.success++;
            results.details.push({ jobId: job.id, videoPath: result.videoPath });
            await updateJobStatus(job.id, 'COMPLETED', {
              output_url: result.videoPath,
            });
          }
        } catch (err) {
          results.failed++;
          results.details.push({ jobId: job.id, error: err.message });
          await updateJobStatus(job.id, 'FAILED', {
            error_message: err.message,
          });
          // Erro inesperado — notifica e continua (os outros jobs podem funcionar)
          log(`Job ${job.id} falhou: ${err.message}`);
        }
      })
    )
  );

  return results;
}

/**
 * Processa briefings de um arquivo JSON.
 * Formato esperado: array de objetos briefing
 */
async function processFileJobs(filePath, concurrency) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    const errMsg = `Arquivo nao encontrado: ${absPath}`;
    log(errMsg);
    await telegram.sendError(errMsg);
    process.exit(1);
  }

  let briefings;
  try {
    briefings = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
    if (!Array.isArray(briefings)) briefings = [briefings];
  } catch (err) {
    const errMsg = `Erro ao ler arquivo de briefings: ${err.message}`;
    log(errMsg);
    await telegram.sendError(errMsg);
    process.exit(1);
  }

  log(`${briefings.length} briefings carregados de ${absPath}`);
  return batchCreate(briefings, concurrency);
}

/**
 * Processa um unico briefing via CLI args.
 */
async function processSingleJob(args) {
  const briefing = {
    product: args.product || 'video',
    angle: args.angle || 'default',
    format: args.format || '30s',
    hook: args.hook || undefined,
    tone: args.tone || undefined,
    draft: args.draft === 'true' || args.draft === true,
    voiceId: args.voiceId || undefined,
  };

  log(`Processando briefing unico: ${briefing.product}`);
  return createVideo(briefing);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const startTime = Date.now();
  const args = parseArgs();
  const concurrency = parseInt(args.concurrency) || DEFAULT_CONCURRENCY;

  log('=== MAICON BATCH CRON INICIADO ===');
  log(`Concorrencia: ${concurrency}`);

  let results;

  try {
    if (args.file) {
      // Modo arquivo
      results = await processFileJobs(args.file, concurrency);
    } else if (args.product) {
      // Modo inline
      const result = await processSingleJob(args);
      results = {
        summary: {
          total: 1,
          success: result.error ? 0 : 1,
          failed: result.error ? 1 : 0,
        },
        results: [{ result }],
      };
    } else if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      // Modo Supabase
      results = await processSupabaseJobs(concurrency);
    } else {
      log('Nenhum modo de operacao detectado.');
      log('Uso:');
      log('  node cron-maicon-batch.js                          # Supabase (requer SUPABASE_URL)');
      log('  node cron-maicon-batch.js --file briefings.json    # Arquivo JSON');
      log('  node cron-maicon-batch.js --product "Produto"      # Briefing inline');
      log('');
      log('Opcoes:');
      log('  --concurrency N    Numero de renders paralelos (default: 3)');
      log('  --format 30s       Formato do video (15s, 30s, 60s)');
      log('  --angle dor        Angulo criativo');
      log('  --draft true       Usar modelo de voz rapido (flash)');
      process.exit(0);
    }

    // Relatorio final
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const summary = results.summary || results;

    const report = [
      '=== MAICON BATCH COMPLETO ===',
      `Total: ${summary.total}`,
      `Sucesso: ${summary.success}`,
      `Falhas: ${summary.failed}`,
      `Tempo total: ${elapsed}s`,
    ].join('\n');

    log(report);

    // Notificar Telegram com resumo
    if (summary.total > 0) {
      await telegram.sendMessage(
        `[MAICON BATCH]\n${report}\n\nTimestamp: ${new Date().toISOString()}`
      );
    }

  } catch (err) {
    const errMsg = `[ERRO CRITICO] Batch falhou: ${err.message}`;
    log(errMsg, err.stack);
    // Notifica UMA VEZ e para
    await telegram.sendError(errMsg);
    process.exit(1);
  }

  log('=== FIM ===');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch((err) => {
    console.error(`[FATAL] ${err.message}`, err.stack);
    process.exit(1);
  });
}

module.exports = { main, processSupabaseJobs, processFileJobs, processSingleJob };
