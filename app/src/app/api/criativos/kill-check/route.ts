import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { CPA_TARGET, ROAS_KILL_THRESHOLD, FREQUENCY_SATURATION, MIN_IMPRESSIONS_FOR_KILL, STATUS_TO_GERACAO_RESULTADO, type CreativeStatus } from '@/lib/types-criativos';

// Update geracoes_ia_itens when a criativo changes status (retroalimentação)
async function updateGeracaoItem(sb: ReturnType<typeof getServiceSupabase>, criativoId: string, newStatus: CreativeStatus, spend: number, roas: number, diasAtivo: number) {
  try {
    const resultado = STATUS_TO_GERACAO_RESULTADO[newStatus];
    if (!resultado) return;
    await sb.from('geracoes_ia_itens').update({
      resultado,
      cpa_final: null, // will be recalculated
      roas_final: roas || null,
      dias_ativo_final: diasAtivo || 0,
      total_spend_final: spend || null,
    }).eq('criativo_id', criativoId);
  } catch {
    // Non-blocking
  }
}

export const dynamic = 'force-dynamic';

const META_AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID || 'act_1122108785769636';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const META_API_VERSION = 'v21.0';

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
    // Silent — never spam
  }
}

async function pauseOnMeta(adId: string) {
  if (!META_ACCESS_TOKEN || !adId) return;
  try {
    await fetch(`https://graph.facebook.com/${META_API_VERSION}/${adId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PAUSED', access_token: META_ACCESS_TOKEN }),
    });
  } catch {
    // Log but don't retry
  }
}

// POST /api/criativos/kill-check — evaluate kill rules for active criativos
export async function POST() {
  const sb = getServiceSupabase();

  const { data: criativos, error } = await sb
    .from('criativos')
    .select('*')
    .in('status', ['em_teste'])
    .not('meta_ad_id', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!criativos || criativos.length === 0) {
    return NextResponse.json({ checked: 0, kills: 0 });
  }

  let kills = 0;

  for (const c of criativos) {
    if ((c.total_impressions || 0) < MIN_IMPRESSIONS_FOR_KILL) continue;

    const totalSpend = parseFloat(String(c.total_spend || 0));
    const totalPurchases = c.total_purchases || 0;
    const cpa = totalPurchases > 0 ? totalSpend / totalPurchases : Infinity;
    const roas = totalSpend > 0 ? parseFloat(String(c.total_revenue || 0)) / totalSpend : 0;

    // Kill Rule 1: High CPA
    if (cpa > CPA_TARGET * 2 && totalSpend > 90) {
      await pauseOnMeta(c.meta_ad_id);
      await sb.from('criativos').update({ status: 'pausado', updated_by: 'kill-rule' }).eq('id', c.id);
      await updateGeracaoItem(sb, c.id, 'pausado', totalSpend, roas, c.dias_ativo || 0);
      await notifyTelegram(`KILL: ${c.nome} - CPA R$${cpa.toFixed(2)} (2x target de R$${CPA_TARGET})`);
      kills++;
      continue;
    }

    // Kill Rule 2: Zero conversions after R$135
    if (totalPurchases === 0 && totalSpend >= 135) {
      await pauseOnMeta(c.meta_ad_id);
      await sb.from('criativos').update({ status: 'morto', updated_by: 'kill-rule' }).eq('id', c.id);
      await updateGeracaoItem(sb, c.id, 'morto', totalSpend, roas, c.dias_ativo || 0);
      await notifyTelegram(`KILL: ${c.nome} - Zero conversoes apos R$${totalSpend.toFixed(2)} gasto`);
      kills++;
      continue;
    }

    // Kill Rule 3: Low ROAS after 3+ days
    if ((c.dias_ativo || 0) >= 3 && totalSpend >= 90 && roas < ROAS_KILL_THRESHOLD) {
      await pauseOnMeta(c.meta_ad_id);
      await sb.from('criativos').update({ status: 'pausado', updated_by: 'kill-rule' }).eq('id', c.id);
      await updateGeracaoItem(sb, c.id, 'pausado', totalSpend, roas, c.dias_ativo || 0);
      await notifyTelegram(`KILL: ${c.nome} - ROAS ${roas.toFixed(2)} < ${ROAS_KILL_THRESHOLD} apos ${c.dias_ativo} dias`);
      kills++;
      continue;
    }

    // Rule 4: Saturation alert (no auto-kill)
    if (parseFloat(String(c.frequency_atual || 0)) > FREQUENCY_SATURATION) {
      const { data: metrics } = await sb
        .from('metricas_criativos')
        .select('ctr')
        .eq('criativo_id', c.id)
        .order('date', { ascending: false })
        .limit(3);

      if (metrics && metrics.length >= 3) {
        const ctrs = metrics.map((m) => parseFloat(String(m.ctr)));
        if (ctrs[0] < ctrs[1] && ctrs[1] < ctrs[2]) {
          await sb.from('criativos').update({ status: 'saturado', updated_by: 'kill-rule' }).eq('id', c.id);
          await updateGeracaoItem(sb, c.id, 'saturado', totalSpend, roas, c.dias_ativo || 0);
          await notifyTelegram(`SATURACAO: ${c.nome} - freq ${c.frequency_atual}, CTR caindo ha 3 dias`);
        }
      }
    }
  }

  return NextResponse.json({ checked: criativos.length, kills });
}
