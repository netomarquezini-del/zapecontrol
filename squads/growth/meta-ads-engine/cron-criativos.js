/**
 * Cron Criativos — Sobe criativos novos na campanha de teste
 *
 * Roda às 2h (São Paulo), 1h depois da análise de regras.
 *
 * REGRAS:
 * - Campanha vazia (0 ad sets) → primeiro lote: até 15 criativos
 * - Campanha já tem criativos → reposição a cada 3 dias, máx 5 por vez
 * - Só repõe os que morreram (foram killados pela análise)
 * - Menos de 10 ativos fora do dia de reposição → alerta no Telegram
 * - Ciclo: sobe → 3 dias sem mexer → análise mata → repõe → 3 dias...
 *
 * Persistência:
 * - Salva data do último upload em /data/last-creative-upload.json
 * - Só roda se passaram 3+ dias desde o último upload (ou primeiro lote)
 */

const path = require('path');
const fs = require('fs');

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

loadEnv(path.join(__dirname, '..', '.env'));
loadEnv(path.join(__dirname, '..', '..', '..', '.env'));

const MetaAdsApiClient = require('./lib/meta-ads-api-client');
const TelegramBot = require('./lib/telegram-bot');
const CreativeUploader = require('./lib/creative-uploader');

const UPLOAD_HOUR = 2;
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const CYCLE_DAYS = 3;
const FIRST_BATCH_SIZE = 15;
const REPOSITION_MAX = 5;
const MIN_ACTIVE_CRIATIVOS = 10;

const STATE_FILE = path.join(__dirname, '..', 'data', 'last-creative-upload.json');

const apiClient = new MetaAdsApiClient({
  accessToken: process.env.META_ACCESS_TOKEN,
  adAccountId: process.env.META_AD_ACCOUNT_ID
});

const telegramBot = new TelegramBot({
  token: process.env.TELEGRAM_BOT_TOKEN,
  chatId: process.env.TELEGRAM_CHAT_ID
});

const uploader = new CreativeUploader({
  apiClient,
  telegramBot,
  testCampaignId: process.env.META_TEST_CAMPAIGN_ID,
  accessToken: process.env.META_ACCESS_TOKEN,
  adAccountId: process.env.META_AD_ACCOUNT_ID,
  minBatch: 1 // Controle de batch feito aqui, não no uploader
});

// ============================================================
// State persistence
// ============================================================

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return { lastUploadDate: null, totalUploaded: 0 };
}

function saveState(state) {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('[cron-criativos] Erro ao salvar estado:', e.message);
  }
}

// ============================================================
// Main logic (v2 — persistência em disco + recuperação)
// ============================================================

const UPLOAD_HOUR_MAX = 8; // Janela expandida: 2h-8h São Paulo
const RUN_STATE_FILE = path.join(__dirname, '..', 'data', 'cron-criativos-run-state.json');

function loadRunState() {
  try {
    if (fs.existsSync(RUN_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(RUN_STATE_FILE, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return { lastRunDate: null };
}

function saveRunState(state) {
  try {
    fs.writeFileSync(RUN_STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('[cron-criativos] Erro ao salvar run state:', e.message);
  }
}

async function checkAndRun() {
  const now = new Date();
  const spHour = parseInt(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false }));
  const today = now.toISOString().split('T')[0];

  const runState = loadRunState();

  // Já rodou hoje? Pula.
  if (runState.lastRunDate === today) return;

  // Dentro da janela expandida (2h - 8h São Paulo)?
  if (spHour >= UPLOAD_HOUR && spHour < UPLOAD_HOUR_MAX) {
    await runUploadLogic(today);
    runState.lastRunDate = today;
    saveRunState(runState);
  }
}

// Startup — recupera execução perdida
async function startupCheck() {
  const now = new Date();
  const spHour = parseInt(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false }));
  const today = now.toISOString().split('T')[0];

  const runState = loadRunState();
  const state = loadState();

  if (runState.lastRunDate === today) {
    console.log('[cron-criativos] Já rodou hoje. Aguardando próximo ciclo.');
    return;
  }

  // Passou da janela E era dia de rodar (3+ dias)? → recupera
  const daysSinceLast = state.lastUploadDate
    ? Math.floor((new Date(today) - new Date(state.lastUploadDate)) / 86400000)
    : 999;

  if (spHour >= UPLOAD_HOUR_MAX && daysSinceLast >= CYCLE_DAYS) {
    console.log(`[cron-criativos] ⚠️ RECUPERAÇÃO: Perdeu a janela de hoje. Executando agora.`);
    await runUploadLogic(today);
    runState.lastRunDate = today;
    saveRunState(runState);
  }
}

async function runUploadLogic(today) {
  console.log(`\n[cron-criativos] ═══ Checagem ${today} ═══`);

  const testCampaignId = process.env.META_TEST_CAMPAIGN_ID;
  if (!testCampaignId) {
    console.log('[cron-criativos] Campanha de teste não configurada');
    return;
  }

  // 1. Quantos ad sets ativos tem na campanha?
  let activeAdSets = 0;
  try {
    const adsets = await apiClient._get(`/${testCampaignId}/adsets`, {
      fields: 'id,status',
      effective_status: '["ACTIVE"]',
      limit: 500
    });
    activeAdSets = (adsets.data || []).length;
  } catch (e) {
    console.error('[cron-criativos] Erro ao buscar ad sets:', e.message);
    return;
  }

  // 2. Quantos criativos novos tem na pasta?
  const newFiles = uploader._getNewFiles();
  const state = loadState();

  console.log(`[cron-criativos] Ad sets ativos: ${activeAdSets} | Novos na pasta: ${newFiles.length} | Último upload: ${state.lastUploadDate || 'nunca'}`);

  // ============================================================
  // CASO 1: Campanha vazia → primeiro lote (até 15)
  // ============================================================
  if (activeAdSets === 0) {
    if (newFiles.length === 0) {
      console.log('[cron-criativos] Campanha vazia mas sem criativos na pasta');
      await notify('📭 Campanha de teste vazia e pasta novos/ também vazia. Coloca os criativos lá pra eu subir o primeiro lote de 15.');
      return;
    }

    const batch = newFiles.slice(0, FIRST_BATCH_SIZE);
    console.log(`[cron-criativos] PRIMEIRO LOTE: subindo ${batch.length} de ${newFiles.length} criativos`);

    // Temporarily override uploader files
    const result = await uploadBatch(batch);

    if (result.uploaded > 0) {
      // Ativar campanha
      try {
        await apiClient.activateCampaign(testCampaignId);
        console.log('[cron-criativos] Campanha de teste ATIVADA');
      } catch (e) {
        console.error('[cron-criativos] Erro ao ativar campanha:', e.message);
      }

      state.lastUploadDate = today;
      state.totalUploaded = (state.totalUploaded || 0) + result.uploaded;
      saveState(state);

      await notify(
        `🚀 PRIMEIRO LOTE SUBIDO\n\n` +
        `${result.uploaded} criativos na campanha de teste\n` +
        `Budget: R$45/dia por ad set\n` +
        `Publico: Broad ADV+\n` +
        `Campanha ATIVADA\n\n` +
        `Proximo: analise no dia 4 (1h) → nao mexo ate la\n` +
        `— Leo, escalando com inteligencia`
      );
    }
    return;
  }

  // ============================================================
  // CASO 2: Campanha já tem criativos → checar ciclo de 3 dias
  // ============================================================

  const daysSinceLastUpload = state.lastUploadDate
    ? Math.floor((new Date(today) - new Date(state.lastUploadDate)) / 86400000)
    : 999;

  // Não é dia de reposição (menos de 3 dias)
  if (daysSinceLastUpload < CYCLE_DAYS) {
    console.log(`[cron-criativos] ${daysSinceLastUpload} dias desde último upload (ciclo: ${CYCLE_DAYS} dias). Não é dia de reposição.`);

    // Mas se tem menos de 10, alerta
    if (activeAdSets < MIN_ACTIVE_CRIATIVOS) {
      await notify(
        `⚠️ Campanha de teste com ${activeAdSets} criativos (minimo ${MIN_ACTIVE_CRIATIVOS})\n` +
        `Proximo upload em ${CYCLE_DAYS - daysSinceLastUpload} dia(s)\n` +
        `Criativos na pasta novos/: ${newFiles.length}`
      );
    }
    return;
  }

  // É dia de reposição (3+ dias)
  console.log(`[cron-criativos] ${daysSinceLastUpload} dias desde último upload. DIA DE REPOSIÇÃO.`);

  if (newFiles.length === 0) {
    console.log('[cron-criativos] Pasta novos/ vazia, nada pra repor');

    if (activeAdSets < MIN_ACTIVE_CRIATIVOS) {
      await notify(
        `⚠️ DIA DE REPOSIÇÃO mas pasta novos/ vazia!\n` +
        `Criativos ativos: ${activeAdSets} (minimo ${MIN_ACTIVE_CRIATIVOS})\n` +
        `Coloca novos criativos na pasta pra eu subir`
      );
    }
    return;
  }

  // Repor: máximo 5 por vez
  const batch = newFiles.slice(0, REPOSITION_MAX);
  console.log(`[cron-criativos] REPOSIÇÃO: subindo ${batch.length} criativos (max ${REPOSITION_MAX})`);

  const result = await uploadBatch(batch);

  if (result.uploaded > 0) {
    state.lastUploadDate = today;
    state.totalUploaded = (state.totalUploaded || 0) + result.uploaded;
    saveState(state);

    await notify(
      `🔄 REPOSIÇÃO DE CRIATIVOS\n\n` +
      `${result.uploaded} criativos subidos\n` +
      `Ativos agora: ${activeAdSets + result.uploaded}\n` +
      `Restam na pasta: ${newFiles.length - result.uploaded}\n\n` +
      `Proxima reposição em 3 dias\n` +
      `— Leo, escalando com inteligencia`
    );
  }
}

// ============================================================
// Helpers
// ============================================================

async function uploadBatch(files) {
  let uploaded = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const adSetCount = await uploader._getCurrentAdSetCount();
      const result = await uploader._uploadCreative(file, adSetCount + 1);
      uploaded++;
      console.log(`[cron-criativos] ✅ ${file.name}`);

      // Delay humanizado entre uploads (15-30s) — anti-ban
      if (files.indexOf(file) < files.length - 1) {
        const delay = 15000 + Math.floor(Math.random() * 15000);
        console.log(`[cron-criativos] Aguardando ${Math.round(delay / 1000)}s antes do próximo...`);
        await new Promise(r => setTimeout(r, delay));
      }
    } catch (err) {
      errors++;
      console.error(`[cron-criativos] ❌ ${file.name}: ${err.message}`);
      // Delay extra em caso de erro (30s)
      await new Promise(r => setTimeout(r, 30000));
    }
  }

  return { uploaded, errors };
}

async function notify(message) {
  try {
    await telegramBot.sendMessage(message, { parseMode: '' });
  } catch (e) {
    console.error('[cron-criativos] Telegram error:', e.message);
  }
}

// ============================================================
// Startup
// ============================================================
const state = loadState();

console.log('═══════════════════════════════════════════');
console.log('  Cron Criativos v3 — Iniciado');
console.log('═══════════════════════════════════════════');
console.log(`  Janela: ${UPLOAD_HOUR}h - ${UPLOAD_HOUR_MAX}h (São Paulo)`);
console.log(`  Recuperação: sim (se perdeu a janela, roda ao iniciar)`);
console.log(`  Campanha teste: ${process.env.META_TEST_CAMPAIGN_ID || 'NÃO CONFIGURADA'}`);
console.log(`  Pasta novos: criativos/novos/`);
console.log(`  Primeiro lote: até ${FIRST_BATCH_SIZE}`);
console.log(`  Reposição: máx ${REPOSITION_MAX} a cada ${CYCLE_DAYS} dias`);
console.log(`  Mínimo ativos: ${MIN_ACTIVE_CRIATIVOS}`);
console.log(`  Último upload: ${state.lastUploadDate || 'nunca'}`);
console.log('═══════════════════════════════════════════\n');

// Startup check — recupera execuções perdidas
startupCheck().then(() => {
  setInterval(checkAndRun, CHECK_INTERVAL_MS);
}).catch(err => {
  console.error('[cron-criativos] Erro no startup check:', err.message);
  setInterval(checkAndRun, CHECK_INTERVAL_MS);
});
