import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { CPA_TARGET, WINNER_MIN_DAYS, WINNER_MIN_PURCHASES, FREQUENCY_SATURATION, MIN_IMPRESSIONS_FOR_KILL, CPA_KILL_MULTIPLIER, CPA_HIGH_DAYS, CTR_DROP_PCT, ESCALA_CPA_KILL_MULTIPLIER, ESCALA_MIN_KILL_IMPRESSIONS } from '@/lib/types-criativos';

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
    // Silent fail — never spam
  }
}

// POST /api/metricas/sync — pull insights from Meta for active criativos
export async function POST() {
  const sb = getServiceSupabase();

  if (!META_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'META_ACCESS_TOKEN not configured' }, { status: 500 });
  }

  // 1. Get active criativos with Meta ad IDs
  const { data: criativos, error: fetchError } = await sb
    .from('criativos')
    .select('id, meta_ad_id, nome, status')
    .in('status', ['em_teste', 'winner', 'escala'])
    .not('meta_ad_id', 'is', null);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!criativos || criativos.length === 0) {
    return NextResponse.json({ synced: 0, message: 'No active criativos to sync' });
  }

  const adIds = criativos.map((c) => c.meta_ad_id).filter(Boolean);
  let synced = 0;
  let winnersDetected = 0;
  let killsExecuted = 0;
  const errors: string[] = [];
  const unmatchedAds: string[] = [];

  try {
    // 2. Fetch insights from Meta API (explicit time_range to avoid timezone issues)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const since = sevenDaysAgo.toISOString().split('T')[0];
    const until = now.toISOString().split('T')[0];

    const url = `https://graph.facebook.com/${META_API_VERSION}/${META_AD_ACCOUNT}/insights?` +
      new URLSearchParams({
        level: 'ad',
        filtering: JSON.stringify([{ field: 'ad.id', operator: 'IN', value: adIds }]),
        fields: 'ad_id,spend,impressions,clicks,ctr,cpc,cpm,frequency,actions,cost_per_action_type,action_values,reach,video_avg_time_watched_actions',
        time_increment: '1',
        time_range: JSON.stringify({ since, until }),
        access_token: META_ACCESS_TOKEN,
      });

    // Fetch all pages (Meta API paginates results)
    const insights: Record<string, unknown>[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
      const resp = await fetch(nextUrl);
      const result = await resp.json();

      if (result.error) {
        const msg = `Meta API error during sync: ${result.error.message}`;
        await notifyTelegram(`[ERRO] Sync metricas: ${msg}`);
        return NextResponse.json({ error: msg }, { status: 500 });
      }

      if (result.data) insights.push(...result.data);
      nextUrl = result.paging?.next || null;
    }

    // 3. Upsert metrics
    for (const row of insights) {
      if (!row.date_start || !row.ad_id) continue;
      if (parseFloat(row.spend || '0') === 0 && parseInt(row.impressions || '0', 10) === 0) continue;

      const criativo = criativos.find((c) => c.meta_ad_id === row.ad_id);
      if (!criativo) {
        if (!unmatchedAds.includes(row.ad_id)) unmatchedAds.push(row.ad_id);
        continue;
      }

      const purchases = (row.actions || []).find((a: { action_type: string }) => a.action_type === 'purchase')?.value || 0;
      const revenue = (row.action_values || []).find((a: { action_type: string }) => a.action_type === 'purchase')?.value || 0;
      const costPerPurchase = (row.cost_per_action_type || []).find((a: { action_type: string }) => a.action_type === 'purchase')?.value || 0;
      const roas = parseFloat(row.spend) > 0 ? parseFloat(revenue) / parseFloat(row.spend) : 0;

      const metric = {
        criativo_id: criativo.id,
        meta_ad_id: row.ad_id,
        date: row.date_start,
        spend: parseFloat(row.spend || '0'),
        impressions: parseInt(row.impressions || '0', 10),
        reach: parseInt(row.reach || '0', 10),
        clicks: parseInt(row.clicks || '0', 10),
        ctr: parseFloat(row.ctr || '0'),
        cpc: parseFloat(row.cpc || '0'),
        cpm: parseFloat(row.cpm || '0'),
        frequency: parseFloat(row.frequency || '0'),
        purchases: parseInt(purchases, 10),
        revenue: parseFloat(revenue),
        cost_per_purchase: parseFloat(costPerPurchase),
        roas,
        synced_at: new Date().toISOString(),
      };

      const { error: upsertError } = await sb
        .from('metricas_criativos')
        .upsert(metric, { onConflict: 'meta_ad_id,date' });

      if (upsertError) {
        errors.push(`Upsert error for ${row.ad_id}: ${upsertError.message}`);
        continue;
      }

      synced++;
    }

    // 4. Update denormalized totals on criativos
    for (const criativo of criativos) {
      const { data: metrics } = await sb
        .from('metricas_criativos')
        .select('*')
        .eq('criativo_id', criativo.id)
        .order('date', { ascending: false });

      if (!metrics || metrics.length === 0) continue;

      const totalSpend = metrics.reduce((sum, m) => sum + parseFloat(String(m.spend)), 0);
      const totalImpressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
      const totalClicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
      const totalPurchases = metrics.reduce((sum, m) => sum + (m.purchases || 0), 0);
      const totalRevenue = metrics.reduce((sum, m) => sum + parseFloat(String(m.revenue || 0)), 0);
      const latest = metrics[0];

      // Count consecutive good CPA days
      let consecutiveDays = 0;
      for (const m of metrics) {
        if (m.purchases > 0 && parseFloat(String(m.cost_per_purchase)) <= CPA_TARGET) {
          consecutiveDays++;
        } else {
          break;
        }
      }

      await sb
        .from('criativos')
        .update({
          total_spend: totalSpend,
          total_impressions: totalImpressions,
          total_clicks: totalClicks,
          total_purchases: totalPurchases,
          total_revenue: totalRevenue,
          cpa_atual: totalPurchases > 0 ? totalSpend / totalPurchases : null,
          roas_atual: totalSpend > 0 ? totalRevenue / totalSpend : null,
          ctr_atual: latest.ctr,
          frequency_atual: latest.frequency,
          dias_ativo: metrics.length,
          dias_consecutivos_bom: consecutiveDays,
          updated_by: 'sync',
        })
        .eq('id', criativo.id);

      // 5. Winner detection — v2: 5+ compras + CPA ≤ target por 3+ dias + 1.000 imp
      if (
        criativo.status === 'em_teste' &&
        consecutiveDays >= WINNER_MIN_DAYS &&
        totalPurchases >= WINNER_MIN_PURCHASES &&
        totalImpressions >= MIN_IMPRESSIONS_FOR_KILL
      ) {
        await sb
          .from('criativos')
          .update({
            status: 'winner',
            is_winner: true,
            winner_at: new Date().toISOString(),
            updated_by: 'sync-v2',
          })
          .eq('id', criativo.id);

        winnersDetected++;

        await notifyTelegram(
          `🏅 WINNER DETECTADO: ${criativo.nome}\n` +
          `CPA: R$${(totalSpend / totalPurchases).toFixed(2)}\n` +
          `ROAS: ${(totalRevenue / totalSpend).toFixed(2)}\n` +
          `Compras: ${totalPurchases}\n` +
          `Dias consecutivos bom: ${consecutiveDays}\n` +
          `Duplicar pra escala com MESMO Post ID!`,
        );

        // Trigger variation generation
        try {
          await fetch(new URL('/api/sugestoes/generate', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3333').toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ criativo_id: criativo.id }),
          });
        } catch {
          // Non-blocking
        }
      }

      // 6. Kill rules v2 — separado por tipo (em_teste vs escala)
      const isEscala = criativo.status === 'escala';
      const isEmTeste = criativo.status === 'em_teste';

      if ((isEmTeste || isEscala) && totalImpressions >= MIN_IMPRESSIONS_FOR_KILL) {
        const cpaAtual = totalPurchases > 0 ? totalSpend / totalPurchases : Infinity;
        const frequency = parseFloat(String(latest.frequency || 0));

        // ── TESTE kill rules ──
        if (isEmTeste) {
          // Kill #1: 2x CPA target + ZERO conversão → morto
          if (totalPurchases === 0 && totalSpend >= CPA_TARGET * CPA_KILL_MULTIPLIER) {
            await sb.from('criativos').update({ status: 'morto', updated_by: 'sync-v2' }).eq('id', criativo.id);
            await notifyTelegram(`🔴 KILL #1: ${criativo.nome} — R$${totalSpend.toFixed(0)} gasto, ZERO conversão`);
            killsExecuted++;
            continue;
          }

          // Kill #3: CPA 50%+ acima por 5 dias → pausa
          if (metrics.length >= CPA_HIGH_DAYS && cpaAtual > CPA_TARGET * 1.5) {
            await sb.from('criativos').update({ status: 'pausado', updated_by: 'sync-v2' }).eq('id', criativo.id);
            await notifyTelegram(`🔴 KILL #3: ${criativo.nome} — CPA R$${cpaAtual.toFixed(0)} (50%+ acima) por ${metrics.length} dias`);
            killsExecuted++;
            continue;
          }
        }

        // ── ESCALA kill rules (mais tolerante) ──
        if (isEscala) {
          // Escala Kill #1: CPA 50%+ acima por 5 dias → pausa
          if (metrics.length >= CPA_HIGH_DAYS && cpaAtual > CPA_TARGET * 1.5) {
            await sb.from('criativos').update({ status: 'pausado', updated_by: 'sync-v2' }).eq('id', criativo.id);
            await notifyTelegram(`🔴 KILL ESCALA: ${criativo.nome} — CPA R$${cpaAtual.toFixed(0)} (50%+ acima) por ${metrics.length} dias`);
            killsExecuted++;
            continue;
          }

          // Escala Kill #2: CPA 3x target com 2.000+ imp → arquiva
          if (totalImpressions >= ESCALA_MIN_KILL_IMPRESSIONS && cpaAtual > CPA_TARGET * ESCALA_CPA_KILL_MULTIPLIER) {
            await sb.from('criativos').update({ status: 'morto', updated_by: 'sync-v2' }).eq('id', criativo.id);
            await notifyTelegram(`🔴 ARQUIVA ESCALA: ${criativo.nome} — CPA R$${cpaAtual.toFixed(0)} (3x target) com ${totalImpressions} imp`);
            killsExecuted++;
            continue;
          }
        }

        // ── Kill #4 (ambas): Frequência > 3.5 + CTR caindo → saturado ──
        if (frequency > FREQUENCY_SATURATION && metrics.length >= 3) {
          const ctrTrend = metrics.slice(0, 3).map((m) => parseFloat(String(m.ctr)));
          const declining = ctrTrend[0] < ctrTrend[1] && ctrTrend[1] < ctrTrend[2];
          if (declining) {
            await sb.from('criativos').update({ status: 'saturado', updated_by: 'sync-v2' }).eq('id', criativo.id);
            await notifyTelegram(`🟠 SATURAÇÃO: ${criativo.nome} — freq ${frequency.toFixed(1)}, CTR caindo há 3 dias`);
            killsExecuted++;
          }
        }

        // ── Kill #5 (teste): CTR caiu 30%+ vs primeiros 3 dias ──
        if (isEmTeste && metrics.length >= 4) {
          const initialCtrs = metrics.slice(-3); // primeiros 3 dias (metrics ordenado desc)
          const avgInitialCtr = initialCtrs.reduce((sum, m) => sum + parseFloat(String(m.ctr || 0)), 0) / 3;
          const currentCtr = parseFloat(String(latest.ctr || 0));

          if (avgInitialCtr > 0 && currentCtr < avgInitialCtr * (1 - CTR_DROP_PCT)) {
            await sb.from('criativos').update({ status: 'pausado', updated_by: 'sync-v2' }).eq('id', criativo.id);
            const dropPct = ((1 - currentCtr / avgInitialCtr) * 100).toFixed(0);
            await notifyTelegram(`🔴 KILL #5: ${criativo.nome} — CTR caiu ${dropPct}% vs primeiros 3 dias`);
            killsExecuted++;
          }
        }
      }
    }

    // 7. Refresh coverage matrix
    await sb.rpc('refresh_matriz_cobertura');
  } catch (err) {
    const msg = `Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
    await notifyTelegram(`[ERRO] ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({
    version: 'v2-time-range',
    synced,
    winners_detected: winnersDetected,
    kills_executed: killsExecuted,
    errors: errors.length > 0 ? errors : undefined,
    unmatched_ads: unmatchedAds.length > 0 ? unmatchedAds : undefined,
  });
}
