#!/usr/bin/env node
// sync-cron-status.js — Reads crontab and upserts structured data into Supabase cron_status table
// Runs every 5 minutes via crontab

const { execSync } = require('child_process');

const SUPABASE_URL = 'https://mrchphqqgbssndijichd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yY2hwaHFxZ2Jzc25kaWppY2hkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkxMzc3NCwiZXhwIjoyMDg4NDg5Nzc0fQ.FMJhU6Ryqf554EFy2dXGdfFEQutc6ZHnoyRHk4Nh7BU';

const KNOWN_CRONS = [
  'cron-rafa.js',
  'cron-rafa-audit.js',
  'cron-max-creative-analysis.js',
  'cron-joana.js',
  'cron-maicon-batch.js',
  'cron-thomas-from-max.js',
  'cron-publicos.js',
  'cron-criativos.js',
];

function parseScheduleLabel(schedule) {
  if (schedule === '@reboot') {
    return 'Ao iniciar o servidor';
  }

  const [min, hour, dom, mon, dow] = schedule.split(' ');
  const hourBRT = ((parseInt(hour) - 3 + 24) % 24);
  const timeStr = `${String(hourBRT).padStart(2, '0')}:${min.padStart(2, '0')}`;

  if (dow === '*' && dom === '*' && mon === '*') {
    return `Todo dia as ${timeStr} BRT`;
  } else if (dow !== '*') {
    const days = {
      '0': 'Domingo', '1': 'Segunda', '2': 'Terca',
      '3': 'Quarta', '4': 'Quinta', '5': 'Sexta', '6': 'Sabado'
    };
    return `${days[dow] || `Dia ${dow}`} as ${timeStr} BRT`;
  } else {
    return `${schedule} (${timeStr} BRT)`;
  }
}

function parseCrontab() {
  let crontab = '';
  try {
    crontab = execSync('crontab -l 2>/dev/null', { encoding: 'utf-8' });
  } catch {
    crontab = '';
  }

  const lines = crontab.split('\n');
  // Map: baseName -> { schedules[], scheduleLabels[], command, status }
  const cronMap = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('PATH=') || trimmed.startsWith('#!') || trimmed.startsWith('#')) continue;

    let schedule = '';
    let command = '';

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

    // Extract the base .js file name (without flags)
    const jsMatch = command.match(/(cron-[\w-]+\.js)/);
    let baseName = '';
    if (jsMatch) {
      baseName = jsMatch[1];
    } else {
      const scriptMatch = command.match(/([\w-]+\.js)/);
      if (scriptMatch) baseName = scriptMatch[1];
    }

    if (!baseName) continue;

    // Skip non-cron scripts, sync itself, and false matches
    if (baseName === 'sync-cron-status.js') continue;
    if (baseName === 'cron-status.js') continue;
    if (command.includes('sync-cron-status')) continue;
    if (!baseName.startsWith('cron-') && !KNOWN_CRONS.includes(baseName)) continue;

    const scheduleLabel = parseScheduleLabel(schedule);

    if (!cronMap[baseName]) {
      cronMap[baseName] = {
        schedules: [],
        scheduleLabels: [],
        commands: [],
      };
    }

    cronMap[baseName].schedules.push(schedule);
    cronMap[baseName].scheduleLabels.push(scheduleLabel);
    cronMap[baseName].commands.push(command.substring(0, 200));
  }

  // Build rows
  const rows = [];
  const now = new Date().toISOString();

  // Active crons from crontab
  for (const [name, data] of Object.entries(cronMap)) {
    rows.push({
      name,
      status: 'ativo',
      schedule: data.schedules.join(' | '),
      schedule_label: data.scheduleLabels.join(' | '),
      command: data.commands.join(' | '),
      updated_at: now,
    });
  }

  // Known crons not found in crontab = pausado
  const activeNames = Object.keys(cronMap);
  for (const known of KNOWN_CRONS) {
    if (!activeNames.includes(known)) {
      rows.push({
        name: known,
        status: 'pausado',
        schedule: '',
        schedule_label: 'Pausado',
        command: '',
        updated_at: now,
      });
    }
  }

  return rows;
}

async function upsertToSupabase(rows) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/cron_status`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase upsert failed (${response.status}): ${text}`);
  }

  return response.status;
}

async function main() {
  try {
    const rows = parseCrontab();
    console.log(`[sync-cron-status] Parsed ${rows.length} cron entries`);
    for (const row of rows) {
      console.log(`  - ${row.name}: ${row.status} (${row.schedule_label})`);
    }

    const status = await upsertToSupabase(rows);
    console.log(`[sync-cron-status] Upserted to Supabase (HTTP ${status})`);
  } catch (err) {
    console.error(`[sync-cron-status] Error: ${err.message}`);
    process.exit(1);
  }
}

main();
