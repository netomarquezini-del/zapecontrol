/**
 * Thomas — Cron: Pull Winners from Max & Generate Statics
 *
 * Pipeline automático:
 *   1. Lê creative_analysis_queue (status: analyzed, sem processed_by_thomas)
 *   2. Para cada winner, extrai hooks e copies
 *   3. Gera pack de criativos estáticos
 *   4. Scorea o pack
 *   5. Salva metadata no Supabase (creative_packs)
 *   6. Envia preview no Telegram
 *   7. Marca como processado
 *
 * Uso:
 *   node cron-thomas-from-max.js          (processa novos winners)
 *   node cron-thomas-from-max.js --dry    (mostra o que faria sem executar)
 *
 * Cron sugerido: rodar após o cron do Max (ex: Segunda 10h, Max roda às 8h)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load env
function loadEnv(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match && !process.env[match[1].trim()]) {
        process.env[match[1].trim()] = match[2].trim();
      }
    });
  } catch (e) { /* ignore */ }
}
loadEnv(path.join(__dirname, '../../.env'));
loadEnv(path.join(__dirname, '../../../../.env'));

const DRY_RUN = process.argv.includes('--dry');

// ============================================================
// Supabase helpers
// ============================================================
function supabaseRequest(method, endpoint, body = null) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados');

  return new Promise((resolve, reject) => {
    const parsed = new URL(`${url}/rest/v1/${endpoint}`);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal'
      }
    };

    const req = https.request(options, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try {
          resolve(buf ? JSON.parse(buf) : null);
        } catch {
          resolve(buf);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ============================================================
// Telegram notification
// ============================================================
async function sendTelegram(message) {
  const token = process.env.THOMAS_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.THOMAS_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log('  ⚠️ Telegram não configurado (THOMAS_TELEGRAM_*)');
    return;
  }

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    });

    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => resolve(buf));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ============================================================
// Extract hooks from Max's analysis
// ============================================================
function extractHooksFromAnalysis(analysis) {
  if (!analysis) return [];

  const hooks = [];

  // If analysis has variations array
  if (analysis.variations && Array.isArray(analysis.variations)) {
    for (const v of analysis.variations) {
      if (v.hook) hooks.push(v.hook);
      if (v.headline) hooks.push(v.headline);
    }
  }

  // If analysis has hooks array
  if (analysis.hooks && Array.isArray(analysis.hooks)) {
    hooks.push(...analysis.hooks);
  }

  // If analysis has recommended_hooks
  if (analysis.recommended_hooks && Array.isArray(analysis.recommended_hooks)) {
    hooks.push(...analysis.recommended_hooks);
  }

  // Deduplicate and limit
  const unique = [...new Set(hooks)].filter(h => h && h.length > 5);
  return unique.slice(0, 6); // Max 6 hooks per winner
}

// ============================================================
// Main pipeline
// ============================================================
async function main() {
  console.log('🎨 Thomas — Cron: Pull from Max\n');

  // Step 1: Fetch unprocessed winners from Max
  console.log('📥 Buscando winners analisados pelo Max...');

  const winners = await supabaseRequest(
    'GET',
    'creative_analysis_queue?status=eq.analyzed&order=created_at.desc&limit=5'
  );

  if (!Array.isArray(winners) || winners.length === 0) {
    console.log('  ℹ️ Nenhum winner novo para processar.');
    return;
  }

  console.log(`  ✅ ${winners.length} winners encontrados\n`);

  if (DRY_RUN) {
    console.log('🔍 DRY RUN — mostrando o que seria gerado:\n');
    for (const w of winners) {
      const analysis = typeof w.analysis === 'string' ? JSON.parse(w.analysis) : w.analysis;
      const hooks = extractHooksFromAnalysis(analysis);
      console.log(`  Ad: ${w.ad_name || w.ad_id}`);
      console.log(`  Hooks extraídos: ${hooks.length}`);
      hooks.forEach((h, i) => console.log(`    ${i + 1}. ${h}`));
      console.log('');
    }
    return;
  }

  // Step 2: Generate packs for each winner
  const { generatePack } = require('./generate-static-creative');
  const { scorePack } = require('./score-creative-pack');
  const PACKS_DIR = path.join(__dirname, '../../criativos/thomas-packs');

  const packResults = [];

  for (const winner of winners) {
    const analysis = typeof winner.analysis === 'string'
      ? JSON.parse(winner.analysis)
      : winner.analysis;

    const hooks = extractHooksFromAnalysis(analysis);

    if (hooks.length === 0) {
      console.log(`  ⚠️ Sem hooks extraíveis para ${winner.ad_name || winner.ad_id}. Pulando.`);
      continue;
    }

    const conceito = winner.ad_name || `winner_${winner.ad_id}`;

    try {
      // Generate pack
      const packResult = await generatePack({
        conceito,
        angulos: ['resultado', 'dor'],
        hooks,
        formato: 'feed-square',
        modo: 'organic',
        cta: 'QUERO COMEÇAR AGORA',
        imageModel: 'gemini'
      });

      // Score pack
      const scoreResult = scorePack(packResult.packDir);

      // Save to Supabase
      if (scoreResult) {
        await supabaseRequest('POST', 'creative_packs', {
          pack_id: packResult.packId,
          pack_name: conceito,
          source_ad_id: winner.ad_id,
          source_queue_id: winner.id,
          conceito,
          angulo: 'resultado',
          funil: 'tofu',
          modo: 'organic',
          total_criativos: scoreResult.stats.total,
          score_medio: parseFloat(scoreResult.stats.avgScore),
          elite_count: scoreResult.stats.elite,
          strong_count: scoreResult.stats.strong,
          acceptable_count: scoreResult.stats.acceptable,
          weak_count: scoreResult.stats.weak,
          reject_count: scoreResult.stats.reject,
          top_3: JSON.stringify(scoreResult.top3.map(c => ({
            filename: c.filename,
            score: c.total,
            headline: c.headline
          }))),
          status: 'generated'
        });
      }

      packResults.push({ packId: packResult.packId, stats: scoreResult?.stats });
    } catch (err) {
      console.error(`  ❌ Erro processando ${conceito}: ${err.message}`);
    }
  }

  // Step 3: Send Telegram summary
  if (packResults.length > 0) {
    const summary = packResults.map(p =>
      `📦 *${p.packId}*\n` +
      `   Score médio: ${p.stats?.avgScore || '?'}/100\n` +
      `   Elite: ${p.stats?.elite || 0} | Strong: ${p.stats?.strong || 0}`
    ).join('\n\n');

    const message =
      `🎨 *Thomas Design — Novos Packs*\n\n` +
      `${packResults.length} pack(s) gerado(s) a partir dos winners do Max:\n\n` +
      `${summary}\n\n` +
      `Aguardando aprovação. Responda OK para liberar upload.`;

    await sendTelegram(message);
    console.log('\n📱 Notificação enviada no Telegram');
  }

  console.log(`\n✅ Pipeline completo. ${packResults.length} packs gerados.`);
}

main().catch(err => {
  console.error(`❌ Erro fatal: ${err.message}`);

  // Notificar erro no Telegram (1x, sem retry — regra do Neto)
  const token = process.env.THOMAS_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.THOMAS_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    const body = JSON.stringify({
      chat_id: chatId,
      text: `❌ *Thomas Design — ERRO no cron*\n\n${err.message}\n\nCron pausado. Verificar manualmente.`,
      parse_mode: 'Markdown'
    });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    });
    req.write(body);
    req.end();
  }

  process.exit(1);
});
