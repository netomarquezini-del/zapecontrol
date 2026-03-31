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

// POST /api/criativos/auto-upload — find "pronto" criativos and upload to Meta
export async function POST() {
  const sb = getServiceSupabase();

  if (!META_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'META_ACCESS_TOKEN not configured' }, { status: 500 });
  }

  const { data: prontos, error } = await sb
    .from('criativos')
    .select('*')
    .eq('status', 'pronto');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!prontos || prontos.length === 0) {
    return NextResponse.json({ uploaded: 0, message: 'No criativos with status pronto' });
  }

  const results: Array<{ id: string; nome: string; success: boolean; meta_ad_id?: string; error?: string }> = [];

  for (const criativo of prontos) {
    try {
      // Validation
      if (!criativo.arquivo_principal) {
        await notifyTelegram(`[ERRO UPLOAD] ${criativo.nome}: Sem arquivo principal`);
        results.push({ id: criativo.id, nome: criativo.nome, success: false, error: 'Sem arquivo' });
        continue;
      }

      const fullCopy = [criativo.copy_primario, criativo.copy_titulo, criativo.copy_descricao].filter(Boolean).join(' ');
      const copyVal = validateCopy(fullCopy);
      if (!copyVal.valid) {
        await notifyTelegram(`[ERRO UPLOAD] ${criativo.nome}: ${copyVal.errors.join(', ')}`);
        results.push({ id: criativo.id, nome: criativo.nome, success: false, error: copyVal.errors.join('; ') });
        continue;
      }

      // Download file from Supabase Storage
      const { data: fileData, error: dlError } = await sb.storage
        .from('criativos')
        .download(criativo.arquivo_principal);

      if (dlError || !fileData) {
        await notifyTelegram(`[ERRO UPLOAD] ${criativo.nome}: Download falhou - ${dlError?.message}`);
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

        // Wait for processing (max 2 min)
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

      // Create Ad Creative
      const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      const creativeBody = {
        name: `${criativo.nome} - ${dateStr}`,
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
                  call_to_action: { type: 'LEARN_MORE', value: { link: CURSO_URL } },
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
                  link: CURSO_URL,
                  call_to_action: { type: 'LEARN_MORE' },
                },
              },
        ),
        degrees_of_freedom_spec: JSON.stringify({
          creative_features_spec: {
            standard_enhancements: { enroll_status: 'OPT_OUT' },
          },
        }),
        access_token: META_ACCESS_TOKEN,
      };

      const creativeResp = await fetch(`${BASE}/${META_AD_ACCOUNT}/adcreatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creativeBody),
      });
      const creativeResult = await creativeResp.json();
      if (creativeResult.error) throw new Error(`AdCreative: ${creativeResult.error.message}`);
      const metaCreativeId = creativeResult.id;

      // Create Ad Set
      const adsetBody = {
        campaign_id: META_TEST_CAMPAIGN_ID,
        name: `Broad ADV+ | ${criativo.nome}`,
        daily_budget: '4500',
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'OFFSITE_CONVERSIONS',
        destination_type: 'WEBSITE',
        promoted_object: JSON.stringify({ pixel_id: META_PIXEL_ID, custom_event_type: 'PURCHASE' }),
        targeting: JSON.stringify({ age_max: 65, age_min: 18, geo_locations: { countries: ['BR'] } }),
        status: 'ACTIVE',
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        access_token: META_ACCESS_TOKEN,
      };

      const adsetResp = await fetch(`${BASE}/${META_AD_ACCOUNT}/adsets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adsetBody),
      });
      const adsetResult = await adsetResp.json();
      if (adsetResult.error) throw new Error(`AdSet: ${adsetResult.error.message}`);
      const metaAdsetId = adsetResult.id;

      // Create Ad
      const adBody = {
        adset_id: metaAdsetId,
        creative: JSON.stringify({ creative_id: metaCreativeId }),
        name: criativo.nome,
        status: 'ACTIVE',
        access_token: META_ACCESS_TOKEN,
      };

      const adResp = await fetch(`${BASE}/${META_AD_ACCOUNT}/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adBody),
      });
      const adResult = await adResp.json();
      if (adResult.error) throw new Error(`Ad: ${adResult.error.message}`);
      const metaAdId = adResult.id;

      // Update criativo
      await sb
        .from('criativos')
        .update({
          status: 'em_teste',
          meta_ad_id: metaAdId,
          meta_adset_id: metaAdsetId,
          meta_creative_id: metaCreativeId,
          meta_media_id: mediaId,
          meta_campaign_id: META_TEST_CAMPAIGN_ID,
          meta_upload_at: new Date().toISOString(),
          meta_url: CURSO_URL,
          updated_by: 'auto-upload',
        })
        .eq('id', criativo.id);

      await notifyTelegram(
        `CRIATIVO SUBIDO NA META: ${criativo.nome}\n` +
        `Ad ID: ${metaAdId}\n` +
        `Status: em_teste\n` +
        `URL: ${CURSO_URL}`,
      );

      results.push({ id: criativo.id, nome: criativo.nome, success: true, meta_ad_id: metaAdId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      await notifyTelegram(`[ERRO UPLOAD] ${criativo.nome}: ${msg}`);
      results.push({ id: criativo.id, nome: criativo.nome, success: false, error: msg });
      // Do NOT retry — stop for this criativo, continue to next
    }
  }

  return NextResponse.json({
    uploaded: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  });
}
