/**
 * Cron Semanal — Max Creative Strategist
 *
 * Roda toda segunda-feira
 * 1. Puxa métricas dos últimos 7 dias por ad (nível criativo) — com paginação
 * 2. Filtra winners (20+ vendas E ROAS >= 2.0), top 10 por ROAS
 * 3. Baixa vídeos + transcreve com Whisper (small model, pt)
 * 4. Salva pacote completo no Supabase (creative_analysis_queue)
 * 5. Analisa com Claude + gera 10 variações de copy por winner
 * 6. Notifica Max no Telegram com relatório completo
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================
// Load .env files
// ============================================================
function loadEnv(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    });
  } catch (e) {
    console.log(`[env] Could not load ${filePath}: ${e.message}`);
  }
}

loadEnv(path.join(__dirname, '.env'));
loadEnv(path.join(__dirname, 'squads/zapeads/.env'));

const META_ACCESS_TOKEN    = process.env.META_ACCESS_TOKEN || '';
const META_AD_ACCOUNT_ID   = process.env.META_AD_ACCOUNT_ID || '';
const SUPABASE_URL         = process.env.SUPABASE_URL || '';
const SUPABASE_KEY         = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const MAX_TELEGRAM_TOKEN   = process.env.MAX_TELEGRAM_BOT_TOKEN || '';
const MAX_TELEGRAM_CHAT_ID = process.env.MAX_TELEGRAM_CHAT_ID || '';
const OPENAI_API_KEY       = process.env.OPENAI_API_KEY || '';

const VIDEOS_DIR  = path.join(__dirname, 'squads/zapeads/videos/transcriptions');
const CRIATIVOS_DIR = path.join(__dirname, 'squads/zapeads/criativos');
const TOP_N       = 10;
const MIN_SALES   = 20;
const MIN_ROAS    = 2.0;

// ============================================================
// Helpers — HTTP
// ============================================================
function httpGet(url, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'https:' ? https : http;

    const req = mod.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsed.protocol}//${parsed.host}${res.headers.location}`;
        resolve(httpGet(redirectUrl, timeoutMs));
        return;
      }
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); }
        catch { resolve({ _raw: buf }); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error(`httpGet timeout: ${url}`)); });
    req.on('error', reject);
  });
}

function httpPost(hostname, path_, headers, body, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const bodyBuf = Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
    const req = https.request({
      hostname,
      path: path_,
      method: 'POST',
      headers: { ...headers, 'Content-Length': bodyBuf.length },
      timeout: timeoutMs
    }, (res) => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error(`httpPost timeout: ${hostname}${path_}`)); });
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

function downloadBinary(url, dest, timeoutMs = 300000) {
  return new Promise((resolve, reject) => {
    const follow = (u, hops) => {
      if (hops > 10) { reject(new Error('Too many redirects')); return; }
      const parsed = new URL(u);
      const mod = parsed.protocol === 'https:' ? https : http;
      mod.get(u, { timeout: timeoutMs }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const loc = res.headers.location.startsWith('http')
            ? res.headers.location
            : `${parsed.protocol}//${parsed.host}${res.headers.location}`;
          follow(loc, hops + 1);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${res.statusCode}`));
          return;
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(dest); });
        file.on('error', reject);
        res.on('error', reject);
      }).on('error', reject).on('timeout', () => reject(new Error('Download timeout')));
    };
    follow(url, 0);
  });
}

// ============================================================
// Step 1 — Meta Ads API: fetch ad-level insights (with pagination)
// ============================================================
function metaGet(endpoint, params = {}) {
  const qs = new URLSearchParams({ access_token: META_ACCESS_TOKEN, ...params }).toString();
  return httpGet(`https://graph.facebook.com/v21.0/${endpoint}?${qs}`, 60000);
}

async function fetchAdLevelInsights() {
  console.log('\n[STEP 1/6] Puxando métricas dos últimos 7 dias por ad...');

  const fields = [
    'ad_id', 'ad_name', 'campaign_name',
    'impressions', 'reach', 'frequency',
    'clicks', 'ctr', 'cpc', 'cpm', 'spend',
    'actions', 'action_values', 'cost_per_action_type',
    'video_p25_watched_actions', 'video_p50_watched_actions',
    'video_p75_watched_actions', 'video_p95_watched_actions',
    'video_30_sec_watched_actions', 'video_thruplay_watched_actions',
    'video_play_actions'
  ].join(',');

  const allAds = [];
  let nextUrl = null;

  // First page
  const first = await metaGet(`${META_AD_ACCOUNT_ID}/insights`, {
    fields,
    date_preset: 'last_7d',
    level: 'ad',
    limit: 500,
    filtering: JSON.stringify([{ field: 'ad.effective_status', operator: 'IN', value: ['ACTIVE'] }])
  });

  if (first.error) {
    throw new Error(`Meta API error: ${JSON.stringify(first.error)}`);
  }

  (first.data || []).forEach(ad => allAds.push(ad));
  nextUrl = first.paging && first.paging.next ? first.paging.next : null;

  // Paginate
  let pageCount = 1;
  while (nextUrl) {
    pageCount++;
    console.log(`   Paginando... pagina ${pageCount}`);
    const page = await httpGet(nextUrl, 60000);
    if (page.error) break;
    (page.data || []).forEach(ad => allAds.push(ad));
    nextUrl = page.paging && page.paging.next ? page.paging.next : null;
  }

  console.log(`   ${allAds.length} ads encontrados em ${pageCount} pagina(s)`);
  return allAds;
}

// ============================================================
// Step 2 — Filter winners
// ============================================================
function getActionCount(actions, types) {
  if (!Array.isArray(actions)) return 0;
  let total = 0;
  for (const a of actions) {
    if (types.includes(a.action_type)) total += parseFloat(a.value || 0);
  }
  return total;
}

function getActionRevenue(actionValues, types) {
  if (!Array.isArray(actionValues)) return 0;
  let total = 0;
  for (const a of actionValues) {
    if (types.includes(a.action_type)) total += parseFloat(a.value || 0);
  }
  return total;
}

function getVideoMetric(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  // sum all entries (could be per device)
  return arr.reduce((s, a) => s + parseFloat(a.value || 0), 0);
}

function enrichAd(ad) {
  const PURCHASE_TYPES = ['offsite_conversion.fb_pixel_purchase', 'purchase'];

  const spend       = parseFloat(ad.spend || 0);
  const impressions = parseFloat(ad.impressions || 0);
  const clicks      = parseFloat(ad.clicks || 0);
  const reach       = parseFloat(ad.reach || 0);
  const frequency   = parseFloat(ad.frequency || 0);
  const ctr         = parseFloat(ad.ctr || 0);
  const cpc         = parseFloat(ad.cpc || 0);
  const cpm         = parseFloat(ad.cpm || 0);

  const sales   = getActionCount(ad.actions, PURCHASE_TYPES);
  const revenue = getActionRevenue(ad.action_values, PURCHASE_TYPES);
  const roas    = spend > 0 ? revenue / spend : 0;

  const videoPlays = getVideoMetric(ad.video_play_actions);
  const video25    = getVideoMetric(ad.video_p25_watched_actions);
  const video50    = getVideoMetric(ad.video_p50_watched_actions);
  const video75    = getVideoMetric(ad.video_p75_watched_actions);
  const video95    = getVideoMetric(ad.video_p95_watched_actions);
  const thruplay   = getVideoMetric(ad.video_thruplay_watched_actions);

  const hookRate     = impressions > 0 ? (videoPlays / impressions) * 100 : 0;
  const hold25       = videoPlays > 0  ? (video25 / videoPlays) * 100 : 0;
  const hold50       = videoPlays > 0  ? (video50 / videoPlays) * 100 : 0;
  const hold75       = videoPlays > 0  ? (video75 / videoPlays) * 100 : 0;
  const hold95       = videoPlays > 0  ? (video95 / videoPlays) * 100 : 0;
  const thruplayRate = videoPlays > 0  ? (thruplay / videoPlays) * 100 : 0;

  return {
    ad_id:        ad.ad_id,
    ad_name:      ad.ad_name || '',
    campaign_name: ad.campaign_name || '',
    spend,
    impressions,
    reach,
    frequency,
    clicks,
    ctr,
    cpc,
    cpm,
    sales,
    revenue,
    roas,
    hook_rate:     hookRate,
    hold_25:       hold25,
    hold_50:       hold50,
    hold_75:       hold75,
    hold_95:       hold95,
    thruplay_rate: thruplayRate
  };
}

function filterWinners(ads) {
  console.log(`\n[STEP 2/6] Filtrando winners: ${MIN_SALES}+ vendas E ROAS >= ${MIN_ROAS}...`);

  const enriched = ads.map(enrichAd);
  const valid = enriched.filter(a => a.sales >= MIN_SALES && a.roas >= MIN_ROAS);
  valid.sort((a, b) => b.roas - a.roas);
  const winners = valid.slice(0, TOP_N);

  console.log(`   ${enriched.filter(a => a.sales >= MIN_SALES).length} com ${MIN_SALES}+ vendas`);
  console.log(`   ${valid.length} passaram no filtro ROAS >= ${MIN_ROAS}`);
  console.log(`   ${winners.length} winners selecionados (top ${TOP_N} por ROAS)`);

  if (winners.length > 0) {
    console.log('   Top winners:');
    winners.forEach((w, i) => {
      console.log(`   ${i + 1}. ${w.ad_name} | ROAS: ${w.roas.toFixed(2)}x | Vendas: ${w.sales} | Spend: R$${w.spend.toFixed(2)}`);
    });
  }

  return winners;
}

// ============================================================
// Step 3 — Download video + Transcribe with Whisper
// ============================================================
// Cache of video_id → source URL (loaded once from advideos endpoint)
let _videoSourceCache = null;

async function loadVideoSourceCache() {
  if (_videoSourceCache) return _videoSourceCache;
  _videoSourceCache = {};
  console.log('   [video] Carregando cache de advideos...');
  try {
    let nextUrl = null;
    let page = 0;
    // First page
    const first = await metaGet(`${META_AD_ACCOUNT_ID}/advideos`, {
      fields: 'id,source',
      limit: 100
    });
    for (const v of (first.data || [])) {
      if (v.source) _videoSourceCache[v.id] = v.source;
    }
    nextUrl = first.paging && first.paging.next ? first.paging.next : null;
    page++;

    // Paginate (max 5 pages = 500 videos)
    while (nextUrl && page < 5) {
      const res = await new Promise((resolve, reject) => {
        https.get(nextUrl, r => {
          let buf = '';
          r.on('data', d => buf += d);
          r.on('end', () => { try { resolve(JSON.parse(buf)); } catch { resolve({}); } });
        }).on('error', reject);
      });
      for (const v of (res.data || [])) {
        if (v.source) _videoSourceCache[v.id] = v.source;
      }
      nextUrl = res.paging && res.paging.next ? res.paging.next : null;
      page++;
    }
    console.log(`   [video] Cache carregado: ${Object.keys(_videoSourceCache).length} videos com source`);
  } catch (e) {
    console.log(`   [video] Erro ao carregar cache: ${e.message}`);
  }
  return _videoSourceCache;
}

async function getAdVideoUrl(adId) {
  try {
    // 1. Get creative video_id from object_story_spec
    const adData = await metaGet(`${adId}`, {
      fields: 'creative.fields(object_story_spec)'
    });

    const videoId = adData.creative
      && adData.creative.object_story_spec
      && adData.creative.object_story_spec.video_data
      && adData.creative.object_story_spec.video_data.video_id
      ? adData.creative.object_story_spec.video_data.video_id
      : null;

    if (!videoId) return null;

    // 2. Try cache first (advideos endpoint)
    const cache = await loadVideoSourceCache();
    if (cache[videoId]) return cache[videoId];

    // 3. Fallback: try direct video source access
    try {
      const videoData = await metaGet(`${videoId}`, { fields: 'source' });
      return videoData.source || null;
    } catch {
      return null;
    }
  } catch (e) {
    console.log(`   [video] Erro ao buscar URL do ad ${adId}: ${e.message}`);
    return null;
  }
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_\-\.]/g, '_').substring(0, 80);
}

function transcribeWithWhisper(tmpVideoPath, adId) {
  console.log(`   Transcrevendo ad ${adId}...`);
  try {
    const cmd = `whisper "${tmpVideoPath}" --language pt --model small --output_format txt --output_dir "${VIDEOS_DIR}"`;
    execSync(cmd, { timeout: 300000, stdio: 'pipe' });

    // Whisper names the output after the input file basename
    const baseName = path.basename(tmpVideoPath, path.extname(tmpVideoPath));
    const txtFile  = path.join(VIDEOS_DIR, `${baseName}.txt`);

    if (fs.existsSync(txtFile)) {
      const text = fs.readFileSync(txtFile, 'utf-8').trim();
      console.log(`   Transcricao: ${text.substring(0, 80)}...`);
      return text;
    } else {
      console.log(`   [whisper] .txt nao encontrado em: ${txtFile}`);
    }
  } catch (e) {
    console.log(`   [whisper] Erro: ${e.message.substring(0, 200)}`);
  }
  return null;
}

function findLocalVideo(adName) {
  // Search in criativos subfolders: novos/, em-teste/, winner/, loser/
  const subfolders = ['novos', 'em-teste', 'winner', 'loser', 'gerados', 'referencias'];
  for (const sub of subfolders) {
    const dir = path.join(CRIATIVOS_DIR, sub);
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      // Match by ad name prefix (e.g. "AD68" matches "AD68 | Vídeo | Shopee Ads.mp4")
      const adPrefix = adName.split(' ')[0]; // "AD68"
      const match = files.find(f => f.startsWith(adPrefix + ' ') && (f.endsWith('.mp4') || f.endsWith('.mov')));
      if (match) return path.join(dir, match);
    } catch {}
  }
  return null;
}

async function downloadAndTranscribe(winner) {
  // 1. Check for existing transcription (by ad_id or ad name prefix)
  const adPrefix = winner.ad_name.split(' ')[0]; // "AD68"
  const possibleTxts = [
    path.join(VIDEOS_DIR, `${winner.ad_id}.txt`),
    path.join(VIDEOS_DIR, `${adPrefix}.txt`),
    path.join(VIDEOS_DIR, `max_${winner.ad_id}.txt`)
  ];
  for (const existingTxt of possibleTxts) {
    if (fs.existsSync(existingTxt)) {
      const transcription = fs.readFileSync(existingTxt, 'utf-8').trim();
      if (transcription) {
        console.log(`   Transcricao existente encontrada: ${path.basename(existingTxt)}`);
        return { videoUrl: null, transcription, format: 'video' };
      }
    }
  }

  // 2. Try local video first
  const localFile = findLocalVideo(winner.ad_name);
  if (localFile) {
    console.log(`   Video local encontrado: ${path.basename(localFile)}`);
    const tmpFile = `/tmp/max_${winner.ad_id}.mp4`;
    try {
      fs.copyFileSync(localFile, tmpFile);
      const transcription = transcribeWithWhisper(tmpFile, winner.ad_id);
      try { fs.unlinkSync(tmpFile); } catch {}
      return { videoUrl: null, transcription, format: 'video' };
    } catch (e) {
      console.log(`   [local] Erro ao transcrever: ${e.message}`);
      try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch {}
    }
  }

  // 3. Try Meta API download
  const videoUrl = await getAdVideoUrl(winner.ad_id);

  if (!videoUrl) {
    // Check if name suggests image
    const isImage = winner.ad_name.toLowerCase().includes('imagem');
    console.log(`   Ad ${winner.ad_id}: sem video${isImage ? ' (image ad)' : ' (download bloqueado ou image ad)'}`);
    return { videoUrl: null, transcription: null, format: isImage ? 'image' : 'video' };
  }

  console.log(`   Ad ${winner.ad_id}: baixando video da Meta...`);
  const tmpFile = `/tmp/max_${winner.ad_id}.mp4`;
  let transcription = null;

  try {
    await downloadBinary(videoUrl, tmpFile, 300000);
    console.log(`   Download ok: ${tmpFile}`);
    transcription = transcribeWithWhisper(tmpFile, winner.ad_id);
    try { fs.unlinkSync(tmpFile); } catch {}
  } catch (e) {
    console.log(`   [download] Erro: ${e.message}`);
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch {}
  }

  return { videoUrl, transcription, format: 'video' };
}

// ============================================================
// Step 4 — Save to Supabase
// ============================================================
async function saveToSupabase(record) {
  const body = JSON.stringify(record);
  const parsed = new URL(`${SUPABASE_URL}/rest/v1/creative_analysis_queue`);

  const result = await httpPost(
    parsed.hostname,
    `${parsed.pathname}`,
    {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    body,
    30000
  );

  if (result.status >= 400) {
    throw new Error(`Supabase error ${result.status}: ${result.body.substring(0, 300)}`);
  }

  return result;
}

async function updateSupabaseRecord(adId, fields) {
  const body = JSON.stringify(fields);
  const parsed = new URL(`${SUPABASE_URL}/rest/v1/creative_analysis_queue?ad_id=eq.${adId}`);

  const result = await httpPost(
    parsed.hostname,
    `${parsed.pathname}?ad_id=eq.${adId}`,
    {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
      'X-HTTP-Method-Override': 'PATCH'
    },
    body,
    30000
  );

  // Use PATCH via separate request
  return new Promise((resolve, reject) => {
    const bodyBuf = Buffer.from(body);
    const req = https.request({
      hostname: parsed.hostname,
      path: `/rest/v1/creative_analysis_queue?ad_id=eq.${adId}`,
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': bodyBuf.length,
        'Prefer': 'return=minimal'
      },
      timeout: 30000
    }, (res) => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`Supabase PATCH error ${res.statusCode}: ${buf.substring(0, 300)}`));
        } else {
          resolve({ status: res.statusCode, body: buf });
        }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Supabase PATCH timeout')); });
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

// ============================================================
// Step 5 — Analyze with Claude + generate 10 variations
// ============================================================
const SYSTEM_PROMPT = `Você é o Max, Creative Strategist da Zape Ecomm. Sua função é analisar criativos winners de Meta Ads e gerar variações de copy para vídeo.

REGRAS CRÍTICAS:
- Copy = o que é FALADO no vídeo (transcrição). NÃO é o texto do anúncio.
- Toda copy deve ser na voz do Neto Marquezini: linguagem SIMPLES, direta, como professor que explica difícil de forma fácil. NADA de palavra difícil ou bonita demais. Fala como se estivesse numa conversa com um amigo seller.
- Tom: técnico mas acessível, educativo, confiante sem ser arrogante.
- NUNCA usar: "ficar rico rápido", "dinheiro fácil", "esquema", palavrões, palavras rebuscadas ou "bonitas demais".
- SEMPRE usar: escalar, resultado, método, configurações.
- O produto é o curso Shopee ADS 2.0 (low-ticket, ~R$97, parcelável em 12x).
- O mecanismo único é: "4 configurações simples que travam o ROAS acima de 25"
- CTA padrão: "Clica em Saiba Mais que na próxima página eu te explico tudo"
- Estrutura PRSA: Problema → Resultado → Solução → Ação

REGRAS DE TAMANHO E CONTEÚDO:
- OBRIGATÓRIO — HOOK: A palavra "Shopee" ou "Shopee Ads" DEVE aparecer no hook. Se não tem "Shopee" no hook, o roteiro está ERRADO. Reescreva. Exemplos corretos: "Tá gastando em Shopee Ads e...", "Seus concorrentes na Shopee já...", "Parou de anunciar na Shopee e...". Exemplos ERRADOS: "Cansado dos tutoriais..." (não tem Shopee), "Seus concorrentes já..." (não tem Shopee).
- OBRIGATÓRIO — CTA: O CTA DEVE SEMPRE mencionar o botão ("clica no botão", "toca no botão de saiba mais", "aperta no botão abaixo") E dizer "na próxima página eu te explico tudo". Pode variar a forma mas esses dois elementos são obrigatórios. Exemplos: "Clica no botão de saiba mais que na próxima página eu te explico tudo", "Toca no botão abaixo que na próxima página eu te explico tudinho", "Se fez sentido pra você, aperta no botão de saiba mais que na próxima página eu te explico tudo".
- Cada roteiro deve ter entre 40 e 60 segundos quando lido em voz alta (150-220 palavras).
- Cada bloco PRSA deve ter 3 a 5 frases, NÃO apenas 1 frase curta. Desenvolva o raciocínio.
- O HOOK deve ser impactante, específico e CONTER A PALAVRA SHOPEE.
- O PROBLEMA deve pintar a dor com detalhes reais do dia-a-dia do seller.
- O RESULTADO deve mostrar números concretos e pintar o "depois" com clareza.
- A SOLUÇÃO deve explicar o mecanismo (4 configurações) com um pouco mais de detalhe, gerando curiosidade.
- O CTA deve repetir a promessa + mencionar o botão + "na próxima página eu te explico tudo".
- Use exemplos concretos: "ROAS de 25", "R$100 em ads virando R$2.500 em vendas", "em menos de 10 dias", "por menos de R$100", "garantia de 7 dias".

REFERÊNCIA DE TOM (como o Neto fala nos winners reais):
- "Se o seu ROAS tá abaixo de 10, meu amigo, você tá deixando muito dinheiro na mesa"
- "Vamos parar de ouvir essa historinha pra boi dormir"
- "Criei um treinamento rápido que você assiste hoje, aplica hoje e tem resultado amanhã"
- "Por menos de 100 reais você vai deixar essa oportunidade passar?"
- "Tá gastando em Shopee Ads e o lucro não vem? A frustração é real."
- "Pausou os Shopee Ads e suas vendas despencaram? Você não tá sozinho, meu amigo."
- "Quer saber como? Aperta o botão abaixo e eu explico tudo na próxima página."
- "Toca no botão de saiba mais e eu te explico tudo na próxima página."
- "No pior cenário você tem garantia e se não der certo eu devolvo seu dinheiro"

FORMATO DE SAÍDA (JSON):
{
  "analysis": {
    "prsa_mapping": { "P": "...", "R": "...", "S": "...", "A": "..." },
    "hook_type": "contrarian|dor_direta|depoimento|refem|resultado|erro_comum",
    "angle": "descrição do ângulo",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "fatigue_risk": "low|medium|high",
    "diagnosis": "..."
  },
  "variations": [
    {
      "number": 1,
      "angle": "nome do ângulo (DIFERENTE dos outros)",
      "hook_type": "tipo do hook (DIFERENTE dos outros)",
      "duration_target": "40s|50s|60s",
      "script": {
        "hook_0_5s": "texto exato falado nos primeiros 3-5 segundos (DEVE mencionar Shopee)",
        "problema_5_15s": "texto falado — 3 a 5 frases detalhando a dor",
        "resultado_15_30s": "texto falado — 3 a 5 frases com números e provas concretas",
        "solucao_30_45s": "texto falado — 3 a 5 frases sobre o mecanismo/método",
        "cta_45_60s": "texto falado — repetir promessa + CTA direto"
      },
      "full_script": "roteiro completo concatenado, pronto pra ler e gravar (150-220 palavras)",
      "why_different": "por que esta variação é diferente das outras"
    }
  ]
}`;

function buildUserPrompt(winner, transcription) {
  const m = winner;
  const metricsText = [
    `Ad: ${m.ad_name}`,
    `Campanha: ${m.campaign_name}`,
    `Spend: R$${m.spend.toFixed(2)}`,
    `Receita: R$${m.revenue.toFixed(2)}`,
    `ROAS: ${m.roas.toFixed(2)}x`,
    `Vendas: ${m.sales}`,
    `Impressoes: ${m.impressions.toFixed(0)}`,
    `Alcance: ${m.reach.toFixed(0)}`,
    `Frequencia: ${m.frequency.toFixed(2)}`,
    `Cliques: ${m.clicks.toFixed(0)}`,
    `CTR: ${m.ctr.toFixed(2)}%`,
    `CPC: R$${m.cpc.toFixed(2)}`,
    `CPM: R$${m.cpm.toFixed(2)}`,
    `Hook Rate: ${m.hook_rate.toFixed(1)}%`,
    `Hold 25%: ${m.hold_25.toFixed(1)}%`,
    `Hold 50%: ${m.hold_50.toFixed(1)}%`,
    `Hold 75%: ${m.hold_75.toFixed(1)}%`,
    `Hold 95%: ${m.hold_95.toFixed(1)}%`,
    `Thruplay Rate: ${m.thruplay_rate.toFixed(1)}%`
  ].join('\n');

  const transcriptionText = transcription
    ? `\n\nTRANSCRIÇÃO DO VÍDEO:\n${transcription}`
    : '\n\nTRANSCRIÇÃO: (não disponível — ad de imagem ou falha na transcrição)';

  return `Analise este criativo winner e gere EXATAMENTE 10 variações de copy para vídeo.

MÉTRICAS DO WINNER:
${metricsText}
${transcriptionText}

INSTRUÇÃO: Gere EXATAMENTE 10 variações onde cada uma DEVE ter hook, ângulo e estrutura COMPLETAMENTE DIFERENTES das demais. As 10 variações devem cobrir OBRIGATORIAMENTE estes ângulos, um por variação:
1. Dor do gasto sem retorno — o vendedor gasta em tráfego e não vê resultado
2. Refém da plataforma — depender do algoritmo sem controle nenhum
3. Erro comum dos sellers — erro específico que a maioria comete e não sabe
4. YouTube é armadilha — os tutoriais gratuitos ensinam o método errado
5. Calculadora da verdade — mostrar com números reais o custo de NÃO ter o método
6. Prova social cascade — empilhar vários depoimentos rápidos de alunos reais
7. Simplicidade (3 cliques) — o método é tão simples que dá pra configurar em minutos
8. Medo de ficar pra trás (FOMO) — concorrentes já estão usando, você vai ficar pra trás
9. Resultado rápido (velocidade) — quanto tempo leva pra ver o primeiro resultado
10. Contrarian (desafiar crença) — desafiar uma crença comum do mercado de Shopee

Responda SOMENTE com o JSON válido, sem markdown, sem explicações fora do JSON.`;
}

async function analyzeWithAI(winner, transcription) {
  if (!OPENAI_API_KEY) {
    console.log(`   [openai] OPENAI_API_KEY nao configurada, pulando analise`);
    return { analysis: null, variations: null };
  }

  console.log(`   Analisando com GPT-4o: ${winner.ad_name}...`);

  const requestBody = JSON.stringify({
    model: 'gpt-4o',
    max_tokens: 8000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(winner, transcription) }
    ]
  });

  let responseBody;
  try {
    const result = await new Promise((resolve, reject) => {
      const bodyBuf = Buffer.from(requestBody);
      const req = https.request({
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'content-type': 'application/json',
          'content-length': bodyBuf.length
        },
        timeout: 120000
      }, (res) => {
        let buf = '';
        res.on('data', d => buf += d);
        res.on('end', () => resolve({ status: res.statusCode, body: buf }));
      });
      req.on('timeout', () => { req.destroy(); reject(new Error('OpenAI API timeout (120s)')); });
      req.on('error', reject);
      req.write(bodyBuf);
      req.end();
    });

    if (result.status >= 400) {
      throw new Error(`OpenAI API error ${result.status}: ${result.body.substring(0, 300)}`);
    }

    const parsed = JSON.parse(result.body);
    responseBody = parsed.choices && parsed.choices[0] && parsed.choices[0].message
      ? parsed.choices[0].message.content
      : null;

    if (!responseBody) throw new Error('OpenAI retornou resposta vazia');

  } catch (e) {
    console.log(`   [openai] Erro: ${e.message}`);
    return { analysis: null, variations: null };
  }

  // Parse JSON from OpenAI response
  try {
    const cleaned = responseBody
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const data = JSON.parse(cleaned);
    return {
      analysis: JSON.stringify(data.analysis || null),
      variations: JSON.stringify(data.variations || null)
    };
  } catch (e) {
    console.log(`   [openai] Erro ao parsear JSON: ${e.message}`);
    console.log(`   Resposta raw (primeiros 500 chars): ${responseBody.substring(0, 500)}`);
    return { analysis: responseBody, variations: null };
  }
}

// ============================================================
// Step 6 — Telegram notification
// ============================================================
async function sendTelegram(text) {
  if (!MAX_TELEGRAM_TOKEN || !MAX_TELEGRAM_CHAT_ID) {
    console.log('[telegram] Credenciais nao configuradas, pulando notificacao');
    return;
  }

  const body = JSON.stringify({
    chat_id: MAX_TELEGRAM_CHAT_ID,
    text,
    parse_mode: 'HTML'
  });

  const result = await new Promise((resolve, reject) => {
    const bodyBuf = Buffer.from(body);
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${MAX_TELEGRAM_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': bodyBuf.length
      },
      timeout: 30000
    }, (res) => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Telegram timeout')); });
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });

  if (result.status !== 200) {
    const errBody = (() => { try { return JSON.parse(result.body); } catch { return { description: result.body }; } })();
    throw new Error(`Telegram error ${result.status}: ${errBody.description || result.body}`);
  }

  return result;
}

async function sendTelegramSplit(text) {
  const LIMIT = 4000;
  if (text.length <= LIMIT) {
    await sendTelegram(text);
    return;
  }

  // Split on double newline boundaries to avoid cutting mid-word
  const parts = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= LIMIT) {
      parts.push(remaining);
      break;
    }

    // Find last double-newline before LIMIT
    let splitAt = remaining.lastIndexOf('\n\n', LIMIT);
    if (splitAt < 0 || splitAt < LIMIT / 2) {
      splitAt = remaining.lastIndexOf('\n', LIMIT);
    }
    if (splitAt < 0 || splitAt < LIMIT / 2) {
      splitAt = LIMIT;
    }

    parts.push(remaining.substring(0, splitAt).trim());
    remaining = remaining.substring(splitAt).trim();
  }

  for (let i = 0; i < parts.length; i++) {
    const prefix = parts.length > 1 ? `<i>(parte ${i + 1}/${parts.length})</i>\n\n` : '';
    await sendTelegram(prefix + parts[i]);
    // Small delay between messages to avoid Telegram rate limits
    if (i < parts.length - 1) await new Promise(r => setTimeout(r, 500));
  }
}

function buildTelegramReport(winners, results) {
  const roasValues = results.map(r => r.roas);
  const totalSales = results.reduce((s, r) => s + r.sales, 0);
  const minRoas = Math.min(...roasValues).toFixed(2);
  const maxRoas = Math.max(...roasValues).toFixed(2);
  const withVideo = results.filter(r => r.format === 'video').length;
  const withTranscription = results.filter(r => r.transcription).length;
  const withAnalysis = results.filter(r => r.analysisOk).length;

  let msg = `<b>Max — Analise Semanal de Criativos</b>

<b>Resumo:</b>
• ${results.length} winners encontrados
• Total de vendas: ${totalSales}
• Range ROAS: ${minRoas}x — ${maxRoas}x
• Videos: ${withVideo} | Transcricoes: ${withTranscription} | Analisados com GPT-4o: ${withAnalysis}
• Criterio: ${MIN_SALES}+ vendas E ROAS >= ${MIN_ROAS}

`;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];

    let diagnosis = '—';
    if (r.analysisRaw) {
      try {
        const analysisObj = typeof r.analysisRaw === 'string' ? JSON.parse(r.analysisRaw) : r.analysisRaw;
        diagnosis = analysisObj.diagnosis || analysisObj.angle || '—';
      } catch {}
    }

    msg += `<b>${i + 1}. ${escapeHtml(r.ad_name)}</b>
Campanha: ${escapeHtml(r.campaign_name)}
ROAS: <b>${r.roas.toFixed(2)}x</b> | Vendas: ${r.sales} | Spend: R$${r.spend.toFixed(2)}
Hook Rate: ${r.hook_rate.toFixed(1)}% | CTR: ${r.ctr.toFixed(2)}%
Diagnostico: ${escapeHtml(diagnosis)}
`;

    // List variation angles if available
    if (r.variationsRaw) {
      try {
        const vars = typeof r.variationsRaw === 'string' ? JSON.parse(r.variationsRaw) : r.variationsRaw;
        if (Array.isArray(vars) && vars.length > 0) {
          msg += `Variacoes geradas:\n`;
          vars.forEach((v, vi) => {
            msg += `  ${vi + 1}. ${escapeHtml(v.angle || '—')} (${v.hook_type || '—'})\n`;
          });
        }
      } catch {}
    }

    msg += '\n';
  }

  msg += `Copies completas salvas no Supabase. Use <b>analisar winners</b> para ver tudo.`;

  return msg;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ============================================================
// Main Pipeline
// ============================================================
async function run() {
  const startTime = Date.now();
  console.log(`\n=== Cron Max Creative Analysis — ${new Date().toLocaleString('pt-BR')} ===`);

  // Ensure output directory exists
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
    console.log(`[init] Criado diretorio: ${VIDEOS_DIR}`);
  }

  try {
    // ---- STEP 1: Fetch insights ----
    if (!META_ACCESS_TOKEN || !META_AD_ACCOUNT_ID) {
      throw new Error('META_ACCESS_TOKEN ou META_AD_ACCOUNT_ID nao configurados');
    }

    const allAds = await fetchAdLevelInsights();

    if (allAds.length === 0) {
      console.log('[done] Nenhum ad ativo encontrado. Abortando.');
      await sendTelegram('<b>Max</b> — Cron semanal: nenhum ad ativo encontrado. Nada para analisar.');
      return;
    }

    // ---- STEP 2: Filter winners ----
    const winners = filterWinners(allAds);

    if (winners.length === 0) {
      console.log('[done] Nenhum winner encontrado (criterio: 20+ vendas E ROAS >= 2.0).');
      await sendTelegram(`<b>Max</b> — Cron semanal: ${allAds.length} ads analisados, nenhum passou no criterio (${MIN_SALES}+ vendas E ROAS >= ${MIN_ROAS}x).`);
      return;
    }

    // ---- STEP 3: Download + Transcribe ----
    console.log('\n[STEP 3/6] Baixando videos e transcrevendo...');

    const results = [];

    for (const winner of winners) {
      console.log(`\n   --- Winner: ${winner.ad_name} (ROAS: ${winner.roas.toFixed(2)}x) ---`);

      let videoUrl = null;
      let transcription = null;
      let format = 'image';

      try {
        const media = await downloadAndTranscribe(winner);
        videoUrl     = media.videoUrl;
        transcription = media.transcription;
        format        = media.format;
      } catch (e) {
        console.log(`   [step3] Erro no winner ${winner.ad_id}: ${e.message}`);
      }

      // ---- STEP 4: Save initial record to Supabase ----
      console.log(`\n[STEP 4/6] Salvando no Supabase: ${winner.ad_name}...`);

      const record = {
        ad_id:        winner.ad_id,
        ad_name:      winner.ad_name,
        campaign_name: winner.campaign_name,
        format,
        metrics: {
          spend:         parseFloat(winner.spend.toFixed(2)),
          sales:         winner.sales,
          revenue:       parseFloat(winner.revenue.toFixed(2)),
          roas:          parseFloat(winner.roas.toFixed(4)),
          impressions:   winner.impressions,
          reach:         winner.reach,
          frequency:     parseFloat(winner.frequency.toFixed(2)),
          clicks:        winner.clicks,
          ctr:           parseFloat(winner.ctr.toFixed(4)),
          cpc:           parseFloat(winner.cpc.toFixed(2)),
          cpm:           parseFloat(winner.cpm.toFixed(2)),
          hook_rate:     parseFloat(winner.hook_rate.toFixed(2)),
          hold_25:       parseFloat(winner.hold_25.toFixed(2)),
          hold_50:       parseFloat(winner.hold_50.toFixed(2)),
          hold_75:       parseFloat(winner.hold_75.toFixed(2)),
          hold_95:       parseFloat(winner.hold_95.toFixed(2)),
          thruplay_rate: parseFloat(winner.thruplay_rate.toFixed(2))
        },
        video_url:    videoUrl,
        transcription,
        analysis:     null,
        variations:   null,
        status:       'pending',
        created_at:   new Date().toISOString()
      };

      let savedToSupabase = false;
      if (SUPABASE_URL && SUPABASE_KEY) {
        try {
          await saveToSupabase(record);
          console.log(`   Supabase: OK — ${winner.ad_name}`);
          savedToSupabase = true;
        } catch (e) {
          console.log(`   Supabase: ERRO — ${winner.ad_name}: ${e.message}`);
        }
      } else {
        console.log(`   [step4] Supabase nao configurado, pulando`);
      }

      // ---- STEP 5: Analyze with Claude ----
      console.log(`\n[STEP 5/6] Analisando com Claude: ${winner.ad_name}...`);

      let analysisStr    = null;
      let variationsStr  = null;
      let analysisRaw    = null;
      let variationsRaw  = null;
      let analysisOk     = false;

      try {
        const claudeResult = await analyzeWithAI(winner, transcription);
        analysisStr   = claudeResult.analysis;
        variationsStr = claudeResult.variations;

        if (analysisStr) {
          analysisOk  = true;
          analysisRaw = (() => { try { return JSON.parse(analysisStr); } catch { return analysisStr; } })();
        }
        if (variationsStr) {
          variationsRaw = (() => { try { return JSON.parse(variationsStr); } catch { return variationsStr; } })();
        }

        // Update Supabase with analysis + variations
        if (savedToSupabase && (analysisStr || variationsStr)) {
          try {
            await updateSupabaseRecord(winner.ad_id, {
              analysis:   analysisStr,
              variations: variationsStr,
              status:     'analyzed'
            });
            console.log(`   Supabase atualizado com analise: ${winner.ad_name}`);
          } catch (e) {
            console.log(`   [step5] Erro ao atualizar Supabase: ${e.message}`);
          }
        }
      } catch (e) {
        console.log(`   [step5] Erro na analise do winner ${winner.ad_id}: ${e.message}`);
      }

      results.push({
        ...winner,
        videoUrl,
        transcription,
        format,
        analysisStr,
        variationsStr,
        analysisRaw,
        variationsRaw,
        analysisOk
      });
    }

    // ---- STEP 6: Telegram notification ----
    console.log('\n[STEP 6/6] Enviando relatorio no Telegram...');

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const report = buildTelegramReport(winners, results);

    await sendTelegramSplit(report);

    // ---- STEP 7: Generate and send PDF ----
    console.log('\n[STEP 7/7] Gerando PDF com roteiros...');
    try {
      const { execSync } = require('child_process');
      execSync(`node ${path.join(__dirname, 'squads/zapeads/scripts/generate-creative-pdf.js')} --send`, {
        timeout: 120000,
        cwd: __dirname
      });
      console.log('   PDF gerado e enviado no Telegram!');
    } catch (pdfErr) {
      console.log(`   [pdf] Erro: ${pdfErr.message.substring(0, 200)}`);
    }

    console.log(`\n=== Cron finalizado em ${elapsed}s ===`);
    console.log(`    Winners: ${results.length}`);
    console.log(`    Com video: ${results.filter(r => r.format === 'video').length}`);
    console.log(`    Com transcricao: ${results.filter(r => r.transcription).length}`);
    console.log(`    Com analise Claude: ${results.filter(r => r.analysisOk).length}`);

  } catch (e) {
    console.error(`\n[FATAL] ${e.stack || e.message}`);
    // Notify error — single message, no retry (feedback rule)
    try {
      await sendTelegram(`<b>Max</b> — ERRO no cron semanal de criativos:\n\n<code>${escapeHtml(e.message)}</code>\n\nNao vou retentar. Verifique manualmente.`);
    } catch (tgErr) {
      console.error(`[telegram] Falha ao enviar erro: ${tgErr.message}`);
    }
    process.exit(1);
  }
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
