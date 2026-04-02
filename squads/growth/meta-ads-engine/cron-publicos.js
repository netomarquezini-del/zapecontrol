/**
 * Cron Públicos — Testa novos públicos de interesse
 *
 * Roda 1x/dia às 3h (São Paulo)
 * Sobe 3 públicos novos a cada 3 dias
 * Usa o melhor criativo winner da pool
 *
 * CORREÇÕES v2:
 * - lastRunDate persiste em disco (não perde ao reiniciar)
 * - Startup check: se perdeu a execução do dia, roda imediatamente
 * - Janela expandida: roda entre 3h-8h (não só 3h-4h)
 *
 * Depende de ter winners no pool (data/winners-pool.json)
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
const EscalaBuilder = require('./lib/escala-builder');
const PublicTester = require('./lib/public-tester');

const UPLOAD_HOUR = 3;          // Hora ideal: 3h São Paulo
const UPLOAD_HOUR_MAX = 8;      // Janela máxima: até 8h (se perdeu às 3h, tenta até 8h)
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const CYCLE_DAYS = 3;           // Intervalo mínimo entre uploads

const RUN_STATE_FILE = path.join(__dirname, '..', 'data', 'cron-publicos-run-state.json');

const apiClient = new MetaAdsApiClient({
  accessToken: process.env.META_ACCESS_TOKEN,
  adAccountId: process.env.META_AD_ACCOUNT_ID
});

const telegramBot = new TelegramBot({
  token: process.env.TELEGRAM_BOT_TOKEN,
  chatId: process.env.TELEGRAM_CHAT_ID
});

const escalaBuilder = new EscalaBuilder({
  apiClient,
  telegramBot,
  adAccountId: process.env.META_AD_ACCOUNT_ID
});

const publicTester = new PublicTester({
  apiClient,
  telegramBot,
  escalaBuilder,
  adAccountId: process.env.META_AD_ACCOUNT_ID
});

// ============================================================
// Persistência do lastRunDate em disco
// ============================================================

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
    console.error('[cron-publicos] Erro ao salvar estado:', e.message);
  }
}

// Load winners pool
function getWinnersPool() {
  try {
    const file = path.join(__dirname, '..', 'data', 'winners-pool.json');
    if (fs.existsSync(file)) {
      const pool = JSON.parse(fs.readFileSync(file, 'utf-8'));
      return pool.winners || [];
    }
  } catch (e) { /* ignore */ }
  return [];
}

// ============================================================
// Execução principal
// ============================================================

async function executePublicTest() {
  const winners = getWinnersPool();
  if (winners.length === 0) {
    console.log(`[cron-publicos] Sem winners na pool. Aguardando.`);
    return false;
  }

  console.log(`[cron-publicos] ${winners.length} winners na pool. Executando teste de público...`);

  try {
    const result = await publicTester.run(winners);
    console.log(`[cron-publicos] Resultado: ${result.created || 0} públicos criados`);
    return true;
  } catch (err) {
    console.error('[cron-publicos] Erro:', err.message);
    // REGRA NETO: erro → avisa 1x no Telegram e NÃO retenta. Sem spam.
    try {
      await telegramBot.sendMessage(
        `🚫 ERRO NO TESTE DE PÚBLICO — PAUSADO\n\n` +
        `Erro: ${err.message}\n\n` +
        `Ação: Teste de público pausado até resolver. Nenhuma nova tentativa automática.\n\n` +
        `— Léo (Compliance v2.0)`,
        { parseMode: '' }
      );
    } catch (e) { /* Telegram error — log only */ }
    return false;
  }
}

// ============================================================
// Check — roda a cada 5 min
// ============================================================

async function checkAndRun() {
  const now = new Date();
  const spHour = parseInt(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false }));
  const today = now.toISOString().split('T')[0];

  const runState = loadRunState();

  // Já rodou hoje? Pula.
  if (runState.lastRunDate === today) return;

  // Dentro da janela de execução? (3h - 8h São Paulo)
  if (spHour >= UPLOAD_HOUR && spHour < UPLOAD_HOUR_MAX) {
    console.log(`[cron-publicos] Dentro da janela (${spHour}h SP). Verificando ciclo...`);

    // Checar ciclo de 3 dias via public-tester state
    const testerState = publicTester.getStatus();
    const lastUpload = testerState.lastUpload;
    const daysSinceLast = lastUpload
      ? Math.floor((new Date(today) - new Date(lastUpload)) / 86400000)
      : 999;

    if (daysSinceLast < CYCLE_DAYS) {
      console.log(`[cron-publicos] ${daysSinceLast} dias desde último upload (ciclo: ${CYCLE_DAYS}). Não é dia.`);
      // Marcar como "checado" pra não ficar logando a cada 5 min
      runState.lastRunDate = today;
      saveRunState(runState);
      return;
    }

    // É dia de rodar
    const success = await executePublicTest();
    runState.lastRunDate = today;
    saveRunState(runState);
  }
}

// ============================================================
// Startup — checa se perdeu a execução
// ============================================================

async function startupCheck() {
  const now = new Date();
  const spHour = parseInt(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false }));
  const today = now.toISOString().split('T')[0];

  const runState = loadRunState();
  const testerState = publicTester.getStatus();
  const lastUpload = testerState.lastUpload;
  const daysSinceLast = lastUpload
    ? Math.floor((new Date(today) - new Date(lastUpload)) / 86400000)
    : 999;

  // Se já rodou hoje, nada a fazer
  if (runState.lastRunDate === today) {
    console.log('[cron-publicos] Já rodou hoje. Aguardando próximo ciclo.');
    return;
  }

  // Se passou da janela (depois das 8h) E era dia de rodar (3+ dias) → executa agora (recuperação)
  if (spHour >= UPLOAD_HOUR_MAX && daysSinceLast >= CYCLE_DAYS) {
    console.log(`[cron-publicos] ⚠️ RECUPERAÇÃO: Perdeu a janela de hoje (${UPLOAD_HOUR}h-${UPLOAD_HOUR_MAX}h). Executando agora.`);
    const success = await executePublicTest();
    runState.lastRunDate = today;
    saveRunState(runState);
    return;
  }

  // Se está antes da janela, aguarda normalmente
  if (spHour < UPLOAD_HOUR) {
    console.log(`[cron-publicos] Aguardando janela (${UPLOAD_HOUR}h SP). Agora: ${spHour}h.`);
    return;
  }

  // Dentro da janela — o checkAndRun vai pegar
  console.log(`[cron-publicos] Dentro da janela. checkAndRun vai executar no próximo ciclo.`);
}

// ============================================================
// Startup
// ============================================================

const status = publicTester.getStatus();

console.log('═══════════════════════════════════════════');
console.log('  Cron Públicos v2 — Iniciado');
console.log('═══════════════════════════════════════════');
console.log(`  Janela: ${UPLOAD_HOUR}h - ${UPLOAD_HOUR_MAX}h (São Paulo)`);
console.log(`  Ciclo: ${CYCLE_DAYS} dias entre uploads`);
console.log(`  Recuperação: sim (se perdeu a janela, roda ao iniciar)`);
console.log(`  Lote: 3 públicos por vez`);
console.log(`  Testados: ${status.tested}`);
console.log(`  Graduados: ${status.graduated}`);
console.log(`  Restantes: ${status.remaining}`);
console.log(`  Próximos: ${status.nextPublics.join(', ') || 'nenhum'}`);
console.log(`  Último upload: ${status.lastUpload || 'nunca'}`);
console.log(`  Winners na pool: ${getWinnersPool().length}`);
console.log('═══════════════════════════════════════════\n');

// Startup check — recupera execuções perdidas
startupCheck().then(() => {
  // Depois do check inicial, roda o loop normal
  setInterval(checkAndRun, CHECK_INTERVAL_MS);
}).catch(err => {
  console.error('[cron-publicos] Erro no startup check:', err.message);
  // Mesmo com erro, inicia o loop
  setInterval(checkAndRun, CHECK_INTERVAL_MS);
});
