const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { google } = require('googleapis');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 8889;
process.env.TZ = 'America/Sao_Paulo';

// ============================================================
// GOOGLE CALENDAR — OAuth2 + API
// ============================================================
const CREDENTIALS_FILE = path.join(__dirname, '.credentials/google-oauth.json');
const TOKEN_FILE = path.join(__dirname, '.credentials/google-token.json');
const CLOSERS_FILE = path.join(__dirname, 'squads/gestao/data/closers.json');

let oauth2Client = null;

function initGoogleAuth() {
  try {
    const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
    const config = creds.installed || creds.web || {};
    const { client_id, client_secret } = config;
    // Desktop app uses localhost redirect, we handle the callback on our server
    const redirect_uri = `http://localhost:${PORT}/auth/google/callback`;
    oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

    // Load saved token if exists
    if (fs.existsSync(TOKEN_FILE)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
      oauth2Client.setCredentials(token);

      // Auto-refresh token
      oauth2Client.on('tokens', (tokens) => {
        const existing = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
        const updated = { ...existing, ...tokens };
        fs.writeFileSync(TOKEN_FILE, JSON.stringify(updated, null, 2));
        console.log('Google Calendar: Token refreshed');
      });

      console.log('Google Calendar: Token loaded');
    } else {
      console.log('Google Calendar: No token — visit /auth/google to authenticate');
    }
  } catch (e) {
    console.log('Google Calendar: Credentials not found or invalid:', e.message);
  }
}

function isGoogleAuthed() {
  return oauth2Client && oauth2Client.credentials && oauth2Client.credentials.access_token;
}

function getClosersConfig() {
  if (fs.existsSync(CLOSERS_FILE)) {
    return JSON.parse(fs.readFileSync(CLOSERS_FILE, 'utf-8'));
  }
  return { closers: [], selectedEmails: [] };
}

function saveClosersConfig(config) {
  fs.mkdirSync(path.dirname(CLOSERS_FILE), { recursive: true });
  fs.writeFileSync(CLOSERS_FILE, JSON.stringify(config, null, 2));
}

// ============================================================
// SQUAD REGISTRY — Multi-squad support
// ============================================================
const SQUADS = {
  zapeads: {
    name: 'ZapeAds',
    icon: '🦅',
    description: 'Inteligência de anúncios e criativos Shopee',
    dir: path.join(__dirname, 'squads/zapeads'),
    squadDir: path.join(__dirname, 'squads/zapeads/squad'),
    commandsDir: path.join(__dirname, 'squads/zapeads/.claude/commands'),
    intelDir: path.join(__dirname, 'squads/zapeads/intel'),
    creativosDir: path.join(__dirname, 'squads/zapeads/criativos'),
    produtosDir: path.join(__dirname, 'squads/zapeads/produtos'),
    statusFile: path.join(__dirname, 'squads/zapeads/dashboard/status.json'),
  },
  gestao: {
    name: 'Gestão Comercial',
    icon: '🎯',
    description: 'Auditoria de calls, SPIN Selling, coaching',
    dir: path.join(__dirname, 'squads/gestao'),
    squadDir: path.join(__dirname, 'squads/gestao/agents'),
    commandsDir: path.join(__dirname, 'squads/gestao/tasks'),
    intelDir: path.join(__dirname, 'squads/gestao/data'),
    statusFile: path.join(__dirname, 'squads/gestao/data/status.json'),
  },
  cs: {
    name: 'Customer Success',
    icon: '💜',
    description: 'Monitoramento de grupos, health score, relatórios CS',
    dir: path.join(__dirname, 'squads/cs'),
    squadDir: path.join(__dirname, 'squads/cs/agents'),
    commandsDir: path.join(__dirname, 'squads/cs/tasks'),
    intelDir: path.join(__dirname, 'squads/cs/data'),
    statusFile: path.join(__dirname, 'squads/cs/data/status.json'),
  }
};

// State per squad
const squadAgents = new Map(); // squadId -> Map(agentId -> agent)
const runningProcesses = new Map();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  next();
});

// ============================================================
// HUB — Serve hub page at root
// ============================================================
app.use('/hub', express.static(path.join(__dirname, 'dashboard')));

// Redirect root to hub
app.get('/', (req, res) => res.redirect('/hub'));

// ============================================================
// GOOGLE AUTH ROUTES
// ============================================================
app.get('/auth/google', (req, res) => {
  if (!oauth2Client) return res.status(500).json({ error: 'Google OAuth not configured' });
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events']
  });
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  if (!oauth2Client) return res.status(500).send('OAuth not configured');
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
    console.log('Google Calendar: Authenticated successfully');
    res.redirect('/squad/gestao?auth=success');
  } catch (e) {
    console.error('Google Auth error:', e.message);
    res.status(500).send(`Auth failed: ${e.message}`);
  }
});

app.get('/auth/google/status', (req, res) => {
  res.json({ authenticated: isGoogleAuthed() });
});

// ============================================================
// GOOGLE CALENDAR API — Closers & Events
// ============================================================
app.get('/api/gestao/calendars', async (req, res) => {
  if (!isGoogleAuthed()) return res.status(401).json({ error: 'Not authenticated', authUrl: '/auth/google' });
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const config = getClosersConfig();

    // Get all closer emails + check each one
    const calendars = [];
    for (const closer of config.closers) {
      try {
        // Try to access the closer's calendar to verify access
        const now = new Date();
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const eventsRes = await calendar.events.list({
          calendarId: closer.email,
          timeMin: weekAgo.toISOString(),
          timeMax: now.toISOString(),
          maxResults: 1
        });
        calendars.push({
          id: closer.email,
          summary: closer.name || closer.email,
          description: closer.email,
          primary: false,
          accessRole: 'reader',
          accessible: true,
          eventCount: eventsRes.data.items?.length || 0
        });
      } catch (e) {
        calendars.push({
          id: closer.email,
          summary: closer.name || closer.email,
          description: closer.email,
          primary: false,
          accessRole: 'none',
          accessible: false,
          error: e.message?.substring(0, 80)
        });
      }
    }

    // Also include own calendar
    const ownRes = await calendar.calendarList.list();
    const ownCals = (ownRes.data.items || [])
      .filter(c => c.primary)
      .map(c => ({
        id: c.id,
        summary: c.summary || c.id,
        description: 'Sua agenda principal',
        primary: true,
        accessRole: c.accessRole,
        accessible: true
      }));

    res.json([...ownCals, ...calendars]);
  } catch (e) {
    if (e.code === 401 || e.message?.includes('invalid_grant')) {
      if (fs.existsSync(TOKEN_FILE)) fs.unlinkSync(TOKEN_FILE);
      return res.status(401).json({ error: 'Token expired', authUrl: '/auth/google' });
    }
    res.status(500).json({ error: e.message });
  }
});

// Add new closer
app.post('/api/gestao/closers/add', (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const config = getClosersConfig();
  if (!config.closers.find(c => c.email === email)) {
    config.closers.push({ email, name: name || email });
    config.selectedEmails.push(email);
    saveClosersConfig(config);
  }
  res.json({ ok: true });
});

// Remove closer
app.delete('/api/gestao/closers/:email', (req, res) => {
  const config = getClosersConfig();
  config.closers = config.closers.filter(c => c.email !== req.params.email);
  config.selectedEmails = config.selectedEmails.filter(e => e !== req.params.email);
  saveClosersConfig(config);
  res.json({ ok: true });
});

// Get/save closers selection
app.get('/api/gestao/closers', (req, res) => {
  res.json(getClosersConfig());
});

app.post('/api/gestao/closers', (req, res) => {
  const config = req.body;
  saveClosersConfig(config);
  res.json({ ok: true });
});

// Get available slots for Lola SDR scheduling
app.get('/api/lola/available-slots', async (req, res) => {
  if (!isGoogleAuthed()) return res.json({ error: 'Calendar not authenticated', slots: [] });

  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const config = getClosersConfig();
    const executivos = config.closers || [];

    if (executivos.length === 0) return res.json({ slots: [], error: 'No executivos configured' });

    const slots = [];

    // Get current date in São Paulo timezone correctly
    const spDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
    const [spYear, spMonth, spDay] = spDateStr.split('-').map(Number);

    // Check next 5 business days
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const date = new Date(spYear, spMonth - 1, spDay + dayOffset);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

      const dateISO = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      const dayStr = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' });

      // Check each executivo's calendar
      for (const exec of executivos) {
        try {
          const dayStart = new Date(`${dateISO}T10:00:00-03:00`);
          const dayEnd = new Date(`${dateISO}T17:00:00-03:00`);

          const eventsRes = await calendar.events.list({
            calendarId: exec.email,
            timeMin: dayStart.toISOString(),
            timeMax: dayEnd.toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
          });

          const busyTimes = (eventsRes.data.items || []).map(e => ({
            start: new Date(e.start.dateTime || e.start.date),
            end: new Date(e.end.dateTime || e.end.date)
          }));

          // Generate available 1h slots (10h, 11h, 14h, 15h, 16h)
          const slotHours = [10, 11, 14, 15, 16];
          for (const hour of slotHours) {
            const slotStart = new Date(`${dateISO}T${String(hour).padStart(2,'0')}:00:00-03:00`);
            const slotEnd = new Date(`${dateISO}T${String(hour+1).padStart(2,'0')}:00:00-03:00`);

            const isBusy = busyTimes.some(b =>
              slotStart < b.end && slotEnd > b.start
            );

            if (!isBusy) {
              slots.push({
                executivo: exec.name || exec.email,
                email: exec.email,
                date: dateISO,
                dayStr: dayStr,
                hour: `${hour}h`,
                hourFull: `${String(hour).padStart(2,'0')}:00`
              });
            }
          }
        } catch(e) {
          // Calendar access failed for this exec, skip
        }
      }

      if (slots.length >= 10) break; // Enough options
    }

    res.json({ slots });
  } catch(e) {
    res.json({ slots: [], error: e.message });
  }
});

// Create meeting with Google Meet for Lola SDR
app.post('/api/lola/create-meeting', async (req, res) => {
  if (!isGoogleAuthed()) return res.status(401).json({ error: 'Calendar not authenticated' });

  try {
    const { leadName, leadPhone, executivoEmail, executivoName, date, hour, briefing, fonte } = req.body;
    if (!executivoEmail || !date || !hour) return res.status(400).json({ error: 'Missing required fields' });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const startTime = new Date(`${date}T${hour}:00-03:00`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1h duration

    // Anti double-booking: verify slot is still free before creating
    const existingEvents = await calendar.events.list({
      calendarId: executivoEmail,
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      singleEvents: true
    });
    const conflicting = (existingEvents.data.items || []).filter(e => {
      // Ignore declined events
      const selfAttendee = (e.attendees || []).find(a => a.email === executivoEmail);
      return !selfAttendee || selfAttendee.responseStatus !== 'declined';
    });
    if (conflicting.length > 0) {
      return res.status(409).json({
        error: 'Slot no longer available — double booking prevented',
        conflictCount: conflicting.length,
        suggestion: 'Fetch /api/lola/available-slots for updated availability'
      });
    }

    // Título: "Fonte | Nome do Lead" — cor amarela (colorId 5)
    const eventTitle = `${fonte || 'Shopee ADS 2.0'} | ${leadName || 'Lead'} | Lola`;

    const event = {
      summary: eventTitle,
      colorId: '5', // Amarelo (Banana) no Google Calendar
      description: `📋 BRIEFING DO LEAD\n\n👤 Lead: ${leadName || 'N/A'}\n📲 WhatsApp: ${leadPhone || 'N/A'}\n👔 Executivo: ${executivoName || 'N/A'}\n📦 Fonte: ${fonte || 'Shopee ADS 2.0'}\n\n${briefing || '(sem briefing)'}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/Sao_Paulo'
      },
      conferenceData: {
        createRequest: {
          requestId: `lola-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 5 }
        ]
      }
    };

    const result = await calendar.events.insert({
      calendarId: executivoEmail,
      resource: event,
      conferenceDataVersion: 1
    });

    const meetLink = result.data.conferenceData?.entryPoints?.[0]?.uri || result.data.hangoutLink || null;

    res.json({
      success: true,
      eventId: result.data.id,
      meetLink: meetLink,
      htmlLink: result.data.htmlLink,
      start: result.data.start.dateTime,
      end: result.data.end.dateTime
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Get events with transcriptions from selected calendars
app.get('/api/gestao/calls', async (req, res) => {
  if (!isGoogleAuthed()) return res.status(401).json({ error: 'Not authenticated' });

  const config = getClosersConfig();
  const selectedEmails = config.selectedEmails || [];
  if (selectedEmails.length === 0) return res.json([]);

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const days = parseInt(req.query.days) || 7;
  const timeMin = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date().toISOString();

  const allEvents = [];

  for (const email of selectedEmails) {
    try {
      const response = await calendar.events.list({
        calendarId: email,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 50
      });

      const events = (response.data.items || [])
        .filter(e => e.description && e.description.length > 200) // likely has transcription
        .map(e => ({
          id: e.id,
          calendarId: email,
          closerEmail: email,
          closerName: config.closers.find(c => c.email === email)?.name || email,
          summary: e.summary || '(sem título)',
          start: e.start?.dateTime || e.start?.date,
          end: e.end?.dateTime || e.end?.date,
          description: e.description,
          descriptionPreview: e.description.substring(0, 300),
          hasTranscription: e.description.length > 500,
          attendees: (e.attendees || []).map(a => ({ email: a.email, name: a.displayName }))
        }));

      allEvents.push(...events);
    } catch (e) {
      console.error(`Calendar ${email} error:`, e.message);
    }
  }

  allEvents.sort((a, b) => new Date(b.start) - new Date(a.start));
  res.json(allEvents);
});

// ============================================================
// ANÁLISES API — Gestão Comercial
// ============================================================
const ANALISES_DIR = path.join(__dirname, 'squads/gestao/data/analises');

// List all analyses
app.get('/api/gestao/analises', (req, res) => {
  if (!fs.existsSync(ANALISES_DIR)) return res.json([]);
  const files = fs.readdirSync(ANALISES_DIR).filter(f => f.endsWith('.json'));
  const analises = files.map(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(ANALISES_DIR, f), 'utf-8'));
      return { ...data, filename: f };
    } catch(e) { return null; }
  }).filter(Boolean);
  analises.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  res.json(analises);
});

// Get single analysis
app.get('/api/gestao/analises/:id', (req, res) => {
  const file = path.join(ANALISES_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
  res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
});

// Save analysis (from Rafa agent)
app.post('/api/gestao/analises', (req, res) => {
  fs.mkdirSync(ANALISES_DIR, { recursive: true });
  const analysis = req.body;
  const id = `analise-${Date.now()}`;
  analysis.id = id;
  analysis.savedAt = new Date().toISOString();
  fs.writeFileSync(path.join(ANALISES_DIR, `${id}.json`), JSON.stringify(analysis, null, 2));
  res.json({ ok: true, id });
});

// Dashboard stats
app.get('/api/gestao/analises/stats/summary', (req, res) => {
  if (!fs.existsSync(ANALISES_DIR)) return res.json({ total: 0, closers: {}, avgScore: 0, objecoes: {} });
  const files = fs.readdirSync(ANALISES_DIR).filter(f => f.endsWith('.json'));
  const analises = files.map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(ANALISES_DIR, f), 'utf-8')); }
    catch(e) { return null; }
  }).filter(Boolean);

  const closers = {};
  let totalScore = 0;
  let totalFechou = 0;

  // Objections intelligence
  const objecoes = {};
  const objecoesPorCloser = {};
  const etapasMedias = {};

  analises.forEach(a => {
    const name = a.closerName || 'Desconhecido';
    if (!closers[name]) closers[name] = { calls: 0, totalScore: 0, fechou: 0 };
    closers[name].calls++;
    closers[name].totalScore += (a.notaGeral || 0);
    if (a.resultado === 'fechou') { closers[name].fechou++; totalFechou++; }
    totalScore += (a.notaGeral || 0);

    // Aggregate objections
    if (a.objecoes && Array.isArray(a.objecoes)) {
      a.objecoes.forEach(obj => {
        const tipo = obj.tipo || 'Outro';
        const texto = obj.objecao || '';
        const avaliacao = obj.avaliacao || '';
        const superou = avaliacao.toLowerCase().includes('bem') || avaliacao.toLowerCase().includes('bom');

        if (!objecoes[tipo]) objecoes[tipo] = { total: 0, superadas: 0, exemplos: [], closers: {} };
        objecoes[tipo].total++;
        if (superou) objecoes[tipo].superadas++;
        if (objecoes[tipo].exemplos.length < 5 && texto) {
          objecoes[tipo].exemplos.push({ texto, closer: name, avaliacao, lead: a.leadName || '' });
        }
        if (!objecoes[tipo].closers[name]) objecoes[tipo].closers[name] = { total: 0, superadas: 0 };
        objecoes[tipo].closers[name].total++;
        if (superou) objecoes[tipo].closers[name].superadas++;

        // Per closer
        if (!objecoesPorCloser[name]) objecoesPorCloser[name] = {};
        if (!objecoesPorCloser[name][tipo]) objecoesPorCloser[name][tipo] = 0;
        objecoesPorCloser[name][tipo]++;
      });
    }

    // Aggregate stage scores
    if (a.etapas && Array.isArray(a.etapas)) {
      a.etapas.forEach(e => {
        if (!etapasMedias[e.nome]) etapasMedias[e.nome] = { total: 0, count: 0 };
        etapasMedias[e.nome].total += (e.nota || 0);
        etapasMedias[e.nome].count++;
      });
    }
  });

  // Calculate averages
  for (const c of Object.values(closers)) {
    c.avgScore = c.calls > 0 ? (c.totalScore / c.calls).toFixed(1) : 0;
    c.taxaFechamento = c.calls > 0 ? Math.round((c.fechou / c.calls) * 100) : 0;
  }

  // Calculate stage averages
  const etapasRanking = {};
  for (const [nome, data] of Object.entries(etapasMedias)) {
    etapasRanking[nome] = { avg: (data.total / data.count).toFixed(1), count: data.count };
  }

  res.json({
    total: analises.length,
    avgScore: analises.length > 0 ? (totalScore / analises.length).toFixed(1) : 0,
    taxaFechamento: analises.length > 0 ? Math.round((totalFechou / analises.length) * 100) : 0,
    closers,
    objecoes,
    objecoesPorCloser,
    etapasRanking
  });
});

// Evolution tracking
app.get('/api/gestao/analises/stats/evolucao', (req, res) => {
  if (!fs.existsSync(ANALISES_DIR)) return res.json({ closers: {} });
  const files = fs.readdirSync(ANALISES_DIR).filter(f => f.endsWith('.json'));
  const analises = files.map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(ANALISES_DIR, f), 'utf-8')); }
    catch { return null; }
  }).filter(Boolean);

  // Group by closer, then by date
  const closers = {};

  analises.forEach(a => {
    const name = a.closerName || 'Desconhecido';
    const dateStr = (a.date || a.savedAt || '').substring(0, 10);
    if (!dateStr) return;

    if (!closers[name]) closers[name] = { dailyScores: {}, stageEvolution: {}, weeklyStats: [] };

    // Daily score
    if (!closers[name].dailyScores[dateStr]) closers[name].dailyScores[dateStr] = { total: 0, count: 0, fechou: 0 };
    closers[name].dailyScores[dateStr].total += (a.notaGeral || 0);
    closers[name].dailyScores[dateStr].count++;
    if (a.resultado === 'fechou') closers[name].dailyScores[dateStr].fechou++;

    // Stage evolution by date
    (a.etapas || []).forEach(e => {
      if (!closers[name].stageEvolution[e.nome]) closers[name].stageEvolution[e.nome] = {};
      if (!closers[name].stageEvolution[e.nome][dateStr]) closers[name].stageEvolution[e.nome][dateStr] = { total: 0, count: 0 };
      closers[name].stageEvolution[e.nome][dateStr].total += (e.nota || 0);
      closers[name].stageEvolution[e.nome][dateStr].count++;
    });
  });

  // Calculate daily averages and trends
  const result = {};
  for (const [name, data] of Object.entries(closers)) {
    const dates = Object.keys(data.dailyScores).sort();
    const timeline = dates.map(d => ({
      date: d,
      avg: (data.dailyScores[d].total / data.dailyScores[d].count).toFixed(1),
      calls: data.dailyScores[d].count,
      fechou: data.dailyScores[d].fechou
    }));

    // Stage trends (first half vs second half)
    const stageTrends = {};
    for (const [stage, dateData] of Object.entries(data.stageEvolution)) {
      const sdates = Object.keys(dateData).sort();
      const mid = Math.floor(sdates.length / 2);
      const firstHalf = sdates.slice(0, Math.max(mid, 1));
      const secondHalf = sdates.slice(Math.max(mid, 1));

      const avgFirst = firstHalf.reduce((s, d) => s + dateData[d].total / dateData[d].count, 0) / (firstHalf.length || 1);
      const avgSecond = secondHalf.length > 0
        ? secondHalf.reduce((s, d) => s + dateData[d].total / dateData[d].count, 0) / secondHalf.length
        : avgFirst;

      const diff = avgSecond - avgFirst;
      stageTrends[stage] = {
        current: avgSecond.toFixed(1),
        previous: avgFirst.toFixed(1),
        diff: diff.toFixed(1),
        trend: diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'stable'
      };
    }

    // Overall trend
    const firstScore = timeline.length > 0 ? parseFloat(timeline[0].avg) : 0;
    const lastScore = timeline.length > 0 ? parseFloat(timeline[timeline.length - 1].avg) : 0;
    const overallDiff = lastScore - firstScore;

    result[name] = {
      timeline,
      stageTrends,
      overallTrend: { first: firstScore.toFixed(1), last: lastScore.toFixed(1), diff: overallDiff.toFixed(1), trend: overallDiff > 0.5 ? 'up' : overallDiff < -0.5 ? 'down' : 'stable' },
      totalCalls: timeline.reduce((s, t) => s + t.calls, 0),
      totalFechamentos: timeline.reduce((s, t) => s + t.fechou, 0)
    };
  }

  res.json(result);
});

// Objections detail API
app.get('/api/gestao/objecoes', (req, res) => {
  if (!fs.existsSync(ANALISES_DIR)) return res.json([]);
  const files = fs.readdirSync(ANALISES_DIR).filter(f => f.endsWith('.json'));
  const allObjecoes = [];

  files.forEach(f => {
    try {
      const a = JSON.parse(fs.readFileSync(path.join(ANALISES_DIR, f), 'utf-8'));
      (a.objecoes || []).forEach(o => {
        allObjecoes.push({
          id: `${f}-${allObjecoes.length}`,
          tipo: o.tipo || 'Outro',
          objecao: o.objecao || '',
          comoTratou: o.comoTratou || '',
          avaliacao: o.avaliacao || '',
          closerName: a.closerName || '?',
          leadName: a.leadName || '?',
          date: a.date || a.savedAt || '',
          resultado: a.resultado || '',
          notaGeral: a.notaGeral || 0,
          summary: a.summary || ''
        });
      });
    } catch {}
  });

  allObjecoes.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  res.json(allObjecoes);
});

// Recommendation tracking
app.get('/api/gestao/recomendacoes', (req, res) => {
  const TRACKER_FILE = path.join(__dirname, 'squads/gestao/data/recomendacoes-tracker.json');
  if (!fs.existsSync(TRACKER_FILE)) return res.json({ closers: {} });

  const tracker = JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf-8'));

  // Enrich with follow-up data from analyses
  if (fs.existsSync(ANALISES_DIR)) {
    const files = fs.readdirSync(ANALISES_DIR).filter(f => f.endsWith('.json'));
    const analises = files.map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(ANALISES_DIR, f), 'utf-8')); }
      catch { return null; }
    }).filter(Boolean);

    // Update recommendation statuses from follow-ups
    for (const [name, data] of Object.entries(tracker.closers)) {
      const closerAnalises = analises.filter(a => a.closerName === name);

      data.ativas.forEach(rec => {
        // Check latest analyses for follow-up on this rec
        const followUps = [];
        closerAnalises.forEach(a => {
          (a.followUpRecomendacoes || []).forEach(fu => {
            if (fu.area && rec.area && fu.area.toLowerCase().includes(rec.area.toLowerCase().substring(0, 15))) {
              followUps.push({ status: fu.status, evidencia: fu.evidencia, date: a.date || a.savedAt });
            }
          });
        });

        if (followUps.length > 0) {
          const latest = followUps.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];
          rec.followUpStatus = latest.status;
          rec.followUpEvidencia = latest.evidencia;
          rec.followUpDate = latest.date;
          rec.followUpCount = followUps.length;
          rec.melhorou = followUps.filter(f => f.status === 'melhorou').length;
          rec.naoMelhorou = followUps.filter(f => f.status === 'nao_melhorou').length;
          rec.semOportunidade = followUps.filter(f => f.status === 'sem_oportunidade').length;
        }
      });
    }
  }

  res.json(tracker);
});

// ============================================================
// SQUAD DASHBOARDS — Serve static files per squad
// ============================================================
app.use('/squad/zapeads', express.static(path.join(__dirname, 'squads/zapeads/dashboard-v2/public')));
app.use('/squad/gestao', express.static(path.join(__dirname, 'squads/gestao/dashboard')));


// ============================================================
// PM2 STATUS — Live process status for Ecosystem Dashboard
// ============================================================
app.get('/api/pm2-status', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { execSync } = require('child_process');
  try {
    const raw = execSync('pm2 jlist 2>/dev/null', { encoding: 'utf-8' });
    const processes = JSON.parse(raw);
    const result = processes
      .filter(p => p.name !== 'zapecontrol') // skip the server itself
      .map(p => ({
        name: p.name,
        status: p.pm2_env?.status || 'unknown',
        uptime: p.pm2_env?.pm_uptime || 0,
        restarts: p.pm2_env?.restart_time || 0,
        memory: p.monit?.memory || 0,
        cpu: p.monit?.cpu || 0,
        pid: p.pid || null,
      }));
    res.json({ processes: result, updatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao ler pm2', details: err.message });
  }
});

// ============================================================
// CRON STATUS — Live crontab reader for Ecosystem Dashboard
// ============================================================
app.get('/api/cron-status', (req, res) => {
  // CORS for Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { execSync } = require('child_process');
  try {
    const crontab = execSync('crontab -l 2>/dev/null', { encoding: 'utf-8' });
    const lines = crontab.split('\n');
    const crons = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip empty lines and PATH/variable declarations
      if (!trimmed || trimmed.startsWith('PATH=') || trimmed.startsWith('#!')) continue;

      // Check if line is a comment (description for next cron)
      if (trimmed.startsWith('#')) continue;

      // Parse cron line: schedule + command
      // Format: MIN HOUR DOM MON DOW command
      // Or @reboot command
      let schedule = '';
      let command = '';
      let cronFile = '';

      if (trimmed.startsWith('@reboot')) {
        schedule = '@reboot';
        command = trimmed.replace('@reboot', '').trim();
      } else {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 6) {
          schedule = parts.slice(0, 5).join(' ');
          command = parts.slice(5).join(' ');
        }
      }

      if (!command) continue;

      // Extract the .js file from the command
      const jsMatch = command.match(/(cron-[\w-]+\.js(?:\s+--[\w-]+)?)/);
      if (jsMatch) {
        cronFile = jsMatch[1];
      } else {
        // Check for other known scripts
        const scriptMatch = command.match(/([\w-]+\.js)/);
        if (scriptMatch) cronFile = scriptMatch[1];
      }

      if (!cronFile) continue;

      // Parse schedule to human-readable Portuguese
      let scheduleLabel = '';
      if (schedule === '@reboot') {
        scheduleLabel = 'Ao iniciar o servidor';
      } else {
        const [min, hour, dom, mon, dow] = schedule.split(' ');
        const hourBRT = ((parseInt(hour) - 3 + 24) % 24);
        const timeStr = `${String(hourBRT).padStart(2, '0')}:${min.padStart(2, '0')}`;

        if (dow === '*' && dom === '*' && mon === '*') {
          scheduleLabel = `Todo dia as ${timeStr} BRT`;
        } else if (dow !== '*') {
          const days = { '0': 'Domingo', '1': 'Segunda', '2': 'Terca', '3': 'Quarta', '4': 'Quinta', '5': 'Sexta', '6': 'Sabado' };
          scheduleLabel = `${days[dow] || `Dia ${dow}`} as ${timeStr} BRT`;
        } else {
          scheduleLabel = `${schedule} (${timeStr} BRT)`;
        }
      }

      crons.push({
        file: cronFile,
        status: 'ativo',
        schedule,
        scheduleLabel,
        command: command.substring(0, 200),
      });
    }

    // Known cron files — mark missing ones as pausado
    const knownCrons = [
      'cron-rafa.js', 'cron-rafa-audit.js', 'cron-max-creative-analysis.js',
      'cron-joana.js', 'cron-maicon-batch.js', 'cron-thomas-from-max.js',
      'cron-publicos.js', 'cron-criativos.js'
    ];

    const activeCronFiles = crons.map(c => c.file.split(' ')[0]); // base name without flags
    for (const known of knownCrons) {
      if (!activeCronFiles.includes(known)) {
        crons.push({
          file: known,
          status: 'pausado',
          schedule: '',
          scheduleLabel: 'Pausado',
          command: '',
        });
      }
    }

    res.json({ crons, updatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao ler crontab', details: err.message });
  }
});

// ============================================================
// AGENT DISCOVERY — Per squad
// ============================================================
function discoverAgents(squadId) {
  const squad = SQUADS[squadId];
  if (!squad) return [];
  const agentList = [];

  if (fs.existsSync(squad.squadDir)) {
    const files = fs.readdirSync(squad.squadDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(squad.squadDir, file), 'utf-8');
      const agent = parseAgentFile(content, file, squadId, squad);
      if (agent) agentList.push(agent);
    }
  }

  return agentList;
}

function parseAgentFile(content, filename, squadId, squad) {
  const id = filename.replace('.md', '');
  const nameMatch = content.match(/name:\s*(.+)/);
  const iconMatch = content.match(/icon:\s*(.+)/);
  const titleMatch = content.match(/title:\s*(.+)/);
  const commandMatches = [...content.matchAll(/- name:\s*(\w[\w-]*)\n\s+description:\s*['"]([^'"]+)['"]/g)];

  let slashCommand = null;
  if (squad.commandsDir && fs.existsSync(squad.commandsDir)) {
    if (fs.existsSync(path.join(squad.commandsDir, `${id}.md`))) {
      slashCommand = `/${id}`;
    }
    const subDir = path.join(squad.commandsDir, id);
    if (fs.existsSync(subDir) && fs.statSync(subDir).isDirectory()) {
      const subFiles = fs.readdirSync(subDir).filter(f => f.endsWith('.md'));
      if (subFiles.length > 0) {
        slashCommand = `/${id}:${subFiles[0].replace('.md', '')}`;
      }
    }
  }

  const commands = commandMatches.map(m => ({
    name: m[1],
    description: m[2]
  }));

  // Also parse commands with double-quote descriptions
  const commandMatches2 = [...content.matchAll(/- name:\s*(\w[\w-]*)\n\s+(?:args:[^\n]*\n\s+)?description:\s*"([^"]+)"/g)];
  for (const m of commandMatches2) {
    if (!commands.find(c => c.name === m[1])) {
      commands.push({ name: m[1], description: m[2] });
    }
  }

  // Parse extended profile info
  const roleMatch = content.match(/role:\s*[>|]?\s*\n?\s*(.+?)(?:\n\s{2}\S|\n\S|$)/s) || content.match(/role:\s*['"]?([^'"\n]+)/);
  const identityMatch = content.match(/identity:\s*[>|]?\s*\n?\s*(.+?)(?:\n\s{2}\S|\n\S|$)/s) || content.match(/identity:\s*['"]?([^'"\n]+)/);
  const archetypeMatch = content.match(/archetype:\s*(.+)/);
  const toneMatch = content.match(/tone:\s*(.+)/);
  const principlesMatches = [...content.matchAll(/- ((?:Avaliar|Nunca|Feedback|Padrão|Construtivo|Correlação|Dados|Processo|Execute|Load|Expert|Always|Security|Template|Interactive|Validation|Memory)[^\n]*)/g)];
  const whenToUseMatch = content.match(/whenToUse:\s*[>|]?\s*\n?\s*(.+?)(?:\n\s{2}\S|\n\S|$)/s) || content.match(/whenToUse:\s*['"]?([^'"\n]+)/);

  // Check for DNA, skills, workflow files
  const agentDir = path.dirname(path.join(squad.squadDir, filename));
  const dnaFile = path.join(agentDir, 'dna', `${id}-dna.md`);
  const skillsFile = path.join(agentDir, 'skills', `${id}-skills.md`);
  const hasDNA = fs.existsSync(dnaFile);
  const hasSkills = fs.existsSync(skillsFile);

  // Parse DNA summary if exists
  let dnaSummary = null;
  if (hasDNA) {
    try {
      const dnaContent = fs.readFileSync(dnaFile, 'utf-8');
      const modelsMatches = [...dnaContent.matchAll(/### \d+\. (.+)/g)].map(m => m[1]);
      const refMatches = [...dnaContent.matchAll(/\*\*(.+?)\*\*\s*\((.+?)\)/g)].map(m => ({ name: m[1], work: m[2] }));
      const principiosMatches = [...dnaContent.matchAll(/\d+\. \*\*(.+?)\*\*/g)].map(m => m[1]);
      dnaSummary = {
        modelos: modelsMatches.slice(0, 10),
        referencias: refMatches.slice(0, 8),
        principios: principiosMatches.slice(0, 8)
      };
    } catch {}
  }

  // Parse skills summary if exists
  let skillsSummary = null;
  if (hasSkills) {
    try {
      const skillsContent = fs.readFileSync(skillsFile, 'utf-8');
      const skillMatches = [...skillsContent.matchAll(/### \d+\. (.+)/g)].map(m => m[1]);
      skillsSummary = skillMatches.slice(0, 10);
    } catch {}
  }

  // Check for workflows
  const workflowDir = path.join(squad.dir, 'workflows');
  let workflows = [];
  if (fs.existsSync(workflowDir)) {
    workflows = fs.readdirSync(workflowDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml')).map(f => f.replace(/\.(yaml|yml)$/, ''));
  }

  // Parse delivery tab from agent definition
  // Look for deliveryTab or delivery_tab in YAML
  const deliveryMatch = content.match(/delivery_tab:\s*\n\s+name:\s*['"]?([^'"\n]+)['"]?\n\s+id:\s*['"]?([^'"\n]+)['"]?/);
  let deliveryTab = null;
  if (deliveryMatch) {
    deliveryTab = { name: deliveryMatch[1].trim(), id: deliveryMatch[2].trim() };
  }

  // Fallback: detect delivery tab from known agents
  if (!deliveryTab) {
    const deliveryMap = {
      'ad-spy': { name: 'Relatórios', id: 'relatorios' },
      'creative-master': { name: 'Criativos', id: 'criativos' },
      'head-comercial': { name: 'Análises', id: 'analises' }
    };
    if (deliveryMap[id]) deliveryTab = deliveryMap[id];
  }

  return {
    id,
    squadId,
    name: nameMatch ? nameMatch[1].trim().replace(/['"]/g, '') : id,
    icon: iconMatch ? iconMatch[1].trim().replace(/['"\\]/g, '') : '🤖',
    title: titleMatch ? titleMatch[1].trim().replace(/['"]/g, '') : '',
    slashCommand,
    commands,
    deliveryTab,
    profile: {
      role: roleMatch ? roleMatch[1].trim() : '',
      identity: identityMatch ? identityMatch[1].trim() : '',
      archetype: archetypeMatch ? archetypeMatch[1].trim() : '',
      tone: toneMatch ? toneMatch[1].trim() : '',
      whenToUse: whenToUseMatch ? whenToUseMatch[1].trim() : '',
      principles: principlesMatches.map(m => m[1]).slice(0, 8),
      hasDNA,
      hasSkills,
      dnaSummary,
      skillsSummary,
      workflows
    },
    status: 'idle',
    lastActivity: null,
    output: []
  };
}

// ============================================================
// BROADCAST
// ============================================================
function broadcast(type, data) {
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  const msgSquadId = data && data.squadId ? data.squadId : null;
  wss.clients.forEach(client => {
    if (client.readyState !== 1) return;
    // If client is filtered to a squad, only send messages for that squad
    if (client.squadId && msgSquadId && client.squadId !== msgSquadId) return;
    client.send(message);
  });
}

// ============================================================
// EXECUTE AGENT COMMAND
// ============================================================
function executeAgentCommand(squadId, agentId, command) {
  const processKey = `${squadId}:${agentId}`;

  if (runningProcesses.has(processKey)) {
    const existing = runningProcesses.get(processKey);
    try { existing.kill('SIGKILL'); } catch(e) {}
    runningProcesses.delete(processKey);
  }

  const agents = squadAgents.get(squadId);
  if (!agents) return { error: 'Squad not found' };
  const agent = agents.get(agentId);
  if (!agent) return { error: 'Agent not found' };

  const squad = SQUADS[squadId];

  // Read agent definition for context
  const agentFile = path.join(squad.squadDir, `${agentId}.md`);
  let agentContext = '';
  if (fs.existsSync(agentFile)) {
    agentContext = fs.readFileSync(agentFile, 'utf-8');
  }

  // Load chat history
  let chatContext = '';
  const chatFile = path.join(CHAT_DIR, `${squadId}-${agentId}.json`);
  if (fs.existsSync(chatFile)) {
    try {
      const history = JSON.parse(fs.readFileSync(chatFile, 'utf-8'));
      const recent = history.slice(-100);
      if (recent.length > 0) {
        chatContext = '\n\nHISTORICO DA CONVERSA:\n' +
          recent.map(m => `${m.type === 'user' ? 'USUARIO' : agent.name.toUpperCase()}: ${m.text}`).join('\n') +
          '\n\nFIM DO HISTORICO.\n';
      }
    } catch(e) {}
  }

  const agentDisplayName = agent.name || agentId;
  const prompt = `Voce e o agente ${agentDisplayName}. Leia suas instrucoes completas do arquivo ${agentFile} e execute o que o usuario pedir.
${chatContext}
MENSAGEM ATUAL DO USUARIO: ${command}

Responda de forma direta e objetiva. Trabalhe de forma completa e autonoma (modo YOLO). Salve todos os resultados nas pastas configuradas.`;

  agent.status = 'running';
  agent.lastActivity = new Date().toISOString();
  agent.output = [];

  const operationId = `op-${Date.now()}`;
  const operation = {
    id: operationId,
    squadId,
    agentId,
    command,
    status: 'running',
    startedAt: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    finishedAt: null,
    outputLines: 0
  };

  // Save operation
  const opsFile = path.join(squad.intelDir, 'operations.json');
  let ops = [];
  if (fs.existsSync(opsFile)) {
    try { ops = JSON.parse(fs.readFileSync(opsFile, 'utf-8')); } catch(e) { ops = []; }
  }
  ops.push(operation);
  if (ops.length > 50) ops = ops.slice(-50);
  try { fs.writeFileSync(opsFile, JSON.stringify(ops, null, 2)); } catch(e) {}

  // Update status.json
  if (squad.statusFile) {
    const newStatus = {
      agent: agentDisplayName,
      status: 'running',
      started_at: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      updated_at: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      current_step: null,
      total_steps: 7,
      progress: 0,
      command,
      operation_id: operationId,
      steps: [],
      findings: [],
      errors: []
    };
    try {
      fs.mkdirSync(path.dirname(squad.statusFile), { recursive: true });
      fs.writeFileSync(squad.statusFile, JSON.stringify(newStatus, null, 2));
    } catch(e) {}
  }

  broadcast('agent-status', { squadId, agentId, status: 'running', command, operationId });

  const proc = spawn('claude', [
    '-p', prompt,
    '--output-format', 'stream-json',
    '--verbose',
    '--allowedTools', 'Read,Write,Edit,Glob,Grep,Bash,WebFetch,WebSearch,Agent'
  ], {
    cwd: squad.dir,
    env: { ...process.env, FORCE_COLOR: '0' },
    stdin: 'ignore',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  runningProcesses.set(processKey, proc);

  let outputBuffer = '';
  let lineBuffer = '';

  proc.stdout.on('data', (data) => {
    const text = data.toString();
    outputBuffer += text;
    lineBuffer += text;

    const lines = lineBuffer.split('\n');
    lineBuffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        let displayText = '';

        if (msg.type === 'assistant' && msg.message) {
          const content = msg.message.content;
          if (Array.isArray(content)) {
            const textBlocks = content.filter(b => b.type === 'text' && b.text).map(b => b.text);
            if (textBlocks.length > 0) displayText = textBlocks.join('\n');
            const toolBlocks = content.filter(b => b.type === 'tool_use');
            for (const tool of toolBlocks) {
              broadcast('agent-task', { squadId, agentId, task: {
                tool: tool.name,
                input: JSON.stringify(tool.input || {}).substring(0, 200),
                time: new Date().toLocaleTimeString('pt-BR')
              }});
            }
          }
        } else if (msg.type === 'result' && msg.result) {
          if (agent.output.length === 0) displayText = msg.result;
          broadcast('agent-task-done', { squadId, agentId, duration: msg.duration_ms, cost: msg.total_cost_usd });
        }

        if (displayText) {
          const lastOutput = agent.output[agent.output.length - 1];
          if (!lastOutput || lastOutput.text !== displayText) {
            const entry = { time: new Date().toLocaleTimeString('pt-BR'), text: displayText };
            agent.output.push(entry);
            broadcast('agent-output', { squadId, agentId, entry });
          }
        }
      } catch (e) {}
    }
  });

  proc.stderr.on('data', (data) => {
    const text = data.toString().trim();
    if (text && !text.includes('ExperimentalWarning')) {
      const entry = { time: new Date().toLocaleTimeString('pt-BR'), text: `[info] ${text}` };
      agent.output.push(entry);
      broadcast('agent-output', { squadId, agentId, entry });
    }
  });

  proc.on('close', (code) => {
    agent.status = code === 0 ? 'done' : 'error';
    agent.lastActivity = new Date().toISOString();
    runningProcesses.delete(processKey);
    broadcast('agent-status', { squadId, agentId, status: agent.status, code });

    // Save log
    const logDir = path.join(squad.intelDir, 'relatorios');
    fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(path.join(logDir, `${agentId}-${Date.now()}.log`), outputBuffer);

    // Update status.json
    if (squad.statusFile) {
      try {
        if (fs.existsSync(squad.statusFile)) {
          const st = JSON.parse(fs.readFileSync(squad.statusFile, 'utf-8'));
          if (st.operation_id === operationId) {
            st.status = code === 0 ? 'done' : 'error';
            st.progress = code === 0 ? 100 : st.progress;
            st.updated_at = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            fs.writeFileSync(squad.statusFile, JSON.stringify(st, null, 2));
          }
        }
      } catch(e) {}
    }

    // Update operation
    if (fs.existsSync(opsFile)) {
      try {
        const ops = JSON.parse(fs.readFileSync(opsFile, 'utf-8'));
        const op = ops.find(o => o.id === operationId);
        if (op) {
          op.status = code === 0 ? 'done' : 'error';
          op.finishedAt = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
          op.outputLines = agent.output.length;
        }
        fs.writeFileSync(opsFile, JSON.stringify(ops, null, 2));
      } catch(e) {}
    }
  });

  return { success: true, message: `Agent ${agentId} executing: ${command}` };
}

// ============================================================
// API — Hub
// ============================================================
app.get('/api/squads', (req, res) => {
  const result = [];
  for (const [id, squad] of Object.entries(SQUADS)) {
    const agents = squadAgents.get(id);
    const agentCount = agents ? agents.size : 0;
    result.push({
      id,
      name: squad.name,
      icon: squad.icon,
      description: squad.description,
      agentCount,
      agents: agents ? Array.from(agents.values()).map(a => ({
        id: a.id, name: a.name, icon: a.icon, title: a.title, status: a.status
      })) : []
    });
  }
  res.json(result);
});

// ============================================================
// API — Agents (squad-scoped)
// ============================================================
app.get('/api/:squadId/agents', (req, res) => {
  const agents = squadAgents.get(req.params.squadId);
  if (!agents) return res.json([]);
  const agentList = [];
  agents.forEach((agent, id) => {
    agentList.push({
      id, name: agent.name, icon: agent.icon, title: agent.title,
      status: agent.status, lastActivity: agent.lastActivity,
      commands: agent.commands, slashCommand: agent.slashCommand,
      deliveryTab: agent.deliveryTab, profile: agent.profile, outputCount: agent.output.length
    });
  });
  res.json(agentList);
});

app.get('/api/:squadId/agents/:id', (req, res) => {
  const agents = squadAgents.get(req.params.squadId);
  if (!agents) return res.status(404).json({ error: 'Squad not found' });
  const agent = agents.get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent);
});

app.post('/api/:squadId/agents/:id/command', (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'Command required' });
  const processKey = `${req.params.squadId}:${req.params.id}`;
  if (runningProcesses.has(processKey)) {
    return res.json({ success: false, busy: true, message: 'Agente ocupado. Aguarde ou pare antes.' });
  }
  const result = executeAgentCommand(req.params.squadId, req.params.id, command);
  res.json(result);
});

app.post('/api/:squadId/agents/:id/stop', (req, res) => {
  const processKey = `${req.params.squadId}:${req.params.id}`;
  const proc = runningProcesses.get(processKey);
  if (proc) {
    proc.kill('SIGTERM');
    runningProcesses.delete(processKey);
    const agents = squadAgents.get(req.params.squadId);
    if (agents) {
      const agent = agents.get(req.params.id);
      if (agent) agent.status = 'stopped';
    }
    broadcast('agent-status', { squadId: req.params.squadId, agentId: req.params.id, status: 'stopped' });
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'No running process' });
  }
});

// ============================================================
// API — Legacy routes (backward compat with zapeads dashboard)
// ============================================================
app.get('/api/agents', (req, res) => {
  const agents = squadAgents.get('zapeads');
  if (!agents) return res.json([]);
  const agentList = [];
  agents.forEach((agent, id) => {
    agentList.push({
      id, name: agent.name, icon: agent.icon, title: agent.title,
      status: agent.status, lastActivity: agent.lastActivity,
      commands: agent.commands, slashCommand: agent.slashCommand,
      deliveryTab: agent.deliveryTab, profile: agent.profile, outputCount: agent.output.length
    });
  });
  res.json(agentList);
});

app.get('/api/agents/:id', (req, res) => {
  const agents = squadAgents.get('zapeads');
  if (!agents) return res.status(404).json({ error: 'Squad not found' });
  const agent = agents.get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent);
});

app.post('/api/agents/:id/command', (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'Command required' });
  const processKey = `zapeads:${req.params.id}`;
  if (runningProcesses.has(processKey)) {
    return res.json({ success: false, busy: true, message: 'O agente esta executando uma tarefa.' });
  }
  const result = executeAgentCommand('zapeads', req.params.id, command);
  res.json(result);
});

app.post('/api/agents/:id/stop', (req, res) => {
  const processKey = `zapeads:${req.params.id}`;
  const proc = runningProcesses.get(processKey);
  if (proc) {
    proc.kill('SIGTERM');
    runningProcesses.delete(processKey);
    const agents = squadAgents.get('zapeads');
    if (agents) {
      const agent = agents.get(req.params.id);
      if (agent) agent.status = 'stopped';
    }
    broadcast('agent-status', { squadId: 'zapeads', agentId: req.params.id, status: 'stopped' });
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'No running process' });
  }
});

// ============================================================
// API — Intel (squad-scoped)
// ============================================================
app.get('/api/:squadId/intel', (req, res) => {
  const squad = SQUADS[req.params.squadId];
  if (!squad) return res.status(404).json({ error: 'Squad not found' });
  const files = [];
  function scanDir(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) scanDir(fullPath, relPath);
      else {
        const stat = fs.statSync(fullPath);
        files.push({ path: relPath, fullPath, size: stat.size, modified: stat.mtime.toISOString() });
      }
    }
  }
  scanDir(squad.intelDir);
  res.json(files);
});

// Legacy intel routes
app.get('/api/intel', (req, res) => {
  const squad = SQUADS.zapeads;
  const files = [];
  function scanDir(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) scanDir(fullPath, relPath);
      else {
        const stat = fs.statSync(fullPath);
        files.push({ path: relPath, fullPath, size: stat.size, modified: stat.mtime.toISOString() });
      }
    }
  }
  scanDir(squad.intelDir);
  res.json(files);
});

app.get('/api/intel/read', (req, res) => {
  const squad = SQUADS.zapeads;
  const filePath = path.join(squad.intelDir, req.query.path || '');
  if (!filePath.startsWith(squad.intelDir)) return res.status(403).json({ error: 'Forbidden' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.json({ content: fs.readFileSync(filePath, 'utf-8') });
});

// ============================================================
// API — Reports (legacy)
// ============================================================
app.get('/api/reports', (req, res) => {
  const squad = SQUADS.zapeads;
  const reports = [];
  const dirs = [
    { path: path.join(squad.intelDir, 'relatorios'), category: 'relatorio' },
    { path: path.join(squad.intelDir, 'concorrentes'), category: 'concorrente' }
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir.path)) continue;
    const scanReports = (dirPath, prefix = '') => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) { scanReports(fullPath, entry.name); }
        else if (entry.name.endsWith('.md')) {
          const stat = fs.statSync(fullPath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          const titleMatch = content.match(/^#\s+(.+)/m);
          reports.push({
            id: Buffer.from(fullPath).toString('base64url'),
            filename: entry.name, folder: prefix || dir.category,
            category: dir.category,
            title: titleMatch ? titleMatch[1] : entry.name.replace('.md', ''),
            path: fullPath, size: stat.size, modified: stat.mtime.toISOString(),
            preview: content.substring(0, 300)
          });
        }
      }
    };
    scanReports(dir.path);
  }
  reports.sort((a, b) => new Date(b.modified) - new Date(a.modified));
  res.json(reports);
});

app.get('/api/reports/:id', (req, res) => {
  try {
    const filePath = Buffer.from(req.params.id, 'base64url').toString();
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
    const content = fs.readFileSync(filePath, 'utf-8');
    const stat = fs.statSync(filePath);
    res.json({ content, modified: stat.mtime.toISOString(), path: filePath });
  } catch (e) { res.status(400).json({ error: 'Invalid report ID' }); }
});

// ============================================================
// API — Ton/Criativos (legacy zapeads)
// ============================================================
const CRIATIVOS_DIR = path.join(__dirname, 'squads/zapeads/criativos');
const PRODUTOS_DIR = path.join(__dirname, 'squads/zapeads/produtos');

app.get('/api/ton/criativos', (req, res) => {
  const result = { gerados: [], briefings: [], batches: [], sexyCanvas: [] };
  const geradosDir = path.join(CRIATIVOS_DIR, 'gerados');
  if (fs.existsSync(geradosDir)) {
    const scan = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) scan(fullPath);
        else if (/\.(png|jpg|jpeg|webp)$/i.test(entry.name)) {
          const stat = fs.statSync(fullPath);
          result.gerados.push({ filename: entry.name, path: fullPath, size: stat.size, modified: stat.mtime.toISOString() });
        }
      }
    };
    scan(geradosDir);
  }
  const briefDir = path.join(CRIATIVOS_DIR, 'briefings');
  if (fs.existsSync(briefDir)) {
    fs.readdirSync(briefDir).filter(f => f.endsWith('.md')).forEach(f => {
      const stat = fs.statSync(path.join(briefDir, f));
      result.briefings.push({ filename: f, modified: stat.mtime.toISOString() });
    });
  }
  const canvasDir = path.join(CRIATIVOS_DIR, 'sexy-canvas');
  if (fs.existsSync(canvasDir)) {
    fs.readdirSync(canvasDir).filter(f => f.endsWith('.md') || f.endsWith('.html')).forEach(f => {
      const stat = fs.statSync(path.join(canvasDir, f));
      result.sexyCanvas.push({ filename: f, modified: stat.mtime.toISOString() });
    });
  }
  res.json(result);
});

app.get('/api/ton/image', (req, res) => {
  const filePath = req.query.path;
  if (!filePath || !filePath.startsWith(CRIATIVOS_DIR)) return res.status(403).json({ error: 'Forbidden' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(filePath);
});

app.get('/api/ton/produtos', (req, res) => {
  if (!fs.existsSync(PRODUTOS_DIR)) return res.json([]);
  const files = fs.readdirSync(PRODUTOS_DIR).filter(f => f.endsWith('.md'));
  const produtos = files.map(f => {
    const content = fs.readFileSync(path.join(PRODUTOS_DIR, f), 'utf-8');
    const nameMatch = content.match(/nome:\s*(.+)/);
    const precoMatch = content.match(/preco:\s*(.+)/i) || content.match(/Preço:\*\*\s*(.+)/);
    const statusMatch = content.match(/status:\s*(.+)/);
    return {
      id: f.replace('.md', ''), filename: f,
      nome: nameMatch ? nameMatch[1].trim() : f.replace('.md', ''),
      preco: precoMatch ? precoMatch[1].trim() : '',
      status: statusMatch ? statusMatch[1].trim() : 'ativo'
    };
  });
  res.json(produtos);
});

const uploadDir = path.join(CRIATIVOS_DIR, 'referencias');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `ref_${Date.now()}${path.extname(file.originalname) || '.jpg'}`)
  }),
  fileFilter: (req, file, cb) => {
    if (/\.(jpg|jpeg|png|webp|gif)$/i.test(file.originalname)) cb(null, true);
    else cb(new Error('Apenas imagens'));
  },
  limits: { fileSize: 20 * 1024 * 1024 }
});

app.post('/api/ton/upload-ref', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem' });
  res.json({ success: true, filename: req.file.filename, path: req.file.path, size: req.file.size });
});

app.get('/api/ton/referencias', (req, res) => {
  if (!fs.existsSync(uploadDir)) return res.json([]);
  const files = fs.readdirSync(uploadDir)
    .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
    .map(f => {
      const stat = fs.statSync(path.join(uploadDir, f));
      return { filename: f, path: path.join(uploadDir, f), size: stat.size, modified: stat.mtime.toISOString() };
    })
    .sort((a, b) => new Date(b.modified) - new Date(a.modified));
  res.json(files);
});

app.get('/api/ton/ref-image', (req, res) => {
  const filePath = req.query.path;
  if (!filePath || !filePath.startsWith(uploadDir)) return res.status(403).json({ error: 'Forbidden' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(filePath);
});

app.get('/api/ton/criativos-by-remessa', (req, res) => {
  const geradosDir = path.join(CRIATIVOS_DIR, 'gerados');
  const remessas = [];
  if (!fs.existsSync(geradosDir)) return res.json(remessas);
  const entries = fs.readdirSync(geradosDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const remessaPath = path.join(geradosDir, entry.name);
      const images = fs.readdirSync(remessaPath)
        .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
        .map(f => {
          const stat = fs.statSync(path.join(remessaPath, f));
          return { filename: f, path: path.join(remessaPath, f), size: stat.size, modified: stat.mtime.toISOString() };
        })
        .sort((a, b) => new Date(b.modified) - new Date(a.modified));
      if (images.length > 0) {
        const stat = fs.statSync(remessaPath);
        remessas.push({ name: entry.name, path: remessaPath, images, date: stat.mtime.toLocaleDateString('pt-BR'), count: images.length });
      }
    }
  }
  const rootImages = entries
    .filter(e => !e.isDirectory() && /\.(png|jpg|jpeg|webp)$/i.test(e.name))
    .map(e => {
      const fullPath = path.join(geradosDir, e.name);
      const stat = fs.statSync(fullPath);
      return { filename: e.name, path: fullPath, size: stat.size, modified: stat.mtime.toISOString() };
    });
  if (rootImages.length > 0) {
    remessas.unshift({ name: 'Avulsos', path: geradosDir, images: rootImages, date: new Date().toLocaleDateString('pt-BR'), count: rootImages.length });
  }
  remessas.sort((a, b) => {
    const dateA = a.images[0] ? new Date(a.images[0].modified) : new Date(0);
    const dateB = b.images[0] ? new Date(b.images[0].modified) : new Date(0);
    return dateB - dateA;
  });
  res.json(remessas);
});

app.get('/api/ton/stats', (req, res) => {
  const countFiles = (dir, ext) => {
    if (!fs.existsSync(dir)) return 0;
    let count = 0;
    const scan = (d) => {
      fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
        if (e.isDirectory()) scan(path.join(d, e.name));
        else if (ext.some(x => e.name.endsWith(x))) count++;
      });
    };
    scan(dir);
    return count;
  };
  res.json({
    gerados: countFiles(path.join(CRIATIVOS_DIR, 'gerados'), ['.png', '.jpg', '.jpeg', '.webp']),
    briefings: countFiles(path.join(CRIATIVOS_DIR, 'briefings'), ['.md']),
    canvas: countFiles(path.join(CRIATIVOS_DIR, 'sexy-canvas'), ['.md', '.html'])
  });
});

// ============================================================
// API — Operations (legacy)
// ============================================================
app.get('/api/operations/:agentId', (req, res) => {
  const squad = SQUADS.zapeads;
  const opsFile = path.join(squad.intelDir, 'operations.json');
  if (!fs.existsSync(opsFile)) return res.json([]);
  try {
    const ops = JSON.parse(fs.readFileSync(opsFile, 'utf-8'));
    const filtered = ops.filter(o => o.agentId === req.params.agentId);
    res.json(filtered.reverse());
  } catch(e) { res.json([]); }
});

// ============================================================
// API — Ton Feedback
// ============================================================
const FEEDBACK_DIR = path.join(__dirname, 'squads/zapeads/criativos/feedback');
fs.mkdirSync(FEEDBACK_DIR, { recursive: true });

app.post('/api/ton/feedback', (req, res) => {
  const { criativo, angulo, hook, status, feedback, funcionou, falhou } = req.body;
  if (!criativo || !status) return res.status(400).json({ error: 'criativo and status required' });
  const feedbackFile = path.join(FEEDBACK_DIR, 'feedback-log.json');
  let log = [];
  if (fs.existsSync(feedbackFile)) {
    try { log = JSON.parse(fs.readFileSync(feedbackFile, 'utf-8')); } catch(e) { log = []; }
  }
  log.push({
    id: String(log.length + 1).padStart(3, '0'),
    criativo, data: new Date().toLocaleDateString('pt-BR'),
    angulo: angulo || '', hook_usado: hook || '',
    status, feedback_usuario: feedback || '',
    o_que_funcionou: funcionou || '', o_que_falhou: falhou || '',
    aprendizado: ''
  });
  fs.writeFileSync(feedbackFile, JSON.stringify(log, null, 2));
  res.json({ success: true });
});

app.get('/api/ton/feedback', (req, res) => {
  const feedbackFile = path.join(FEEDBACK_DIR, 'feedback-log.json');
  if (!fs.existsSync(feedbackFile)) return res.json([]);
  try { res.json(JSON.parse(fs.readFileSync(feedbackFile, 'utf-8'))); }
  catch(e) { res.json([]); }
});

// ============================================================
// API — Chat (multi-squad)
// ============================================================
const CHAT_DIR = path.join(__dirname, 'chat-history');
fs.mkdirSync(CHAT_DIR, { recursive: true });

// Legacy (zapeads)
app.get('/api/chat/:agentId', (req, res) => {
  const file = path.join(CHAT_DIR, `zapeads-${req.params.agentId}.json`);
  // Fallback to old format
  const oldFile = path.join(__dirname, 'squads/zapeads/dashboard-v2/chat-history', `${req.params.agentId}.json`);
  if (fs.existsSync(file)) {
    res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
  } else if (fs.existsSync(oldFile)) {
    res.json(JSON.parse(fs.readFileSync(oldFile, 'utf-8')));
  } else {
    res.json([]);
  }
});

app.post('/api/chat/:agentId', (req, res) => {
  const file = path.join(CHAT_DIR, `zapeads-${req.params.agentId}.json`);
  const messages = (req.body.messages || []).slice(-200);
  fs.writeFileSync(file, JSON.stringify(messages, null, 2));
  res.json({ ok: true });
});

// Multi-squad chat
app.get('/api/:squadId/chat/:agentId', (req, res) => {
  const file = path.join(CHAT_DIR, `${req.params.squadId}-${req.params.agentId}.json`);
  if (fs.existsSync(file)) res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
  else res.json([]);
});

app.post('/api/:squadId/chat/:agentId', (req, res) => {
  const file = path.join(CHAT_DIR, `${req.params.squadId}-${req.params.agentId}.json`);
  const messages = (req.body.messages || []).slice(-200);
  fs.writeFileSync(file, JSON.stringify(messages, null, 2));
  res.json({ ok: true });
});

// ============================================================
// API — Hawk Status (legacy)
// ============================================================
app.get('/api/hawk-status', (req, res) => {
  const statusFile = SQUADS.zapeads.statusFile;
  try {
    if (fs.existsSync(statusFile)) res.json(JSON.parse(fs.readFileSync(statusFile, 'utf-8')));
    else res.json({ status: 'idle' });
  } catch (e) { res.json({ status: 'idle' }); }
});

// ============================================================
// STATUS WATCHER
// ============================================================
function watchStatusFiles() {
  for (const [squadId, squad] of Object.entries(SQUADS)) {
    if (!squad.statusFile) continue;
    let lastContent = '';
    setInterval(() => {
      try {
        if (!fs.existsSync(squad.statusFile)) return;
        const content = fs.readFileSync(squad.statusFile, 'utf-8');
        if (content === lastContent) return;
        lastContent = content;
        const status = JSON.parse(content);
        broadcast('squad-status', { squadId, status });
        // Update the correct agent's status based on who is in the status file
        const agents = squadAgents.get(squadId);
        if (agents) {
          // Detect which agent from the status file
          let targetAgentId = null;
          const statusAgent = (status.agent || '').toLowerCase();
          if (statusAgent.includes('hawk') || statusAgent.includes('ad-spy') || statusAgent.includes('espião')) {
            targetAgentId = 'ad-spy';
          } else if (statusAgent.includes('ton') || statusAgent.includes('creative')) {
            targetAgentId = 'creative-master';
          }

          if (targetAgentId) {
            const agent = agents.get(targetAgentId);
            if (agent) {
              // Only update if this status is for a running or recently finished operation
              if (status.status === 'running') {
                agent.status = 'running';
              } else if (status.status === 'done' || status.status === 'error') {
                agent.status = status.status;
              }
              agent.lastActivity = status.updated_at || null;
            }
          }

          // Reset other agents to idle if they're not the active one
          agents.forEach((agent, id) => {
            if (id !== targetAgentId && agent.status === 'running') {
              // Check if this agent has a running process
              const processKey = `${squadId}:${id}`;
              if (!runningProcesses.has(processKey)) {
                agent.status = 'idle';
              }
            }
          });
        }
      } catch (e) {}
    }, 3000);
  }
}

// ============================================================
// WEBSOCKET
// ============================================================
wss.on('connection', (ws, req) => {
  // Detect squad from query parameter: ws://host?squad=zapeads
  const url = new URL(req.url, `http://${req.headers.host}`);
  const clientSquadId = url.searchParams.get('squad') || null;

  // Store squadId on the ws object for filtered broadcasts
  ws.squadId = clientSquadId;

  const allAgents = [];
  for (const [squadId, agents] of squadAgents) {
    // If client specified a squad, only send that squad's agents
    if (clientSquadId && squadId !== clientSquadId) continue;
    agents.forEach((agent, id) => {
      allAgents.push({
        id, squadId, name: agent.name, icon: agent.icon, title: agent.title,
        status: agent.status, commands: agent.commands,
        slashCommand: agent.slashCommand, deliveryTab: agent.deliveryTab, output: agent.output.slice(-50)
      });
    });
  }
  ws.send(JSON.stringify({ type: 'init', data: allAgents }));
});

// ============================================================
// STARTUP
// ============================================================
// Load Lola SDR Service
require('./services/lola-sdr')(app);
console.log('[Lola SDR] Service loaded');

// Load Joana CS Monitor Service
require('./services/joana-cs-monitor')(app);
console.log('[Joana CS] Service loaded');

function init() {
  initGoogleAuth();

  for (const [squadId, squad] of Object.entries(SQUADS)) {
    const discovered = discoverAgents(squadId);
    const agentMap = new Map();
    for (const agent of discovered) {
      agentMap.set(agent.id, agent);
    }
    squadAgents.set(squadId, agentMap);
    console.log(`[${squad.name}] ${discovered.length} agents discovered`);

    // Ensure dirs
    if (squad.intelDir) {
      fs.mkdirSync(path.join(squad.intelDir, 'relatorios'), { recursive: true });
    }
  }

  watchStatusFiles();
  console.log('Watching status files for real-time updates');
}

init();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n⚡ ZAPEECOMM — Hub Central`);
  console.log(`Hub:       http://187.77.240.222:${PORT}`);
  console.log(`ZapeAds:   http://187.77.240.222:${PORT}/squad/zapeads`);
  console.log(`Gestão:    http://187.77.240.222:${PORT}/squad/gestao`);
  console.log(`API:       http://187.77.240.222:${PORT}/api/squads`);
  let totalAgents = 0;
  squadAgents.forEach(m => totalAgents += m.size);
  console.log(`Squads: ${squadAgents.size} | Agents: ${totalAgents}\n`);
});
