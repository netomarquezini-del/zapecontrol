/**
 * Rafa Audit Cron — Auditoria diária das conversas da Lola
 *
 * Roda todo dia às 20h (São Paulo).
 * Lê conversas do dia, analisa como Rafa (Head Comercial),
 * gera relatório com sugestões de melhoria, envia no Telegram
 * e aguarda aprovação do Neto pra aplicar.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { generateWithTemplate } = require('./lib/rafa-llm');

// ============================================================
// CONFIG
// ============================================================

const BASE_DIR = __dirname;
const LEADS_DIR = path.join(BASE_DIR, 'squads/gestao/data/leads');
const REPORTS_DIR = path.join(BASE_DIR, 'squads/gestao/data/relatorios');
const PENDING_FILE = path.join(BASE_DIR, 'squads/gestao/data/pending-improvements.json');
const DNA_FILE = path.join(BASE_DIR, 'squads/gestao/agents/dna/head-comercial-dna.md');
const PROCESSO_FILE = path.join(BASE_DIR, 'squads/gestao/data/processo-completo-lola-sdr.md');

// Load .env
const envPath = path.join(BASE_DIR, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  });
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TELEGRAM_TOKEN = '8672163588:AAHuG9OHdNUeFgiv7hG_JwYsUHuHeGKiR4Q';
const ALLOWED_CHAT_ID = 8769046875;

// ============================================================
// TELEGRAM
// ============================================================

function telegramAPI(method, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_TOKEN}/${method}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { resolve({}); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendTelegram(text) {
  const chunks = [];
  let current = '';
  for (const line of text.split('\n')) {
    if ((current + '\n' + line).length > 4000) {
      chunks.push(current);
      current = line;
    } else {
      current += (current ? '\n' : '') + line;
    }
  }
  if (current) chunks.push(current);

  for (const chunk of chunks) {
    await telegramAPI('sendMessage', {
      chat_id: ALLOWED_CHAT_ID,
      text: chunk,
      parse_mode: 'HTML'
    });
    if (chunks.length > 1) await new Promise(r => setTimeout(r, 500));
  }
}

// ============================================================
// OPENAI
// ============================================================

function callOpenAI(systemPrompt, userMessage) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.5,
      max_tokens: 4000
    });

    const req = https.request({
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.choices?.[0]?.message?.content || '');
        } catch (e) {
          reject(new Error(`OpenAI parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('OpenAI timeout')); });
    req.write(body);
    req.end();
  });
}

// ============================================================
// AUDIT LOGIC
// ============================================================

function getLeadsWithActivityToday() {
  if (!fs.existsSync(LEADS_DIR)) return [];

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const files = fs.readdirSync(LEADS_DIR).filter(f => f.endsWith('.json'));
  const activeLeads = [];

  for (const file of files) {
    try {
      const lead = JSON.parse(fs.readFileSync(path.join(LEADS_DIR, file), 'utf-8'));
      if (!lead.messages || lead.messages.length === 0) continue;

      // Check if any messages were sent today
      const todayMsgs = lead.messages.filter(m => {
        return m.timestamp && m.timestamp.startsWith(todayStr);
      });

      if (todayMsgs.length > 0) {
        activeLeads.push({
          name: lead.name || lead.phone,
          phone: lead.phone,
          state: lead.state,
          qualifyStep: lead.qualifyStep || 0,
          portoes: [lead.portao_dor, lead.portao_urgencia, lead.portao_objetivo].filter(Boolean).length,
          totalMsgs: lead.messages.length,
          todayMsgs: todayMsgs.length,
          messages: lead.messages, // full conversation
          roas: lead.roas,
          faturamento_mensal: lead.faturamento_mensal,
          maior_dor: lead.maior_dor,
          objetivo: lead.objetivo
        });
      }
    } catch (e) { /* skip invalid files */ }
  }

  return activeLeads;
}

function formatConversation(lead) {
  let conv = `\n--- LEAD: ${lead.name} (${lead.phone}) ---\n`;
  conv += `Estado: ${lead.state} | Step: ${lead.qualifyStep}/6 | Portões: ${lead.portoes}/3\n`;
  conv += `ROAS: ${lead.roas || '?'} | Faturamento: ${lead.faturamento_mensal || '?'} | Dor: ${lead.maior_dor || '?'} | Objetivo: ${lead.objetivo || '?'}\n`;
  conv += `Msgs hoje: ${lead.todayMsgs} | Total: ${lead.totalMsgs}\n\n`;

  for (const msg of lead.messages) {
    const time = new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const role = msg.role === 'lola' ? '📲 LOLA' : '👤 LEAD';
    conv += `[${time}] ${role}: ${msg.text}\n`;
  }

  return conv;
}

async function runAudit() {
  console.log(`[${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}] Iniciando auditoria diária...`);

  const leads = getLeadsWithActivityToday();

  if (leads.length === 0) {
    console.log('Nenhuma conversa hoje. Pulando auditoria.');
    await sendTelegram('🎯 <b>Rafa — Auditoria Diária</b>\n\nNenhuma conversa da Lola hoje. Nada pra auditar.');
    return;
  }

  // Format all conversations
  const conversations = leads.map(formatConversation).join('\n\n');

  const auditData = {
    data: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    total_conversas: leads.length,
    conversas: conversations,
    leads_resumo: leads.map(l => ({
      name: l.name, phone: l.phone, state: l.state,
      qualifyStep: l.qualifyStep, portoes: l.portoes,
      todayMsgs: l.todayMsgs, totalMsgs: l.totalMsgs
    }))
  };

  const systemContext = `Audite as conversas da LOLA (SDR automatizada via WhatsApp) que aconteceram hoje.
A Lola qualifica leads que compraram o Shopee ADS 2.0 (R$97) para agendar call com os executivos.

Para cada conversa, avalie:
1. NOTA GERAL (0-10) com justificativa
2. ACERTOS — o que a Lola fez bem
3. ERROS — onde errou (com trecho exato da conversa)
4. RED FLAGS — violacoes graves das regras
5. NATURALIDADE (0-10) — pareceu humana ou robo?
6. SEGUIU O PROCESSO? — pulou etapas? fez perguntas demais de uma vez?
7. QUALIFICACAO — os portoes foram bem detectados?
8. SUGESTOES DE MELHORIA — instrucoes CONCRETAS para o system prompt da Lola`;

  // Fallback: dados brutos
  function fallbackAudit(data) {
    let msg = `🎯 <b>RAFA — Auditoria Diária da Lola (fallback)</b>\n`;
    msg += `📅 ${data.data}\n📊 ${data.total_conversas} conversas\n\n`;
    msg += `⚠️ LLM indisponível — dados brutos:\n\n`;
    for (const l of data.leads_resumo) {
      msg += `👤 ${l.name} (${l.phone}) — State: ${l.state}, Step: ${l.qualifyStep}/6, Portões: ${l.portoes}/3, Msgs hoje: ${l.todayMsgs}\n`;
    }
    return msg;
  }

  try {
    console.log('Chamando Claude para auditoria...');
    const report = await generateWithTemplate({
      templateFile: 'auditoria-lola-tmpl.md',
      data: auditData,
      systemContext,
      fallbackFn: fallbackAudit,
      timeout: 120000 // 2 min — audit can be long with many conversations
    });

    // Save report
    if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const timestamp = Date.now();
    const reportFile = path.join(REPORTS_DIR, `lola-audit-${timestamp}.txt`);
    fs.writeFileSync(reportFile, report);
    console.log(`Relatório salvo em ${reportFile}`);

    // Extract improvement suggestions (everything after "SUGESTOES" or "MELHORIA")
    const suggestionsMatch = report.match(/(?:SUGEST[OÕ]ES|MELHORIA|INSTRU[CÇ][OÕ]ES)[\s\S]*$/i);
    const suggestions = suggestionsMatch ? suggestionsMatch[0] : '';

    // Save pending improvements
    if (suggestions) {
      fs.writeFileSync(PENDING_FILE, JSON.stringify({
        timestamp: new Date().toISOString(),
        suggestions: suggestions,
        applied: false,
        reportFile: reportFile
      }, null, 2));
    }

    // Send to Telegram
    const header = `🎯 <b>RAFA — Auditoria Diária da Lola</b>\n📅 ${auditData.data}\n📊 ${leads.length} conversa${leads.length > 1 ? 's' : ''} analisada${leads.length > 1 ? 's' : ''}\n\n`;

    await sendTelegram(header + report);

    // Ask for approval
    if (suggestions) {
      await new Promise(r => setTimeout(r, 2000));
      await sendTelegram(
        `\n⚡ <b>APROVAÇÃO NECESSÁRIA</b>\n\n` +
        `O relatório acima contém sugestões de melhoria para a Lola.\n\n` +
        `Responda <b>APROVAR LOLA</b> para eu aplicar as melhorias no prompt dela.\n` +
        `Responda <b>IGNORAR</b> para manter como está.\n\n` +
        `— Rafa, elevando o padrão comercial 📊`
      );
    }

    console.log('Auditoria enviada pro Telegram com sucesso!');

  } catch (e) {
    console.error('Erro na auditoria:', e.message);
    await sendTelegram(`❌ <b>Erro na auditoria diária</b>\n\n${e.message}`);
  }
}

// ============================================================
// CRON SCHEDULE
// ============================================================

function scheduleDaily() {
  function checkAndRun() {
    const now = new Date();
    const sp = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const hour = sp.getHours();
    const minute = sp.getMinutes();

    // Run at 20:00 São Paulo time
    if (hour === 20 && minute === 0) {
      runAudit();
    }
  }

  // Check every minute
  setInterval(checkAndRun, 60000);
  console.log(`[Rafa Audit] Cron agendado: diariamente às 20h (São Paulo)`);
  console.log(`[Rafa Audit] Próxima execução: hoje às 20h (se ainda não passou)`);
}

// ============================================================
// HANDLE APPROVAL FROM TELEGRAM (via telegram-rafa.js)
// ============================================================

// This function is called by telegram-rafa.js when Neto sends "APROVAR LOLA"
function getPendingImprovements() {
  if (!fs.existsSync(PENDING_FILE)) return null;
  try {
    const pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'));
    if (pending.applied) return null;
    return pending;
  } catch { return null; }
}

function markImprovementsApplied() {
  if (!fs.existsSync(PENDING_FILE)) return;
  try {
    const pending = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf-8'));
    pending.applied = true;
    pending.appliedAt = new Date().toISOString();
    fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));
  } catch { /* ok */ }
}

// ============================================================
// MAIN
// ============================================================

if (require.main === module) {
  // Run as standalone cron
  const args = process.argv.slice(2);

  if (args.includes('--now')) {
    // Run audit immediately (for testing)
    console.log('Running audit NOW (--now flag)');
    runAudit().then(() => {
      console.log('Done.');
      setTimeout(() => process.exit(0), 5000);
    });
  } else {
    // Start cron
    scheduleDaily();
  }
}

module.exports = { runAudit, getPendingImprovements, markImprovementsApplied };
