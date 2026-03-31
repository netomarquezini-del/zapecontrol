import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { validateCopy, CURSO_URL } from '@/lib/types-criativos';

export const dynamic = 'force-dynamic';

const META_AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID || 'act_1122108785769636';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const META_PAGE_ID = process.env.META_PAGE_ID || '103548099270247';
const META_INSTAGRAM_ID = process.env.META_INSTAGRAM_ID || '17841403638864415';
const META_PIXEL_ID = process.env.META_PIXEL_ID || '9457207547700143';
const META_TEST_CAMPAIGN_ID = process.env.META_TEST_CAMPAIGN_ID || '';
const META_API_VERSION = 'v21.0';
const BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// v2 — Andromeda + CBO: 1 ad set por campanha, múltiplos ads dentro
const MAX_ADS_PER_CAMPAIGN = 15;
const UPLOAD_DELAY_MS = 20000; // 20s delay humanizado entre uploads (anti-ban)

// Targeting v2: 25-44, Brasil, Broad ADV+
const TARGETING_V2 = {
  age_min: 25,
  age_max: 44,
  geo_locations: { countries: ['BR'], location_types: ['home', 'recent'] },
  targeting_automation: { advantage_audience: 1 },
  publisher_platforms: ['facebook', 'instagram'],
  facebook_positions: ['feed', 'story', 'reels'],
  instagram_positions: ['stream', 'story', 'reels'],
};

// Schedule: 08h-23h (off na madrugada)
const ADSET_SCHEDULE = [
  { start_minute: 480, end_minute: 1380, days: [0, 1, 2, 3, 4, 5, 6] },
];

async function notifyTelegram(message: string) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.LEO_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) return;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
  } catch {
    // Silent
  }
}

async function metaGet(path: string) {
  const resp = await fetch(`${BASE}${path}${path.includes('?') ? '&' : '?'}access_token=${META_ACCESS_TOKEN}`);
  return resp.json();
}

async function metaPost(path: string, body: Record<string, string>) {
  const resp = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: META_ACCESS_TOKEN }),
  });
  return resp.json();
}

// Find or create the ad set for the test campaign (CBO — 1 ad set with multiple ads)
async function getOrCreateTestAdSet(campaignId: string): Promise<{ id: string; adCount: number } | null> {
  // Check existing ad sets
  const result = await metaGet(`/${campaignId}/adsets?fields=id,name,status&limit=10`);
  const adSets = result.data || [];

  // Find active ad set
  const activeAdSet = adSets.find((as: { status: string }) => as.status === 'ACTIVE');

  if (activeAdSet) {
    // Count active ads in this ad set
    const adsResult = await metaGet(`/${activeAdSet.id}/ads?fields=id&status=['ACTIVE']&limit=20`);
    const adCount = (adsResult.data || []).length;
    return { id: activeAdSet.id, adCount };
  }

  // No active ad set — create one (CBO: no budget on ad set level)
  const adSetResult = await metaPost(`/${META_AD_ACCOUNT}/adsets`, {
    campaign_id: campaignId,
    name: 'Broad ADV+ | 25-44',
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'OFFSITE_CONVERSIONS',
    destination_type: 'WEBSITE',
    promoted_object: JSON.stringify({ pixel_id: META_PIXEL_ID, custom_event_type: 'PURCHASE' }),
    targeting: JSON.stringify(TARGETING_V2),
    status: 'ACTIVE',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    pacing_type: JSON.stringify(['day_parting']),
    adset_schedule: JSON.stringify(ADSET_SCHEDULE),
  });

  if (adSetResult.error) throw new Error(`AdSet: ${adSetResult.error.message}`);
  return { id: adSetResult.id, adCount: 0 };
}

// POST /api/criativos/auto-upload — find "pronto" criativos and upload to Meta
// v2: Andromeda + CBO — adds as ads inside existing ad set (max 15 per campaign)
export async function POST() {
  const sb = getServiceSupabase();

  if (!META_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'META_ACCESS_TOKEN not configured' }, { status: 500 });
  }

  if (!META_TEST_CAMPAIGN_ID) {
    return NextResponse.json({ error: 'META_TEST_CAMPAIGN_ID not configured' }, { status: 500 });
  }

  const { data: prontos, error } = await sb
    .from('criativos')
    .select('*')
    .eq('status', 'pronto')
    .order('created_at', { ascending: true }); // FIFO — mais antigo primeiro

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!prontos || prontos.length === 0) {
    return NextResponse.json({ uploaded: 0, message: 'Nenhum criativo com status pronto' });
  }

  // Get or create the ad set in the test campaign
  let adSet: { id: string; adCount: number } | null;
  try {
    adSet = await getOrCreateTestAdSet(META_TEST_CAMPAIGN_ID);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    await notifyTelegram(`❌ ERRO: Não consegui encontrar/criar ad set na campanha de teste: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (!adSet) {
    return NextResponse.json({ error: 'Could not get or create ad set' }, { status: 500 });
  }

  // Check available slots
  const slotsAvailable = MAX_ADS_PER_CAMPAIGN - adSet.adCount;
  if (slotsAvailable <= 0) {
    await notifyTelegram(`📋 Campanha de teste lotou (${adSet.adCount}/${MAX_ADS_PER_CAMPAIGN} ads). Pausar pior criativo ou criar nova campanha.`);
    return NextResponse.json({ uploaded: 0, message: `Campanha lotou: ${adSet.adCount}/${MAX_ADS_PER_CAMPAIGN}` });
  }

  const toUpload = prontos.slice(0, slotsAvailable);
  const results: Array<{ id: string; nome: string; success: boolean; meta_ad_id?: string; error?: string }> = [];

  for (let i = 0; i < toUpload.length; i++) {
    const criativo = toUpload[i];

    try {
      // Validation
      if (!criativo.arquivo_principal) {
        await notifyTelegram(`❌ ERRO UPLOAD: ${criativo.nome} — Sem arquivo principal`);
        results.push({ id: criativo.id, nome: criativo.nome, success: false, error: 'Sem arquivo' });
        continue;
      }

      const fullCopy = [criativo.copy_primario, criativo.copy_titulo, criativo.copy_descricao].filter(Boolean).join(' ');
      const copyVal = validateCopy(fullCopy);
      if (!copyVal.valid) {
        await notifyTelegram(`❌ ERRO UPLOAD: ${criativo.nome} — Compliance: ${copyVal.errors.join(', ')}`);
        results.push({ id: criativo.id, nome: criativo.nome, success: false, error: copyVal.errors.join('; ') });
        continue;
      }

      // Download file from Supabase Storage
      const { data: fileData, error: dlError } = await sb.storage
        .from('criativos')
        .download(criativo.arquivo_principal);

      if (dlError || !fileData) {
        await notifyTelegram(`❌ ERRO UPLOAD: ${criativo.nome} — Download falhou: ${dlError?.message}`);
        results.push({ id: criativo.id, nome: criativo.nome, success: false, error: 'Download failed' });
        continue;
      }

      const isVideo = criativo.mime_type?.startsWith('video/');
      let mediaId: string;

      // Upload media to Meta
      if (isVideo) {
        const formData = new FormData();
        formData.append('source', new Blob([await fileData.arrayBuffer()], { type: criativo.mime_type || 'video/mp4' }), 'video.mp4');
        formData.append('access_token', META_ACCESS_TOKEN);

        const videoResp = await fetch(`${BASE}/${META_AD_ACCOUNT}/advideos`, { method: 'POST', body: formData });
        const videoResult = await videoResp.json();
        if (videoResult.error) throw new Error(videoResult.error.message);
        mediaId = videoResult.id;

        // Wait for processing (max 2 min, polling 5s)
        const deadline = Date.now() + 120000;
        while (Date.now() < deadline) {
          const statusResp = await fetch(`${BASE}/${mediaId}?fields=status&access_token=${META_ACCESS_TOKEN}`);
          const statusResult = await statusResp.json();
          if (statusResult.status?.video_status === 'ready') break;
          await new Promise((r) => setTimeout(r, 5000));
        }
      } else {
        const formData = new FormData();
        formData.append('filename', new Blob([await fileData.arrayBuffer()], { type: criativo.mime_type || 'image/png' }), 'image.png');
        formData.append('access_token', META_ACCESS_TOKEN);

        const imgResp = await fetch(`${BASE}/${META_AD_ACCOUNT}/adimages`, { method: 'POST', body: formData });
        const imgResult = await imgResp.json();
        if (imgResult.error) throw new Error(imgResult.error.message);
        const images = imgResult.images || {};
        const firstKey = Object.keys(images)[0];
        mediaId = images[firstKey]?.hash || '';
      }

      // Create Ad Creative (com OPT_OUT de enhancements)
      const utmTags = `utm_source=FB&utm_campaign={{campaign.name}}|{{campaign.id}}&utm_medium={{adset.name}}|{{adset.id}}&utm_content={{ad.name}}|{{ad.id}}&utm_term={{placement}}`;
      const linkUrl = `${CURSO_URL}?${utmTags}`;

      const creativeBody = {
        name: criativo.nome,
        object_story_spec: JSON.stringify(
          isVideo
            ? {
                page_id: META_PAGE_ID,
                instagram_actor_id: META_INSTAGRAM_ID,
                video_data: {
                  video_id: mediaId,
                  message: criativo.copy_primario || '',
                  title: criativo.copy_titulo || '',
                  link_description: criativo.copy_descricao || '',
                  call_to_action: { type: 'LEARN_MORE', value: { link: linkUrl } },
                },
              }
            : {
                page_id: META_PAGE_ID,
                instagram_actor_id: META_INSTAGRAM_ID,
                link_data: {
                  image_hash: mediaId,
                  message: criativo.copy_primario || '',
                  name: criativo.copy_titulo || '',
                  description: criativo.copy_descricao || '',
                  link: linkUrl,
                  call_to_action: { type: 'LEARN_MORE' },
                },
              },
        ),
        degrees_of_freedom_spec: JSON.stringify({
          creative_features_spec: {
            standard_enhancements: { enroll_status: 'OPT_OUT' },
          },
        }),
        url_tags: utmTags,
      };

      const creativeResult = await metaPost(`/${META_AD_ACCOUNT}/adcreatives`, creativeBody);
      if (creativeResult.error) throw new Error(`AdCreative: ${creativeResult.error.message}`);
      const metaCreativeId = creativeResult.id;

      // Create Ad inside existing ad set (v2: no new ad set per creative)
      const adResult = await metaPost(`/${META_AD_ACCOUNT}/ads`, {
        adset_id: adSet.id,
        creative: JSON.stringify({ creative_id: metaCreativeId }),
        name: criativo.nome,
        status: 'ACTIVE',
      });
      if (adResult.error) throw new Error(`Ad: ${adResult.error.message}`);
      const metaAdId = adResult.id;

      // Update criativo in Supabase → status em_teste
      await sb
        .from('criativos')
        .update({
          status: 'em_teste',
          meta_ad_id: metaAdId,
          meta_adset_id: adSet.id,
          meta_creative_id: metaCreativeId,
          meta_media_id: mediaId,
          meta_campaign_id: META_TEST_CAMPAIGN_ID,
          meta_upload_at: new Date().toISOString(),
          meta_url: CURSO_URL,
          updated_by: 'auto-upload-v2',
        })
        .eq('id', criativo.id);

      await notifyTelegram(
        `✅ CRIATIVO SUBIDO: ${criativo.nome}\n` +
        `Ad ID: ${metaAdId}\n` +
        `Ad Set: ${adSet.id}\n` +
        `Campanha: ${META_TEST_CAMPAIGN_ID}\n` +
        `Slot: ${adSet.adCount + i + 1}/${MAX_ADS_PER_CAMPAIGN}`,
      );

      results.push({ id: criativo.id, nome: criativo.nome, success: true, meta_ad_id: metaAdId });

      // Delay humanizado entre uploads (anti-ban)
      if (i < toUpload.length - 1) {
        await new Promise((r) => setTimeout(r, UPLOAD_DELAY_MS));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';

      // REGRA DE ERRO ABSOLUTA: para tudo, avisa 1x, aguarda resolução manual
      await notifyTelegram(
        `❌ ERRO UPLOAD — PARANDO TUDO\n` +
        `Criativo: ${criativo.nome}\n` +
        `Erro: ${msg}\n` +
        `Ação: Resolução manual necessária`,
      );
      results.push({ id: criativo.id, nome: criativo.nome, success: false, error: msg });

      // Stop — do NOT continue to next criativo (regra absoluta Neto 26/03)
      break;
    }
  }

  const uploaded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  if (uploaded > 0) {
    await notifyTelegram(
      `📊 UPLOAD CONCLUÍDO\n` +
      `Subidos: ${uploaded} | Falharam: ${failed}\n` +
      `Campanha teste: ${adSet.adCount + uploaded}/${MAX_ADS_PER_CAMPAIGN} ads ativos`,
    );
  }

  return NextResponse.json({ uploaded, failed, results });
}
