/**
 * Cron Rafa — Relatório Completo + Telegram
 *
 * Uso:
 *   node cron-rafa.js --relatorio-completo  (05h: analisa dia anterior + relatório + PDD)
 *   node cron-rafa.js --analise             (apenas análise manual)
 *   node cron-rafa.js --agenda              (07h: agenda do dia)
 *   node cron-rafa.js --zapecontrol         (21h: resultados do dia)
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

const { generateWithTemplate } = require('./lib/rafa-llm');
const ANALISES_DIR = path.join(__dirname, 'squads/gestao/data/analises');
const CLOSERS_FILE = path.join(__dirname, 'squads/gestao/data/closers.json');
const CREDENTIALS_FILE = path.join(__dirname, '.credentials/google-oauth.json');
const TOKEN_FILE = path.join(__dirname, '.credentials/google-token.json');

// Mapa de cores do Google Calendar → significado comercial Zapeecomm
const COLOR_MAP = {
  '3':  { label: 'Atividade Diária', emoji: '🟣' },
  '11': { label: 'No-show', emoji: '🔴' },
  '10': { label: 'Fechamento', emoji: '🟢' },
  '6':  { label: 'Reagendamento', emoji: '🟠' },
  '5':  { label: 'Reunião de Venda', emoji: '🟡' },
  '9':  { label: 'Falta Confirmação', emoji: '🔵' },
  '1':  { label: 'Falta Confirmação', emoji: '🔵' },
  '8':  { label: 'Bloqueio', emoji: '⚪' },
};

// Telegram config
const TELEGRAM_TOKEN = '8672163588:AAHuG9OHdNUeFgiv7hG_JwYsUHuHeGKiR4Q';
const TELEGRAM_CHAT_ID = '8769046875';

// ============================================================
// Telegram
// ============================================================
function sendTelegram(text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML'
    });

    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Split long messages (Telegram limit: 4096 chars)
async function sendTelegramLong(text) {
  const chunks = [];
  let current = '';
  const lines = text.split('\n');

  for (const line of lines) {
    if ((current + '\n' + line).length > 4000) {
      chunks.push(current);
      current = line;
    } else {
      current += (current ? '\n' : '') + line;
    }
  }
  if (current) chunks.push(current);

  for (const chunk of chunks) {
    await sendTelegram(chunk);
    await new Promise(r => setTimeout(r, 500)); // Rate limit
  }
}

// ============================================================
// MODO ANÁLISE (interno — chamado pelo relatório completo)
// ============================================================
async function runAnalise() {
  console.log('🎯 Rafa — Análise de calls do dia anterior');
  console.log('Horário:', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));

  const config = JSON.parse(fs.readFileSync(CLOSERS_FILE, 'utf-8'));
  const closers = config.closers.filter(c => config.selectedEmails.includes(c.email));

  let totalAnalyzed = 0;
  let totalErrors = 0;
  let totalSkipped = 0;

  for (const closer of closers) {
    try {
      const result = await new Promise((resolve, reject) => {
        const proc = spawn('node', [
          path.join(__dirname, 'analisar-call.js'),
          `--email=${closer.email}`,
          `--closer=${closer.name}`,
          '--days=1'
        ], { cwd: __dirname });

        let output = '';
        proc.stdout.on('data', d => { output += d.toString(); process.stdout.write(d); });
        proc.stderr.on('data', d => process.stderr.write(d));
        proc.on('close', code => {
          const analyzed = (output.match(/Calls analisadas:\s+(\d+)/));
          const errors = (output.match(/Erros:\s+(\d+)/));
          const skipped = (output.match(/já analisado/g) || []).length;
          resolve({
            analyzed: analyzed ? parseInt(analyzed[1]) : 0,
            errors: errors ? parseInt(errors[1]) : 0,
            skipped
          });
        });
      });

      totalAnalyzed += result.analyzed;
      totalErrors += result.errors;
      totalSkipped += result.skipped;
    } catch (e) {
      console.error(`Erro ${closer.name}:`, e.message);
      totalErrors++;
    }
  }

  console.log(`\nAnálise: ${totalAnalyzed} novas, ${totalSkipped} já analisadas, ${totalErrors} erros`);
  return { totalAnalyzed, totalErrors, totalSkipped };
}

// ============================================================
// MODO RELATÓRIO COMPLETO (05h) — Analisa + Relatório + PDD
// ============================================================
async function runRelatorioCompleto() {
  console.log('📊 Rafa — Relatório Completo (análise + relatório + PDD)');
  console.log('Horário:', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));

  // STEP 1: Analisar calls do dia anterior
  await sendTelegram('🎯 <b>Rafa iniciando auditoria + relatório</b>\n\nAnalisando calls de ontem...');

  const analiseResult = await runAnalise();

  // STEP 2: Gerar relatório
  if (!fs.existsSync(ANALISES_DIR)) {
    await sendTelegram('📊 Nenhuma análise encontrada.');
    return;
  }

  // Yesterday's date in São Paulo timezone
  const now = new Date();
  const spNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  spNow.setDate(spNow.getDate() - 1);
  const yesterdayStr = spNow.getFullYear() + '-' + String(spNow.getMonth() + 1).padStart(2, '0') + '-' + String(spNow.getDate()).padStart(2, '0');

  const files = fs.readdirSync(ANALISES_DIR).filter(f => f.endsWith('.json'));
  const allAnalises = files.map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(ANALISES_DIR, f), 'utf-8')); }
    catch { return null; }
  }).filter(Boolean);

  // Filter yesterday's analyses — match by savedAt OR event date
  const analises = allAnalises.filter(a => {
    const saved = a.savedAt || '';
    const eventDate = a.date || '';
    return saved.startsWith(yesterdayStr) || eventDate.startsWith(yesterdayStr);
  });

  if (analises.length === 0) {
    await sendTelegram(`📊 Nenhuma call encontrada para ${yesterdayStr}.\n${analiseResult.totalAnalyzed > 0 ? `(${analiseResult.totalAnalyzed} foram analisadas agora mas com data diferente)` : ''}`);
    return;
  }

  const periodo = 'ontem';

  // Stats
  const closers = {};
  let totalScore = 0;
  let totalFechou = 0;
  const objecoes = {};
  const etapas = {};
  const redFlagsAll = [];

  analises.forEach(a => {
    const name = a.closerName || '?';
    if (!closers[name]) closers[name] = { calls: 0, totalScore: 0, fechou: 0, naoFechou: 0 };
    closers[name].calls++;
    closers[name].totalScore += (a.notaGeral || 0);
    if (a.resultado === 'fechou') { closers[name].fechou++; totalFechou++; }
    if (a.resultado === 'nao_fechou') closers[name].naoFechou++;
    totalScore += (a.notaGeral || 0);

    // Objections
    (a.objecoes || []).forEach(o => {
      const tipo = o.tipo || 'Outro';
      if (!objecoes[tipo]) objecoes[tipo] = 0;
      objecoes[tipo]++;
    });

    // Stages
    (a.etapas || []).forEach(e => {
      if (!etapas[e.nome]) etapas[e.nome] = { total: 0, count: 0 };
      etapas[e.nome].total += (e.nota || 0);
      etapas[e.nome].count++;
    });

    // Red flags
    (a.redFlags || []).forEach(r => {
      redFlagsAll.push({ flag: r, closer: name });
    });
  });

  const avgScore = (totalScore / analises.length).toFixed(1);
  const taxaFech = Math.round((totalFechou / analises.length) * 100);

  // Prepare ranking data
  const ranking = Object.entries(closers).sort((a, b) => (b[1].totalScore / b[1].calls) - (a[1].totalScore / a[1].calls))
    .map(([name, data]) => ({
      name, calls: data.calls,
      nota_media: (data.totalScore / data.calls).toFixed(1),
      fechou: data.fechou, naoFechou: data.naoFechou,
      taxa_fechamento: Math.round((data.fechou / data.calls) * 100)
    }));

  // Prepare objections data
  const objEntries = Object.entries(objecoes).sort((a, b) => b[1] - a[1])
    .map(([tipo, count]) => ({ tipo, count }));

  // Prepare stages data (weakest first)
  const etapaEntries = Object.entries(etapas)
    .map(([nome, data]) => ({ nome, avg: parseFloat((data.total / data.count).toFixed(1)) }))
    .sort((a, b) => a.avg - b.avg);

  // Prepare red flags data
  const flagCount = {};
  redFlagsAll.forEach(r => {
    const key = r.flag.substring(0, 80);
    if (!flagCount[key]) flagCount[key] = { count: 0, closers: [] };
    flagCount[key].count++;
    if (!flagCount[key].closers.includes(r.closer)) flagCount[key].closers.push(r.closer);
  });
  const topRedFlags = Object.entries(flagCount)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([flag, data]) => ({ flag, count: data.count, closers: data.closers }));

  const relatorioData = {
    periodo, total_calls: analises.length, nota_media: avgScore,
    taxa_fechamento: taxaFech, fechamentos: totalFechou,
    nao_fechou: analises.length - totalFechou,
    ranking, objecoes: objEntries,
    etapas: etapaEntries, red_flags: topRedFlags,
    dashboard_url: 'http://187.77.240.222:8889/squad/gestao'
  };

  // Fallback: formato basico se LLM falhar
  function fallbackRelatorio(data) {
    let msg = `📊 <b>RELATÓRIO COMERCIAL — ONTEM (fallback)</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `📞 ${data.total_calls} calls | ⭐ ${data.nota_media}/10 | ✅ ${data.fechamentos} fech. (${data.taxa_fechamento}%)\n\n`;
    msg += `🏆 <b>RANKING</b>\n`;
    const medals = ['🥇', '🥈', '🥉'];
    data.ranking.forEach((r, i) => {
      msg += `${medals[i] || '  '} <b>${r.name}</b>: ${r.nota_media}/10 · ${r.calls} calls · ${r.taxa_fechamento}% fech.\n`;
    });
    if (data.etapas.length > 0) {
      msg += `\n⚠️ <b>ETAPAS MAIS FRACAS</b>\n`;
      data.etapas.slice(0, 5).forEach(e => { msg += `${e.avg >= 7 ? '🟢' : e.avg >= 5 ? '🟡' : '🔴'} ${e.nome}: ${e.avg}/10\n`; });
    }
    msg += `\n<i>— Rafa, elevando o padrão comercial 📊</i>`;
    return msg;
  }

  const msg = await generateWithTemplate({
    templateFile: 'dashboard-comparativo-tmpl.md',
    data: relatorioData,
    systemContext: `Gere o relatorio comercial diario consolidado. Periodo: ontem. Adicione insights estrategicos e acoes sugeridas para o time e individuais. URL do dashboard: ${relatorioData.dashboard_url}`,
    fallbackFn: fallbackRelatorio
  });

  await sendTelegramLong(msg);
  console.log('Relatório enviado!');

  // STEP 3: Generate and send PDDs
  console.log('Gerando PDDs...');
  try {
    await new Promise((resolve, reject) => {
      const proc = require('child_process').spawn('node', [
        path.join(__dirname, 'gerar-pdd-v2.js'),
        '--days=1',
        '--send-telegram'
      ], { cwd: __dirname });

      let pddOutput = '';
      let pddError = '';
      proc.stdout.on('data', d => { pddOutput += d.toString(); process.stdout.write(d); });
      proc.stderr.on('data', d => { pddError += d.toString(); process.stderr.write(d); });
      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`PDD exited with code ${code}: ${pddError.substring(0, 200)}`));
        } else if (pddOutput.includes('Nenhuma análise')) {
          reject(new Error('PDD: nenhuma análise encontrada para gerar PDDs'));
        } else {
          resolve();
        }
      });
      proc.on('error', reject);
    });
    console.log('PDDs enviados!');
  } catch (pddErr) {
    console.error('Erro ao gerar PDDs:', pddErr.message);
    await sendTelegram(`⚠️ <b>Erro ao gerar PDDs</b>\n\n${pddErr.message}\n\nRelatório foi enviado, mas os PDDs falharam. Use <code>node gerar-pdd-v2.js --days=2 --send-telegram</code> para reenviar manualmente.`);
  }

  // STEP 4: Gerar Relatorio Diario de Calls (1 PDF por closer)
  console.log('Gerando Relatórios Diários de Calls...');
  try {
    await new Promise((resolve, reject) => {
      const proc = require('child_process').spawn('node', [
        path.join(__dirname, 'gerar-relatorio-diario.js'),
        '--days=1',
        '--send-telegram'
      ], { cwd: __dirname });

      let rdOutput = '';
      let rdError = '';
      proc.stdout.on('data', d => { rdOutput += d.toString(); process.stdout.write(d); });
      proc.stderr.on('data', d => { rdError += d.toString(); process.stderr.write(d); });
      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Relatorio Diario exited with code ${code}: ${rdError.substring(0, 200)}`));
        } else if (rdOutput.includes('Nenhuma call')) {
          reject(new Error('Relatorio Diario: nenhuma call encontrada'));
        } else {
          resolve();
        }
      });
      proc.on('error', reject);
    });
    console.log('Relatórios Diários enviados!');
  } catch (rdErr) {
    console.error('Erro ao gerar Relatórios Diários:', rdErr.message);
    await sendTelegram(`⚠️ <b>Erro ao gerar Relatórios Diários</b>\n\n${rdErr.message}\n\nUse <code>node gerar-relatorio-diario.js --days=1 --send-telegram</code> para reenviar manualmente.`);
  }
}

// ============================================================
// MODO AGENDA (07h)
// ============================================================
async function runAgenda() {
  console.log('📅 Rafa — Agenda do dia');
  console.log('Horário:', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));

  // Init Google Auth
  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
  const config = creds.installed || creds.web || {};
  const oauth2Client = new google.auth.OAuth2(config.client_id, config.client_secret);
  oauth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')));

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const closersConfig = JSON.parse(fs.readFileSync(CLOSERS_FILE, 'utf-8'));
  const closers = closersConfig.closers || [];

  // Today's range in São Paulo timezone
  const now = new Date();
  const spNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const spDateStr = spNow.getFullYear() + '-' + String(spNow.getMonth() + 1).padStart(2, '0') + '-' + String(spNow.getDate()).padStart(2, '0');
  const todayStart = new Date(spDateStr + 'T00:00:00-03:00');
  const todayEnd = new Date(spDateStr + 'T23:59:59.999-03:00');

  const diaSemana = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long' });
  const dataFormatada = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });

  // Coletar dados de todos os closers
  const closersData = [];
  for (const closer of closers) {
    try {
      const res = await calendar.events.list({
        calendarId: closer.email,
        timeMin: todayStart.toISOString(),
        timeMax: todayEnd.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 30
      });

      const events = res.data.items || [];
      const relevantes = events.filter(ev => {
        const color = COLOR_MAP[ev.colorId] || {};
        return color.emoji !== '⚪';
      });

      const eventosFormatados = relevantes.map(ev => {
        const color = COLOR_MAP[ev.colorId] || { emoji: '🔵', label: 'Falta Confirmação' };
        const hora = new Date(ev.start.dateTime || ev.start.date).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
        return { emoji: color.emoji, label: color.label, hora, titulo: ev.summary || '(sem título)' };
      });

      const counts = { venda: 0, fechamento: 0, noshow: 0, reagendamento: 0, pendente: 0, interno: 0 };
      relevantes.forEach(ev => {
        const c = ev.colorId;
        if (c === '5') counts.venda++;
        else if (c === '10') counts.fechamento++;
        else if (c === '11') counts.noshow++;
        else if (c === '6') counts.reagendamento++;
        else if (c === '9' || c === '1' || !c) counts.pendente++;
        else if (c === '3') counts.interno++;
      });

      closersData.push({ name: closer.name, total_eventos: relevantes.length, counts, eventos: eventosFormatados });
    } catch (e) {
      closersData.push({ name: closer.name, erro: e.message });
    }
  }

  const agendaData = { dia_semana: diaSemana, data_formatada: dataFormatada, closers: closersData };

  // Fallback: formato basico se LLM falhar
  function fallbackAgenda(data) {
    let msg = `📅 <b>AGENDA DO DIA — ${data.dia_semana.toUpperCase()}</b>\n${data.data_formatada}\n━━━━━━━━━━━━━━━━━━━━━\n`;
    for (const c of data.closers) {
      if (c.erro) { msg += `\n👤 <b>${c.name}</b>\n   ⚠️ Erro: ${c.erro}\n`; continue; }
      msg += `\n👤 <b>${c.name}</b> (${c.total_eventos} eventos)\n`;
      if (c.eventos.length === 0) { msg += `   <i>Sem reuniões hoje</i>\n`; continue; }
      for (const ev of c.eventos) { msg += `   ${ev.emoji} ${ev.hora} — ${ev.titulo}\n`; }
    }
    msg += `\n━━━━━━━━━━━━━━━━━━━━━\n<i>— Rafa, bom dia chefe! ☕</i>`;
    return msg;
  }

  const msg = await generateWithTemplate({
    templateFile: 'agenda-tmpl.md',
    data: agendaData,
    systemContext: `Gere a agenda comercial do dia. Adicione 1 linha de comentario estrategico por closer (sobre carga, oportunidades, riscos). Formato HTML para Telegram.`,
    fallbackFn: fallbackAgenda
  });

  await sendTelegramLong(msg);
  console.log('Agenda enviada!');
}

// ============================================================
// MODO RESULTADOS DIA (21h)
// ============================================================
function R$(v) { return 'R$ ' + v.toLocaleString('pt-BR'); }

async function runZapeControl() {
  console.log('📊 Rafa — Resultados do Dia');
  console.log('Horário:', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));

  const sb = createClient(
    process.env.SUPABASE_URL || 'https://mrchphqqgbssndijichd.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yY2hwaHFxZ2Jzc25kaWppY2hkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkxMzc3NCwiZXhwIjoyMDg4NDg5Nzc0fQ.FMJhU6Ryqf554EFy2dXGdfFEQutc6ZHnoyRHk4Nh7BU'
  );

  // Load lookups
  const { data: closersList } = await sb.from('closers').select('*');
  const { data: sdrsList } = await sb.from('sdrs').select('*');
  const closerMap = {};
  (closersList || []).forEach(c => closerMap[c.id] = c.name);
  const sdrMap = {};
  (sdrsList || []).forEach(s => sdrMap[s.id] = s.name);

  // Support --date=YYYY-MM-DD override, otherwise use São Paulo today
  const dateArg = process.argv.find(a => a.startsWith('--date='));
  let todayStr;
  if (dateArg) {
    todayStr = dateArg.split('=')[1];
  } else {
    const today = new Date();
    const spDate = new Date(today.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    todayStr = spDate.getFullYear() + '-' + String(spDate.getMonth() + 1).padStart(2, '0') + '-' + String(spDate.getDate()).padStart(2, '0');
  }
  const targetDate = new Date(todayStr + 'T12:00:00-03:00');
  const todayFormatted = targetDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
  const diaSemana = targetDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long' });

  // Get today's movements
  const { data: movs } = await sb.from('movements').select('*').eq('data_raw', todayStr);

  if (!movs || movs.length === 0) {
    await sendTelegram(`📊 <b>RESULTADOS DO DIA</b> — ${todayFormatted}\n\nNenhum lançamento registrado hoje.`);
    console.log('Sem lançamentos hoje.');
    return;
  }

  // Load metas
  const mesStr = todayStr.substring(0, 7);
  const { data: metasMes } = await sb.from('metas_mensais').select('*').eq('mes', mesStr);
  const { data: metasClosers } = await sb.from('metas_closers').select('*');
  const metaLevels = {};
  (metasMes || []).forEach(m => metaLevels[m.nivel] = m);

  // Build closer meta lookup: closerId -> { minima_diaria, minima_mensal, ... }
  const closerMetas = {};
  (metasClosers || []).forEach(mc => {
    const nivel = metasMes ? metasMes.find(m => m.id === mc.mes_id) : null;
    if (!nivel) return;
    if (!closerMetas[mc.closer_id]) closerMetas[mc.closer_id] = {};
    closerMetas[mc.closer_id][nivel.nivel] = { diaria: mc.meta_diaria, mensal: mc.meta_mensal };
  });

  // Aggregate today
  let totalAgend = 0, totalReun = 0, totalReag = 0, totalNoshow = 0, totalVendas = 0;
  const closerData = {};

  movs.forEach(m => {
    const name = closerMap[m.closer_id] || `Closer #${m.closer_id}`;
    if (!closerData[name]) closerData[name] = { id: m.closer_id, agend: 0, reun: 0, reag: 0, noshow: 0, vendas: 0, ganhos: [] };

    const agend = (m.agendamentos || []).reduce((s, a) => s + a.quantidade, 0);
    const reun = (m.reunioes || []).reduce((s, a) => s + a.quantidade, 0);
    const reag = (m.reagendamentos || []).reduce((s, a) => s + a.quantidade, 0);
    const nosh = (m.noshows || []).reduce((s, a) => s + a.quantidade, 0);
    const vendas = (m.ganhos || []).reduce((s, g) => s + g.valor, 0);

    closerData[name].agend += agend;
    closerData[name].reun += reun;
    closerData[name].reag += reag;
    closerData[name].noshow += nosh;
    closerData[name].vendas += vendas;
    closerData[name].ganhos.push(...(m.ganhos || []));

    totalAgend += agend; totalReun += reun;
    totalReag += reag; totalNoshow += nosh; totalVendas += vendas;
  });

  // Month totals
  const { data: monthMovs } = await sb.from('movements').select('*').gte('data_raw', mesStr + '-01').lte('data_raw', todayStr);
  let totalMes = 0;
  const closerMesVendas = {};
  (monthMovs || []).forEach(m => {
    const name = closerMap[m.closer_id] || `Closer #${m.closer_id}`;
    if (!closerMesVendas[name]) closerMesVendas[name] = 0;
    (m.ganhos || []).forEach(g => { totalMes += g.valor; closerMesVendas[name] += g.valor; });
  });

  // Daily meta check
  const metaDiaria = metaLevels.minima ? metaLevels.minima.meta_diaria_vendas : 0;
  const bateuDia = totalVendas >= metaDiaria;

  // Build niveis for data payload
  const niveisData = [
    { key: 'minima', icon: '🎯', label: 'Mínima' },
    { key: 'super', icon: '⭐', label: 'Super' },
    { key: 'ultra', icon: '🔥', label: 'Ultra' },
    { key: 'black', icon: '🖤', label: 'Black' },
  ].map(n => {
    const meta = metaLevels[n.key];
    if (!meta) return null;
    const pct = Math.round((totalMes / meta.meta_mensal_vendas) * 100);
    return { ...n, meta_mensal: meta.meta_mensal_vendas, pct, falta: pct >= 100 ? 0 : meta.meta_mensal_vendas - totalMes };
  }).filter(Boolean);

  // Build closers data for LLM
  const closersOrdenados = Object.entries(closerData)
    .sort((a, b) => b[1].vendas - a[1].vendas)
    .map(([name, d]) => {
      const metas = closerMetas[d.id] || {};
      const metaDiariaCloser = metas.minima ? metas.minima.diaria : 0;
      const metaMensalCloser = metas.minima ? metas.minima.mensal : 0;
      const acumCloser = closerMesVendas[name] || 0;
      const ganhos = d.ganhos.map(g => ({
        valor: g.valor,
        servico: g.servico_name,
        origem: g.origem_name + (g.sub_origem ? ' / ' + g.sub_origem : ''),
        sdr: g.sdr_name || sdrMap[g.sdr_id] || '?'
      }));
      return {
        name, vendas: d.vendas, agend: d.agend, reun: d.reun, reag: d.reag, noshow: d.noshow,
        meta_diaria: metaDiariaCloser, bateu_meta: metaDiariaCloser > 0 && d.vendas >= metaDiariaCloser,
        ganhos, acumulado_mes: acumCloser, meta_mensal: metaMensalCloser,
        pct_meta_mensal: metaMensalCloser > 0 ? Math.round((acumCloser / metaMensalCloser) * 100) : null
      };
    });

  const zapeData = {
    dia_semana: diaSemana, data_formatada: todayFormatted,
    total_vendas: totalVendas, meta_diaria: metaDiaria, bateu_dia: bateuDia,
    total_agend: totalAgend, total_reun: totalReun, total_reag: totalReag, total_noshow: totalNoshow,
    closers: closersOrdenados,
    total_mes: totalMes, niveis_meta: niveisData
  };

  // Fallback: formato basico se LLM falhar
  function fallbackZapeControl(data) {
    let msg = `📊 <b>RESULTADOS DO DIA (fallback)</b>\n📅 ${data.dia_semana} — ${data.data_formatada}\n\n`;
    msg += `💰 <b>${R$(data.total_vendas)}</b>${data.bateu_dia ? ' ✅' : ' ❌'}\n\n`;
    msg += `📅 ${data.total_agend} agend · 📞 ${data.total_reun} reun · 🟠 ${data.total_reag} reag · 🔴 ${data.total_noshow} noshow\n\n`;
    for (const c of data.closers) {
      msg += `👤 <b>${c.name}</b>: ${R$(c.vendas)}${c.bateu_meta ? ' ✅' : ''}\n`;
    }
    msg += `\n💰 Acumulado mês: <b>${R$(data.total_mes)}</b>\n`;
    msg += `\n<i>— Rafa, fechando o dia 📊</i>`;
    return msg;
  }

  const msg = await generateWithTemplate({
    templateFile: 'resultados-dia-tmpl.md',
    data: zapeData,
    systemContext: `Gere o relatorio de resultados comerciais do dia. Valores monetarios em formato R$ brasileiro. Adicione 2-3 linhas de comentario estrategico ao final analisando performance do dia e projecao do mes.`,
    fallbackFn: fallbackZapeControl
  });

  await sendTelegramLong(msg);
  console.log('Relatório Resultados Dia enviado!');
}

// ============================================================
// Main
// ============================================================
const args = process.argv.slice(2);

if (args.includes('--relatorio-completo') || args.includes('--relatorio')) {
  // Modo principal: analisa dia anterior + relatório + PDD (roda às 05h)
  runRelatorioCompleto().catch(e => {
    console.error('Erro:', e.message);
    sendTelegram(`❌ Erro no relatório completo: ${e.message}`);
  });
} else if (args.includes('--analise')) {
  // Modo standalone: apenas analisa (uso manual)
  runAnalise().then(r => {
    console.log(`Resultado: ${r.totalAnalyzed} novas, ${r.totalSkipped} já analisadas, ${r.totalErrors} erros`);
  }).catch(e => {
    console.error('Erro:', e.message);
    sendTelegram(`❌ Erro na auditoria: ${e.message}`);
  });
} else if (args.includes('--agenda')) {
  runAgenda().catch(e => {
    console.error('Erro:', e.message);
    sendTelegram(`❌ Erro na agenda: ${e.message}`);
  });
} else if (args.includes('--zapecontrol')) {
  runZapeControl().catch(e => {
    console.error('Erro:', e.message);
    sendTelegram(`❌ Erro no relatório ZapeControl: ${e.message}`);
  });
} else if (args.includes('--semanal')) {
  // Relatório Semanal 1:1 (roda às 06h na segunda-feira)
  console.log('📊 Rafa — Relatório Semanal 1:1');
  const proc = require('child_process').spawn('node', [
    path.join(__dirname, 'gerar-relatorio-semanal.js'),
    '--send-telegram'
  ], { cwd: __dirname, stdio: 'inherit' });
  proc.on('close', (code) => {
    if (code !== 0) sendTelegram(`❌ Erro no relatório semanal: exit code ${code}`);
  });
} else {
  console.log('Uso:');
  console.log('  node cron-rafa.js --relatorio-completo  (05h: analisa + relatório + PDD + relatorio diario)');
  console.log('  node cron-rafa.js --analise             (apenas análise manual)');
  console.log('  node cron-rafa.js --agenda              (agenda do dia)');
  console.log('  node cron-rafa.js --zapecontrol         (resultados do dia)');
  console.log('  node cron-rafa.js --semanal             (segunda 06h: relatório semanal 1:1)');
}
