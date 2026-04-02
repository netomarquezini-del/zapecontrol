/**
 * Cron Joana — CS Monitor Alerts, Community Metrics & Reports
 *
 * Every 15 minutes:
 *   1. checkAlerts()            — CS alert check (business hours only)
 *   2. updateCommunityMetrics() — keyword-based community analysis (fast, no AI)
 *
 * Every 1 minute:
 *   1. updateCommunityMetrics() — keyword-based community analysis
 *   2. updateShopeeAdsMetrics() — keyword-based Shopee ADS groups analysis
 *
 * Daily at 06:00 SP:
 *   - Claude API deep analysis (sentiment, topics, insights)
 *
 * Daily at 18:30 SP:
 *   - CS daily report (report-joana.js --diario)
 *   - Community daily report (report-comunidade.js --diario)
 *   - Shopee ADS daily report (report-shopee-ads.js --diario)
 *
 * Friday at 18:30 SP:
 *   - CS weekly report (report-joana.js --semanal)
 *   - Community weekly report (report-comunidade.js --semanal)
 *   - Shopee ADS weekly report (report-shopee-ads.js --semanal)
 *
 * Usage:
 *   node squads/cs/cron-joana.js                        # Run alert check + community metrics once
 *   node squads/cs/cron-joana.js --loop                 # Run continuously every 15 minutes + schedule reports
 *   node squads/cs/cron-joana.js --relatorio-diario     # Run CS daily report immediately
 *   node squads/cs/cron-joana.js --relatorio-semanal    # Run CS weekly report immediately
 *   node squads/cs/cron-joana.js --comunidade-diario    # Run community daily report immediately
 *   node squads/cs/cron-joana.js --comunidade-semanal   # Run community weekly report immediately
 *   node squads/cs/cron-joana.js --shopee-ads-diario    # Run Shopee ADS daily report immediately
 *   node squads/cs/cron-joana.js --shopee-ads-semanal   # Run Shopee ADS weekly report immediately
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// ============================================================
// CONFIGURATION
// ============================================================

const BASE_DIR = path.join(__dirname, '../..');
const ALERT_LOG_FILE = path.join(__dirname, 'data/joana-alerts.log');
const SENT_ALERTS_FILE = path.join(__dirname, 'data/sent-alerts.json');

function loadEnv() {
  const envPath = path.join(BASE_DIR, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.JOANA_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.JOANA_TELEGRAM_CHAT_ID;

const JOANA_ZAPI_BASE_URL = process.env.JOANA_ZAPI_BASE_URL;
const JOANA_ZAPI_CLIENT_TOKEN = process.env.JOANA_ZAPI_CLIENT_TOKEN;

const ALERT_THRESHOLD_MINUTES = 60;
const CHECK_INTERVAL_MS = 1 * 60 * 1000; // 1 minute — real time alerts
const SYNC_INTERVAL_MS = 1 * 60 * 60 * 1000; // 1 hour

// ============================================================
// LOGGING
// ============================================================

function log(level, msg, data) {
  const ts = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const entry = `[${ts}] [JOANA-CRON] [${level}] ${msg}${data ? ' | ' + JSON.stringify(data) : ''}`;
  console.log(entry);
  try {
    fs.mkdirSync(path.dirname(ALERT_LOG_FILE), { recursive: true });
    fs.appendFileSync(ALERT_LOG_FILE, entry + '\n');
  } catch (_) {}
}

// ============================================================
// MESSAGE CLASSIFICATION — Does this message need a response?
// ============================================================

function needsResponse(content) {
  if (!content) return false;
  const text = content.trim().toLowerCase();

  // Very short messages are usually confirmations
  if (text.length < 4 && !text.includes('?')) return false;

  // CONFIRMATION / CLOSING patterns — do NOT need response
  const closingPatterns = [
    // Direct confirmations
    /^(ok|oks|okay|okey)[\s!.]*$/i,
    /^(sim|sii+m|siim)[\s!.]*$/i,
    /^(não|nao|nop|nope)[\s!.]*$/i,
    /^(certo|certinho|certeza)[\s!.]*$/i,
    /^(entendi|entendido|entendo)[\s!.]*$/i,
    /^(perfeito|perfeitinho)[\s!.]*$/i,
    /^(ótimo|otimo|ótima|otima)[\s!.]*$/i,
    /^(beleza|blz|bele)[\s!.]*$/i,
    /^(bom|boa|bora)[\s!.]*$/i,
    /^(tá|ta|tá bom|ta bom|tá certo|ta certo)[\s!.]*$/i,
    /^(show|top|massa|dahora)[\s!.]*$/i,
    /^(valeu|vlw)[\s!.]*$/i,
    /^(pode ser|pode sim|pode)[\s!.]*$/i,
    /^(fechou|feito|pronto)[\s!.]*$/i,
    /^(combinado|combinamos)[\s!.]*$/i,
    /^(vou ver|vou fazer|vou sim)[\s!.]*$/i,
    /^(isso|isso mesmo|exato|exatamente)[\s!.]*$/i,
    /^(ah|ahh|aah|aham|uhum|hmm)[\s!.]*$/i,
    /^(tudo bem|tudo certo|tranquilo)[\s!.]*$/i,

    // Gratitude — does not need response
    /obrigad[oa]/i,
    /agrade[çc]/i,
    /^(thanks|thx|brigad)[\s!.]*$/i,

    // Permission / delegation
    /^(pode|pode sim|pode deixar|pode ser|deixa|deixa comigo)[\s!.,]*$/i,
    /pode deixar/i,
    /da pra fazer/i,
    /ficaremos no aguardo/i,
    /fico no aguardo/i,
    /no aguardo/i,
    /vou aguardar/i,
    /aguardando/i,
    /joia/i,
    /^(sim|não|nao),?\s*(mais|mas|já|ja)\s/i,

    // Greetings alone (no question attached)
    /^(bom dia|boa tarde|boa noite)[\s!.]*$/i,

    // Emojis only
    /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\s👍🙏❤️😊🤝✅]+$/u,

    // Sticker / media-only (content is [sticker], [image], etc)
    /^\[(sticker|figurinha|image|imagem|audio|áudio|video|vídeo|document|documento)\]$/i,

    // Reactions (content is [reação: emoji])
    /^\[rea[çc][ãa]o:/i,
  ];

  for (const pattern of closingPatterns) {
    if (pattern.test(text)) return false;
  }

  // Greetings with names — only filter if JUST a greeting (no question/request after)
  if (/^(bom dia|boa tarde|boa noite|oi|olá|oie|eai|fala)[\s,!.]+\w/i.test(text) && !text.includes('?') && text.length < 60) return false;

  // Short messages with just a name tag or "ok + name"
  if (/^(ok|certo|perfeito|ótimo|entendi|valeu|obrigad[oa])\s+\w{2,15}[\s!.]*$/i.test(text)) return false;

  // "Ok [name]" patterns like "Ok Ju", "Perfeito Fran", "Obrigada Bruna"
  if (/^(ok|certo|perfeito|ótimo|entendi|valeu|obrigad[oa])\s+(ju|fran|bru|re|ca|ana|isa|raf|ces|ita|cam|vic|nic|lui)/i.test(text)) return false;

  // QUESTIONS — definitely need response
  if (text.includes('?')) return true;
  if (/^(como|qual|quais|quando|onde|por que|porque|alguém|algum|será|vocês|vcs|tem como|da pra|dá pra|pode me|preciso|quero|gostaria|necessito)/i.test(text)) return true;

  // REQUESTS — need response
  if (/precis[oa]|ajud[ae]|pode[\s]+(me|verificar|olhar|checar)|quero[\s]+(saber|entender|ver)/i.test(text)) return true;

  // Messages with substantial content (>50 chars) likely need attention
  if (text.length > 50) return true;

  // Medium messages (15-50 chars) — probably informational, borderline
  if (text.length > 15) return true;

  // Short messages without question marks — likely confirmations
  return false;
}

// ============================================================
// BUSINESS HOURS CHECK
// ============================================================

function isBusinessHours() {
  const now = new Date();
  const brTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const day = brTime.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const hour = brTime.getHours();
  const minute = brTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  // Mon-Fri, 08:00-18:00
  if (day >= 1 && day <= 5 && timeInMinutes >= 480 && timeInMinutes <= 1080) {
    return true;
  }
  return false;
}

// ============================================================
// SENT ALERTS TRACKING — per message (alert once per unique client message)
// ============================================================

function loadSentAlerts() {
  try {
    if (fs.existsSync(SENT_ALERTS_FILE)) {
      return JSON.parse(fs.readFileSync(SENT_ALERTS_FILE, 'utf-8'));
    }
  } catch (_) {}
  return {};
}

function saveSentAlerts(alerts) {
  try {
    fs.mkdirSync(path.dirname(SENT_ALERTS_FILE), { recursive: true });
    fs.writeFileSync(SENT_ALERTS_FILE, JSON.stringify(alerts, null, 2));
  } catch (_) {}
}

// Key = groupId + timestamp of client message — unique per message
function getAlertKey(groupId, msgTimestamp) {
  return `${groupId}::${msgTimestamp}`;
}

function canAlert(groupId, msgTimestamp) {
  const sent = loadSentAlerts();
  const key = getAlertKey(groupId, msgTimestamp);
  return !sent[key]; // alert only if we haven't alerted for this exact message
}

function markAlerted(groupId, msgTimestamp) {
  const sent = loadSentAlerts();
  const key = getAlertKey(groupId, msgTimestamp);
  sent[key] = new Date().toISOString();

  // Clean old entries (>24h)
  const dayAgo = Date.now() - 86400000;
  for (const [k, val] of Object.entries(sent)) {
    if (new Date(val).getTime() < dayAgo) delete sent[k];
  }
  saveSentAlerts(sent);
}

// ============================================================
// SUPABASE QUERIES
// ============================================================

function supabaseRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          // Get count from content-range header if available
          const range = res.headers['content-range'];
          const count = range ? parseInt(range.split('/')[1]) : null;
          resolve({ data: parsed, count });
        } catch {
          resolve({ data, count: null });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Supabase timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ============================================================
// TELEGRAM
// ============================================================

function sendTelegram(text) {
  return new Promise((resolve, reject) => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      log('WARN', 'Telegram not configured');
      return resolve(null);
    }

    const body = JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML'
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ raw: data }); }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Telegram timeout')); });
    req.write(body);
    req.end();
  });
}

// ============================================================
// ALERT CHECK — Groups without team response > 1 hour
// ============================================================

async function checkAlerts() {
  if (!isBusinessHours()) {
    log('INFO', 'Outside business hours — skipping alert check');
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    log('ERROR', 'Supabase not configured');
    return;
  }

  log('INFO', 'Running alert check...');

  try {
    // Look back the entire business day (not just 1h) to catch messages that have been waiting longer
    const businessDayStart = new Date();
    const spNow = new Date(businessDayStart.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    spNow.setHours(8, 0, 0, 0);
    const thresholdTime = spNow.toISOString();
    const businessStart = new Date();
    const brNow = new Date(businessStart.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    brNow.setHours(8, 0, 0, 0);

    // Get all active groups, excluding community groups (no alerts for student groups)
    const EXCLUDED_GROUP_IDS = new Set([
      COMMUNITY_GROUP_ID,
      ...SHOPEE_ADS_GROUP_IDS
    ]);
    const groupsRes = await supabaseRequest('cs_groups?is_active=eq.true&select=id,name');
    const groups = (groupsRes.data || []).filter(g => !EXCLUDED_GROUP_IDS.has(g.id));

    if (!Array.isArray(groups) || groups.length === 0) {
      log('INFO', 'No active groups found');
      return;
    }

    let alertCount = 0;

    for (const group of groups) {
      // Get messages for this group since start of business day
      const recentMsgs = await supabaseRequest(
        `cs_messages?group_id=eq.${encodeURIComponent(group.id)}&timestamp=gte.${thresholdTime}&select=sender_name,is_team_member,content,timestamp&order=timestamp.desc&limit=50`
      );

      const msgs = recentMsgs.data;
      if (!Array.isArray(msgs) || msgs.length === 0) continue;

      // Find last client message and last team message
      const lastClientMsg = msgs.find(m => !m.is_team_member);
      const lastTeamMsg = msgs.find(m => m.is_team_member);

      if (!lastClientMsg) continue; // No client message in window

      const clientMsgTime = new Date(lastClientMsg.timestamp);
      const minutesAgo = (Date.now() - clientMsgTime.getTime()) / 60000;

      // Alert if: client sent msg > 1h ago AND no team response after it
      if (minutesAgo >= ALERT_THRESHOLD_MINUTES) {
        const teamRespondedAfter = lastTeamMsg &&
          new Date(lastTeamMsg.timestamp) > clientMsgTime;

        if (!teamRespondedAfter) {
          // Check if the message actually needs a response
          if (!needsResponse(lastClientMsg.content)) {
            continue; // Skip — confirmation/closing message
          }

          // Skip if we already alerted for this exact message
          if (!canAlert(group.id, lastClientMsg.timestamp)) {
            continue; // Already alerted for this message — don't repeat
          }

          // ALERT!
          const waitMinutes = Math.floor(minutesAgo);
          const preview = (lastClientMsg.content || '[mídia]').substring(0, 100);

          const alertText = `⚠️ <b>ALERTA CS — Cliente sem resposta!</b>\n\n` +
            `📌 <b>Grupo:</b> ${group.name}\n` +
            `⏰ <b>Última msg do cliente:</b> ${waitMinutes} min atrás\n` +
            `💬 <b>Mensagem:</b> "${preview}"\n` +
            `👤 <b>De:</b> ${lastClientMsg.sender_name || 'Desconhecido'}\n\n` +
            `🔔 Responda o cliente o mais rápido possível!`;

          log('ALERT', `Group "${group.name}" — ${waitMinutes}min without response`, {
            groupId: group.id,
            clientMsg: preview
          });

          await sendTelegram(alertText);
          markAlerted(group.id, lastClientMsg.timestamp);
          alertCount++;
        }
      }
    }

    log('INFO', `Alert check complete — ${alertCount} alerts sent`);
  } catch (e) {
    log('ERROR', 'Alert check failed', { error: e.message, stack: e.stack });
  }
}

// ============================================================
// GROUP SYNC — Sync groups from Z-API every 6 hours
// ============================================================

async function syncGroups() {
  if (!JOANA_ZAPI_BASE_URL) {
    log('WARN', 'Cannot sync groups: JOANA_ZAPI_BASE_URL not configured');
    return;
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    log('WARN', 'Cannot sync groups: Supabase not configured');
    return;
  }

  log('INFO', 'Starting group sync...');

  try {
    const allGroups = [];
    for (let page = 1; page <= 10; page++) {
      const url = `${JOANA_ZAPI_BASE_URL}/chats?page=${page}&pageSize=500`;
      const res = await new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const req = https.request({
          hostname: parsedUrl.hostname,
          port: 443,
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'GET',
          headers: { 'Client-Token': JOANA_ZAPI_CLIENT_TOKEN || '' }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch { resolve([]); }
          });
        });
        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('Z-API timeout')); });
        req.end();
      });

      if (!Array.isArray(res) || res.length === 0) break;
      const groups = res.filter(g => g.isGroup === true);
      allGroups.push(...groups);
      if (res.length < 500) break;
    }

    let synced = 0;
    for (const g of allGroups) {
      const groupId = g.phone || g.id || '';
      const name = g.name || groupId;
      try {
        await supabaseUpsert('cs_groups', {
          id: groupId, name, is_active: true, updated_at: new Date().toISOString()
        });
        synced++;
      } catch (_) {}
    }

    log('INFO', `Group sync complete: ${synced}/${allGroups.length} groups`);
  } catch (e) {
    log('ERROR', 'Group sync failed', { error: e.message });
  }
}

// Override supabaseRequest to support POST with upsert
function supabaseUpsert(table, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    const bodyStr = JSON.stringify(body);
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'Prefer': 'resolution=merge-duplicates'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(bodyStr);
    req.end();
  });
}

// ============================================================
// COMMUNITY METRICS (keyword-based, runs every 15 min)
// ============================================================

const COMMUNITY_GROUP_ID = '120363401620622735-group';

const SHOPEE_ADS_GROUP_IDS = [
  '120363422457783091-group',
  '120363407332110646-group',
  '120363407280170820-group',
  '120363404311146540-group',
  '120363424726740000-group',
];

const QUESTION_STARTERS = /^(como|alguém|algum|qual|quais|por que|porque|onde|quando|o que|vocês|vcs)/i;
const QUESTION_MARK = /\?/;

function isQuestion(content) {
  if (!content) return false;
  const trimmed = content.trim();
  return QUESTION_MARK.test(trimmed) || QUESTION_STARTERS.test(trimmed);
}

function classifySentimentKeyword(content) {
  const lower = content.toLowerCase();
  const positiveWords = ['consegui', 'obrigado', 'valeu', 'top', 'show', 'funcionou', 'vendendo', 'resultado', 'primeira venda', 'excelente', 'maravilh', 'incrível', 'parabéns', 'perfeito', 'ótimo', 'sensacional', 'arrasou', 'demais'];
  const negativeWords = ['erro', 'problema', 'não consigo', 'dúvida', 'difícil', 'complicado', 'caro', 'cancelar', 'travou', 'bug', 'péssimo', 'horrível', 'frustrad', 'decepcion', 'não funciona', 'não entendi'];
  const hasPositive = positiveWords.some(w => lower.includes(w));
  const hasNegative = negativeWords.some(w => lower.includes(w));
  if (hasPositive && !hasNegative) return 'positive';
  if (hasNegative && !hasPositive) return 'negative';
  return 'neutral';
}

const PT_STOPWORDS = new Set(['de','a','o','que','e','do','da','em','um','para','é','com','não','uma','os','no','se','na','por','mais','as','dos','como','mas','foi','ao','ele','das','tem','à','seu','sua','ou','ser','quando','muito','há','nos','já','está','eu','também','só','pelo','pela','até','isso','ela','entre','era','depois','sem','mesmo','aos','ter','seus','quem','nas','me','esse','eles','estão','você','tinha','foram','essa','num','nem','suas','meu','às','minha','têm','numa','pelos','elas','havia','seja','qual','será','nós','tenho','lhe','deles','essas','esses','pelas','este','tu','te','vocês','vos','lhes','meus','minhas','teu','tua','nosso','nossa','nossos','nossas','dela','delas','esta','estes','estas','aquele','aquela','aqueles','aquelas','isto','aquilo','estou','estamos','estive','esteve','estava','estávamos','estivera','esteja','estejamos','estejam','estivesse','estivéssemos','estivessem','estiver','estivermos','estiverem','sim','nao','boa','bom','ola','oi','tudo','bem','dia','tarde','noite','gente','aqui','ali','la','pra','pro','vai','vou','faz','fez','ver','ter','ser','dar','deu','tá','né','aí','ah','oh','haha','kkk','kk','rs','hehe','então','ainda','sobre','pode','fazer','tem','vou','meu','minha','isso','essa','esse','vocês','gente','pessoal']);

function extractTopWords(messages, limit = 15) {
  const freq = {};
  for (const msg of messages) {
    const words = msg.toLowerCase().replace(/[^\wáàâãéèêíïóôõöúçñ]/g, ' ').split(/\s+/);
    for (const w of words) {
      if (w.length < 3 || PT_STOPWORDS.has(w) || /^\d+$/.test(w)) continue;
      freq[w] = (freq[w] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

async function updateCommunityMetrics() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;

  log('INFO', 'Updating community metrics (keyword-based)...');

  try {
    // Query last 24h messages for community group
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = await supabaseRequest(
      `cs_messages?group_id=eq.${encodeURIComponent(COMMUNITY_GROUP_ID)}&timestamp=gte.${since}&select=id,sender_name,sender_phone,is_team_member,content,timestamp&order=timestamp.asc&limit=10000`
    );

    const messages = Array.isArray(result.data) ? result.data : [];
    if (messages.length === 0) {
      log('INFO', 'No community messages in last 24h');
      return;
    }

    const nonTeamMsgs = messages.filter(m => !m.is_team_member);
    const teamMsgs = messages.filter(m => m.is_team_member);
    const uniqueMembers = new Set(nonTeamMsgs.map(m => m.sender_phone || m.sender_name));
    const questions = nonTeamMsgs.filter(m => m.content && isQuestion(m.content));

    // Sentiment counts
    let positiveCount = 0, negativeCount = 0, neutralCount = 0;
    for (const m of nonTeamMsgs) {
      if (!m.content) continue;
      const s = classifySentimentKeyword(m.content);
      if (s === 'positive') positiveCount++;
      else if (s === 'negative') negativeCount++;
      else neutralCount++;
    }

    const totalSentiment = positiveCount + negativeCount + neutralCount;
    const positivePct = totalSentiment > 0 ? Math.round(positiveCount / totalSentiment * 100) : 0;
    const negativePct = totalSentiment > 0 ? Math.round(negativeCount / totalSentiment * 100) : 0;

    // Top words
    const allContents = messages.filter(m => m.content).map(m => m.content);
    const topWords = extractTopWords(allContents, 15);

    // Participant stats (top 10)
    const participantCounts = {};
    for (const m of nonTeamMsgs) {
      const name = (m.sender_name || 'Desconhecido').replace(/\s*[\|\-]\s*[Zz]ape.*/i, '').trim() || m.sender_name;
      participantCounts[name] = (participantCounts[name] || 0) + 1;
    }
    const topParticipants = Object.entries(participantCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, messages: count }));

    // Peak hours
    const hourCounts = {};
    for (const m of messages) {
      const d = new Date(m.timestamp);
      const spHour = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getHours();
      hourCounts[spHour] = (hourCounts[spHour] || 0) + 1;
    }
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    // Upsert into cs_community_analysis
    const analysisData = {
      group_id: COMMUNITY_GROUP_ID,
      analysis_type: 'keyword_metrics',
      data: {
        total_messages: messages.length,
        active_members: uniqueMembers.size,
        questions_asked: questions.length,
        team_messages: teamMsgs.length,
        sentiment: {
          positive: positiveCount,
          negative: negativeCount,
          neutral: neutralCount,
          positive_pct: positivePct,
          negative_pct: negativePct,
          label: positivePct > 60 ? 'Positivo' : positivePct > 40 ? 'Neutro' : 'Negativo',
        },
        top_words: topWords,
        top_participants: topParticipants,
        peak_hour: peakHour ? { hour: Number(peakHour[0]), count: peakHour[1] } : null,
        period: { from: since, to: new Date().toISOString() },
      },
      created_at: new Date().toISOString(),
    };

    await supabaseUpsert('cs_community_analysis', analysisData);
    log('INFO', `Community metrics updated: ${messages.length} msgs, ${uniqueMembers.size} members, sentiment=${positivePct}% pos`);
  } catch (e) {
    log('ERROR', 'Community metrics update failed', { error: e.message });
  }
}

// ============================================================
// SHOPEE ADS METRICS (keyword-based, runs every 1 min)
// ============================================================

async function updateShopeeAdsMetrics() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;

  log('INFO', 'Updating Shopee ADS metrics (keyword-based)...');

  try {
    // Query last 24h messages for all Shopee ADS groups
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const groupIdsParam = encodeURIComponent(`(${SHOPEE_ADS_GROUP_IDS.join(',')})`);
    const result = await supabaseRequest(
      `cs_messages?group_id=in.${groupIdsParam}&timestamp=gte.${since}&select=id,group_id,sender_name,sender_phone,is_team_member,content,timestamp&order=timestamp.asc&limit=10000`
    );

    const messages = Array.isArray(result.data) ? result.data : [];
    if (messages.length === 0) {
      log('INFO', 'No Shopee ADS messages in last 24h');
      return;
    }

    const nonTeamMsgs = messages.filter(m => !m.is_team_member);
    const teamMsgs = messages.filter(m => m.is_team_member);
    const uniqueMembers = new Set(nonTeamMsgs.map(m => m.sender_phone || m.sender_name));
    const questions = nonTeamMsgs.filter(m => m.content && isQuestion(m.content));

    // Sentiment counts
    let positiveCount = 0, negativeCount = 0, neutralCount = 0;
    for (const m of nonTeamMsgs) {
      if (!m.content) continue;
      const s = classifySentimentKeyword(m.content);
      if (s === 'positive') positiveCount++;
      else if (s === 'negative') negativeCount++;
      else neutralCount++;
    }

    const totalSentiment = positiveCount + negativeCount + neutralCount;
    const positivePct = totalSentiment > 0 ? Math.round(positiveCount / totalSentiment * 100) : 0;
    const negativePct = totalSentiment > 0 ? Math.round(negativeCount / totalSentiment * 100) : 0;

    // Top words
    const allContents = messages.filter(m => m.content).map(m => m.content);
    const topWords = extractTopWords(allContents, 15);

    // Participant stats (top 10)
    const participantCounts = {};
    for (const m of nonTeamMsgs) {
      const name = (m.sender_name || 'Desconhecido').replace(/\s*[\|\-]\s*[Zz]ape.*/i, '').trim() || m.sender_name;
      participantCounts[name] = (participantCounts[name] || 0) + 1;
    }
    const topParticipants = Object.entries(participantCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, messages: count }));

    // Peak hours
    const hourCounts = {};
    for (const m of messages) {
      const d = new Date(m.timestamp);
      const spHour = new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getHours();
      hourCounts[spHour] = (hourCounts[spHour] || 0) + 1;
    }
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

    // Per-group breakdown
    const groupBreakdown = {};
    for (const gid of SHOPEE_ADS_GROUP_IDS) {
      groupBreakdown[gid] = messages.filter(m => m.group_id === gid).length;
    }

    // Upsert into cs_community_analysis
    const analysisData = {
      group_id: 'shopee-ads-combined',
      analysis_type: 'keyword_metrics',
      data: {
        total_messages: messages.length,
        active_members: uniqueMembers.size,
        questions_asked: questions.length,
        team_messages: teamMsgs.length,
        sentiment: {
          positive: positiveCount,
          negative: negativeCount,
          neutral: neutralCount,
          positive_pct: positivePct,
          negative_pct: negativePct,
          label: positivePct > 60 ? 'Positivo' : positivePct > 40 ? 'Neutro' : 'Negativo',
        },
        top_words: topWords,
        top_participants: topParticipants,
        peak_hour: peakHour ? { hour: Number(peakHour[0]), count: peakHour[1] } : null,
        group_breakdown: groupBreakdown,
        group_ids: SHOPEE_ADS_GROUP_IDS,
        period: { from: since, to: new Date().toISOString() },
      },
      created_at: new Date().toISOString(),
    };

    await supabaseUpsert('cs_community_analysis', analysisData);
    log('INFO', `Shopee ADS metrics updated: ${messages.length} msgs, ${uniqueMembers.size} members, sentiment=${positivePct}% pos`);
  } catch (e) {
    log('ERROR', 'Shopee ADS metrics update failed', { error: e.message });
  }
}

// ============================================================
// REPORT SCHEDULING
// ============================================================

function spawnReport(flag) {
  return new Promise((resolve, reject) => {
    log('INFO', `Spawning report: ${flag}`);
    const proc = spawn('node', [
      path.join(__dirname, 'report-joana.js'),
      flag
    ], { cwd: __dirname });

    let output = '';
    proc.stdout.on('data', d => { output += d.toString(); process.stdout.write(d); });
    proc.stderr.on('data', d => process.stderr.write(d));
    proc.on('close', code => {
      if (code === 0) {
        log('INFO', `Report ${flag} finished successfully`);
        resolve(output);
      } else {
        log('ERROR', `Report ${flag} exited with code ${code}`);
        reject(new Error(`Report ${flag} exited with code ${code}`));
      }
    });
    proc.on('error', err => {
      log('ERROR', `Failed to spawn report ${flag}`, { error: err.message });
      reject(err);
    });
  });
}

function spawnCommunityReport(flag) {
  return new Promise((resolve, reject) => {
    log('INFO', `Spawning community report: ${flag}`);
    const proc = spawn('node', [
      path.join(__dirname, 'report-comunidade.js'),
      flag
    ], { cwd: __dirname });

    let output = '';
    proc.stdout.on('data', d => { output += d.toString(); process.stdout.write(d); });
    proc.stderr.on('data', d => process.stderr.write(d));
    proc.on('close', code => {
      if (code === 0) {
        log('INFO', `Community report ${flag} finished successfully`);
        resolve(output);
      } else {
        log('ERROR', `Community report ${flag} exited with code ${code}`);
        reject(new Error(`Community report ${flag} exited with code ${code}`));
      }
    });
    proc.on('error', err => {
      log('ERROR', `Failed to spawn community report ${flag}`, { error: err.message });
      reject(err);
    });
  });
}

function spawnShopeeAdsReport(flag) {
  return new Promise((resolve, reject) => {
    log('INFO', `Spawning Shopee ADS report: ${flag}`);
    const proc = spawn('node', [
      path.join(__dirname, 'report-shopee-ads.js'),
      flag
    ], { cwd: __dirname });

    let output = '';
    proc.stdout.on('data', d => { output += d.toString(); process.stdout.write(d); });
    proc.stderr.on('data', d => process.stderr.write(d));
    proc.on('close', code => {
      if (code === 0) {
        log('INFO', `Shopee ADS report ${flag} finished successfully`);
        resolve(output);
      } else {
        log('ERROR', `Shopee ADS report ${flag} exited with code ${code}`);
        reject(new Error(`Shopee ADS report ${flag} exited with code ${code}`));
      }
    });
    proc.on('error', err => {
      log('ERROR', `Failed to spawn Shopee ADS report ${flag}`, { error: err.message });
      reject(err);
    });
  });
}

function scheduleReports() {
  const SP_TZ = 'America/Sao_Paulo';
  const TARGET_HOUR = 18;
  const TARGET_MINUTE = 30;
  const DAY_MS = 24 * 60 * 60 * 1000;

  function msUntilNext1830() {
    const now = new Date();
    const spNow = new Date(now.toLocaleString('en-US', { timeZone: SP_TZ }));
    const target = new Date(spNow);
    target.setHours(TARGET_HOUR, TARGET_MINUTE, 0, 0);

    if (spNow >= target) {
      // Already past 18:30 today — schedule for tomorrow
      target.setDate(target.getDate() + 1);
    }

    // Calculate diff using the SP-based dates, return ms
    return target.getTime() - spNow.getTime();
  }

  function isFridaySP() {
    const now = new Date();
    const spNow = new Date(now.toLocaleString('en-US', { timeZone: SP_TZ }));
    return spNow.getDay() === 5; // Friday
  }

  const delayMs = msUntilNext1830();
  const delayMin = Math.round(delayMs / 60000);
  log('INFO', `Reports scheduled — first run in ${delayMin} min`);

  // First trigger at next 18:30 SP, then repeat every 24h
  setTimeout(() => {
    // Daily report — runs every day
    log('INFO', 'Triggering daily report (scheduled)');
    spawnReport('--diario').catch(e => log('ERROR', 'Daily report failed', { error: e.message }));

    // Community daily report — runs every day
    log('INFO', 'Triggering community daily report (scheduled)');
    spawnCommunityReport('--diario').catch(e => log('ERROR', 'Community daily report failed', { error: e.message }));

    // Shopee ADS daily report — runs every day
    log('INFO', 'Triggering Shopee ADS daily report (scheduled)');
    spawnShopeeAdsReport('--diario').catch(e => log('ERROR', 'Shopee ADS daily report failed', { error: e.message }));

    // Weekly reports — only on Fridays
    if (isFridaySP()) {
      log('INFO', 'Triggering weekly report (Friday)');
      spawnReport('--semanal').catch(e => log('ERROR', 'Weekly report failed', { error: e.message }));

      log('INFO', 'Triggering community weekly report (Friday)');
      spawnCommunityReport('--semanal').catch(e => log('ERROR', 'Community weekly report failed', { error: e.message }));

      log('INFO', 'Triggering Shopee ADS weekly report (Friday)');
      spawnShopeeAdsReport('--semanal').catch(e => log('ERROR', 'Shopee ADS weekly report failed', { error: e.message }));
    }

    // Then repeat every 24h
    setInterval(() => {
      log('INFO', 'Triggering daily report (scheduled)');
      spawnReport('--diario').catch(e => log('ERROR', 'Daily report failed', { error: e.message }));

      log('INFO', 'Triggering community daily report (scheduled)');
      spawnCommunityReport('--diario').catch(e => log('ERROR', 'Community daily report failed', { error: e.message }));

      log('INFO', 'Triggering Shopee ADS daily report (scheduled)');
      spawnShopeeAdsReport('--diario').catch(e => log('ERROR', 'Shopee ADS daily report failed', { error: e.message }));

      if (isFridaySP()) {
        log('INFO', 'Triggering weekly report (Friday)');
        spawnReport('--semanal').catch(e => log('ERROR', 'Weekly report failed', { error: e.message }));

        log('INFO', 'Triggering community weekly report (Friday)');
        spawnCommunityReport('--semanal').catch(e => log('ERROR', 'Community weekly report failed', { error: e.message }));

        log('INFO', 'Triggering Shopee ADS weekly report (Friday)');
        spawnShopeeAdsReport('--semanal').catch(e => log('ERROR', 'Shopee ADS weekly report failed', { error: e.message }));
      }
    }, DAY_MS);
  }, delayMs);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const loopMode = args.includes('--loop');
  const runDailyReport = args.includes('--relatorio-diario');
  const runWeeklyReport = args.includes('--relatorio-semanal');
  const runCommunityDaily = args.includes('--comunidade-diario');
  const runCommunityWeekly = args.includes('--comunidade-semanal');
  const runShopeeAdsDaily = args.includes('--shopee-ads-diario');
  const runShopeeAdsWeekly = args.includes('--shopee-ads-semanal');

  // Single-run report modes
  if (runDailyReport) {
    log('INFO', 'Running daily report (manual trigger)');
    await spawnReport('--diario');
    return;
  }

  if (runWeeklyReport) {
    log('INFO', 'Running weekly report (manual trigger)');
    await spawnReport('--semanal');
    return;
  }

  if (runCommunityDaily) {
    log('INFO', 'Running community daily report (manual trigger)');
    await spawnCommunityReport('--diario');
    return;
  }

  if (runCommunityWeekly) {
    log('INFO', 'Running community weekly report (manual trigger)');
    await spawnCommunityReport('--semanal');
    return;
  }

  if (runShopeeAdsDaily) {
    log('INFO', 'Running Shopee ADS daily report (manual trigger)');
    await spawnShopeeAdsReport('--diario');
    return;
  }

  if (runShopeeAdsWeekly) {
    log('INFO', 'Running Shopee ADS weekly report (manual trigger)');
    await spawnShopeeAdsReport('--semanal');
    return;
  }

  log('INFO', `Joana Cron started (mode: ${loopMode ? 'loop' : 'single run'})`);

  // Run immediately
  await checkAlerts();
  await updateCommunityMetrics();
  await updateShopeeAdsMetrics();

  if (loopMode) {
    log('INFO', `Loop mode — checking alerts every ${CHECK_INTERVAL_MS / 60000} minutes, metrics every 1 minute`);
    setInterval(async () => {
      try { await checkAlerts(); }
      catch (e) { log('ERROR', 'Alert check failed in loop', { error: e.message }); }
    }, CHECK_INTERVAL_MS);

    // Metrics every 1 minute
    setInterval(async () => {
      try { await updateCommunityMetrics(); }
      catch (e) { log('ERROR', 'Community metrics failed in loop', { error: e.message }); }
      try { await updateShopeeAdsMetrics(); }
      catch (e) { log('ERROR', 'Shopee ADS metrics failed in loop', { error: e.message }); }
    }, 60 * 1000);

    // Sync groups every 6 hours
    syncGroups().catch(e => log('ERROR', 'Initial group sync failed', { error: e.message }));
    setInterval(async () => {
      try { await syncGroups(); }
      catch (e) { log('ERROR', 'Group sync failed', { error: e.message }); }
    }, SYNC_INTERVAL_MS);

    // Calculate Health Scores every 4 hours
    async function runHealthScores() {
      log('INFO', 'Calculating health scores...');
      try {
        const result = await supabaseRequest('rpc/calculate_health_scores', 'POST');
        const count = Array.isArray(result.data) ? result.data.length : 0;
        log('INFO', `Health scores calculated for ${count} groups`);
      } catch (e) {
        log('ERROR', 'Health score calculation failed', { error: e.message });
      }
    }
    runHealthScores();
    setInterval(runHealthScores, 12 * 60 * 60 * 1000); // every 12 hours

    // Trigger community AI analysis 5x/day at 06:00, 09:00, 12:00, 15:00, 18:00 SP
    function scheduleCommunityAnalysis() {
      const SP_TZ = 'America/Sao_Paulo';
      const RUN_HOURS = [6, 9, 12, 15, 18]; // 5x per day
      const CHECK_INTERVAL = 60 * 1000; // check every 1 minute

      let lastRunHour = -1;

      const runAnalysis = async () => {
        log('INFO', 'Triggering community AI analysis...');
        try {
          const sixHoursAgo = new Date();
          sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

          const body = JSON.stringify({
            from: sixHoursAgo.toISOString(),
            to: new Date().toISOString()
          });

          const parsedUrl = new URL('https://zapecontrol.vercel.app/api/cs/community-analysis');
          const req = https.request({
            hostname: parsedUrl.hostname,
            port: 443,
            path: parsedUrl.pathname,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body),
              'x-cron-secret': process.env.CRON_SECRET || 'joana-cs-cron-2026'
            }
          }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => log('INFO', 'Community AI analysis complete', { response: data.substring(0, 300) }));
          });
          req.on('error', e => log('ERROR', 'Community AI analysis request failed', { error: e.message }));
          req.write(body);
          req.end();
        } catch (e) {
          log('ERROR', 'Community AI analysis failed', { error: e.message });
        }
      };

      // Check every minute if it's time to run
      setInterval(() => {
        const now = new Date();
        const spNow = new Date(now.toLocaleString('en-US', { timeZone: SP_TZ }));
        const currentHour = spNow.getHours();
        const currentMinute = spNow.getMinutes();

        // Run if it's one of the target hours, within first 2 minutes, and we haven't run this hour yet
        if (RUN_HOURS.includes(currentHour) && currentMinute < 2 && lastRunHour !== currentHour) {
          lastRunHour = currentHour;
          runAnalysis();
        }
      }, CHECK_INTERVAL);

      log('INFO', `Community AI analysis scheduled — runs at ${RUN_HOURS.map(h => h + ':00').join(', ')} SP`);
    }
    scheduleCommunityAnalysis();

    // Schedule daily & weekly reports at 18:30 São Paulo time
    scheduleReports();
  }
}

main().catch(e => {
  log('ERROR', 'Fatal error', { error: e.message, stack: e.stack });
  process.exit(1);
});
