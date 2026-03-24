#!/usr/bin/env node
/**
 * Sync Meta Ads → Supabase
 * Puxa dados da Meta API e salva no Supabase.
 * Roda via cronjob ou manualmente.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load env files
function loadEnv(filePath) {
  const vars = {};
  if (!fs.existsSync(filePath)) return vars;
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) vars[match[1].trim()] = match[2].trim();
  }
  return vars;
}

const metaEnv = loadEnv(path.join(__dirname, '..', '..', 'zapeecomm', 'squads', 'zapeads', '.env'));
const supaEnv = loadEnv(path.join(__dirname, '..', 'app', '.env.local'));

const META_TOKEN = metaEnv.META_ACCESS_TOKEN;
const META_ACCOUNT = metaEnv.META_AD_ACCOUNT_ID || 'act_1122108785769636';
const SUPABASE_URL = supaEnv.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = supaEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!META_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing environment variables. Check .env files.');
  process.exit(1);
}

// --- Helpers ---

function metaFetch(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    params.access_token = META_TOKEN;
    const qs = new URLSearchParams(params).toString();
    const url = `https://graph.facebook.com/v21.0${endpoint}?${qs}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON from Meta')); }
      });
    }).on('error', reject);
  });
}

function supabaseUpsert(table, rows) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(rows);
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, count: rows.length });
        } else {
          reject(new Error(`Supabase ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getAction(actions, type) {
  if (!actions) return 0;
  const a = actions.find(a => a.action_type === type);
  return a ? Number(a.value) : 0;
}

function getCost(costs, type) {
  if (!costs) return 0;
  const c = costs.find(c => c.action_type === type);
  return c ? Number(c.value) : 0;
}

function getActionValue(values, type) {
  if (!values) return 0;
  const v = values.find(v => v.action_type === type);
  return v ? Number(v.value) : 0;
}

// --- Sync Functions ---

async function syncAccountInsights() {
  console.log('[Account] Fetching daily insights...');
  const data = await metaFetch(`/${META_ACCOUNT}/insights`, {
    fields: 'spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type,action_values',
    date_preset: 'last_30d',
    time_increment: 1
  });

  if (!data.data || data.data.length === 0) {
    console.log('[Account] No data');
    return;
  }

  const rows = data.data.map(d => {
    const spend = Number(d.spend || 0);
    const revenue = getActionValue(d.action_values, 'offsite_conversion.fb_pixel_purchase');
    return {
      date: d.date_start,
      spend,
      impressions: Number(d.impressions || 0),
      clicks: Number(d.clicks || 0),
      ctr: Number(d.ctr || 0),
      cpc: Number(d.cpc || 0),
      cpm: Number(d.cpm || 0),
      reach: Number(d.reach || 0),
      frequency: Number(d.frequency || 0),
      purchases: getAction(d.actions, 'purchase'),
      cost_per_purchase: getCost(d.cost_per_action_type, 'purchase'),
      revenue,
      roas: spend > 0 ? Number((revenue / spend).toFixed(4)) : 0,
      add_to_cart: getAction(d.actions, 'add_to_cart'),
      initiate_checkout: getAction(d.actions, 'initiate_checkout'),
      landing_page_views: getAction(d.actions, 'landing_page_view'),
      updated_at: new Date().toISOString()
    };
  });

  const result = await supabaseUpsert('meta_ads_account_insights', rows);
  console.log(`[Account] Upserted ${result.count} rows`);
}

async function syncCampaignInsights() {
  console.log('[Campaigns] Fetching daily insights...');
  const data = await metaFetch(`/${META_ACCOUNT}/insights`, {
    fields: 'campaign_id,campaign_name,spend,impressions,clicks,ctr,actions,cost_per_action_type,action_values,frequency',
    date_preset: 'last_30d',
    time_increment: 1,
    level: 'campaign',
    limit: 500
  });

  if (!data.data || data.data.length === 0) {
    console.log('[Campaigns] No data');
    return;
  }

  const rows = data.data.map(d => {
    const spend = Number(d.spend || 0);
    const revenue = getActionValue(d.action_values, 'offsite_conversion.fb_pixel_purchase');
    return {
      date: d.date_start,
      campaign_id: d.campaign_id,
      campaign_name: d.campaign_name,
      spend,
      impressions: Number(d.impressions || 0),
      clicks: Number(d.clicks || 0),
      ctr: Number(d.ctr || 0),
      purchases: getAction(d.actions, 'purchase'),
      cost_per_purchase: getCost(d.cost_per_action_type, 'purchase'),
      revenue,
      roas: spend > 0 ? Number((revenue / spend).toFixed(4)) : 0,
      frequency: Number(d.frequency || 0),
      updated_at: new Date().toISOString()
    };
  });

  // Upsert in batches of 100
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const result = await supabaseUpsert('meta_ads_campaign_insights', batch);
    console.log(`[Campaigns] Batch ${Math.floor(i/100)+1}: ${result.count} rows`);
  }
}

async function syncAdInsights() {
  console.log('[Ads] Fetching daily insights...');
  const data = await metaFetch(`/${META_ACCOUNT}/insights`, {
    fields: 'ad_id,ad_name,campaign_id,campaign_name,adset_id,adset_name,spend,impressions,clicks,ctr,actions,cost_per_action_type,action_values',
    date_preset: 'last_30d',
    time_increment: 1,
    level: 'ad',
    limit: 500
  });

  if (!data.data || data.data.length === 0) {
    console.log('[Ads] No data');
    return;
  }

  // Handle pagination
  let allData = [...data.data];
  let nextUrl = data.paging && data.paging.next;
  while (nextUrl) {
    console.log('[Ads] Fetching next page...');
    const pageData = await new Promise((resolve, reject) => {
      https.get(nextUrl, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => { try { resolve(JSON.parse(body)); } catch { reject(new Error('Bad JSON')); } });
      }).on('error', reject);
    });
    if (pageData.data) allData = allData.concat(pageData.data);
    nextUrl = pageData.paging && pageData.paging.next;
  }

  const rows = allData.map(d => {
    const spend = Number(d.spend || 0);
    const revenue = getActionValue(d.action_values, 'offsite_conversion.fb_pixel_purchase');
    return {
      date: d.date_start,
      ad_id: d.ad_id,
      ad_name: d.ad_name,
      campaign_id: d.campaign_id,
      campaign_name: d.campaign_name,
      adset_id: d.adset_id,
      adset_name: d.adset_name,
      spend,
      impressions: Number(d.impressions || 0),
      clicks: Number(d.clicks || 0),
      ctr: Number(d.ctr || 0),
      purchases: getAction(d.actions, 'purchase'),
      cost_per_purchase: getCost(d.cost_per_action_type, 'purchase'),
      revenue,
      roas: spend > 0 ? Number((revenue / spend).toFixed(4)) : 0,
      updated_at: new Date().toISOString()
    };
  });

  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const result = await supabaseUpsert('meta_ads_ad_insights', batch);
    console.log(`[Ads] Batch ${Math.floor(i/100)+1}: ${result.count} rows`);
  }
}

// --- Main ---

async function main() {
  console.log('=== Meta Ads → Supabase Sync ===');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Account: ${META_ACCOUNT}`);
  console.log('');

  try {
    await syncAccountInsights();
    await syncCampaignInsights();
    await syncAdInsights();
    console.log('\n=== Sync complete ===');
  } catch (err) {
    console.error('\n=== Sync FAILED ===');
    console.error(err.message);
    process.exit(1);
  }
}

main();
