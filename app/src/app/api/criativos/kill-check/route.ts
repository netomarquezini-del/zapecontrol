import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { CPA_TARGET, FREQUENCY_SATURATION, MIN_IMPRESSIONS_FOR_KILL, CPA_KILL_MULTIPLIER, CPA_MONITOR_MULTIPLIER, CPA_HIGH_DAYS, CTR_DROP_PCT, ESCALA_ROAS_KILL, ESCALA_ROAS_KILL_DAYS, BUDGET_FREEZE_DAYS, STATUS_TO_GERACAO_RESULTADO, type CreativeStatus } from '@/lib/types-criativos';

// Update geracoes_ia_itens when a criativo changes status (retroalimentação)
async function updateGeracaoItem(sb: ReturnType<typeof getServiceSupabase>, criativoId: string, newStatus: CreativeStatus, spend: number, roas: number, diasAtivo: number) {
  try {
    const resultado = STATUS_TO_GERACAO_RESULTADO[newStatus];
    if (!resultado) return;
    await sb.from('geracoes_ia_itens').update({
      resultado,
      cpa_final: null,
      roas_final: roas || null,
      dias_ativo_final: diasAtivo || 0,
      total_spend_final: spend || null,
    }).eq('criativo_id', criativoId);
  } catch {
    // Non-blocking
  }
}

export const dynamic = 'force-dynamic';

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
    // Silent
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

// POST /api/criativos/kill-check
// v3 — Kill rules atualizadas (02/04/2026)
// Teste: CPA-based (2x target sem conversão, 1.5x com 1, CPA 50%+ por 5 dias)
// Escala: ROAS-based (ROAS < 1.3 por 5 dias seguidos)
// Ambas: Frequência > 3.5 + CTR caindo, CTR -30% vs primeiros dias
// Dias 1-5: não mexer em NADA
export async function POST() {
  const sb = getServiceSupabase();

  const { data: criativos, error } = await sb
    .from('criativos')
    .select('*')
    .in('status', ['em_teste', 'escala'])
    .not('meta_ad_id', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!criativos || criativos.length === 0) {
    return NextResponse.json({ checked: 0, kills: 0, monitors: 0 });
  }

  let kills = 0;
  let monitors = 0;

  for (const c of criativos) {
    // DIAS 1-5: NÃO MEXER EM NADA
    if ((c.dias_ativo || 0) < BUDGET_FREEZE_DAYS) continue;

    // REGRA DE OURO: Nunca julgar antes de 1.000 impressões
    if ((c.total_impressions || 0) < MIN_IMPRESSIONS_FOR_KILL) continue;

    const totalSpend = parseFloat(String(c.total_spend || 0));
    const totalPurchases = c.total_purchases || 0;
    const totalRevenue = parseFloat(String(c.total_revenue || 0));
    const cpa = totalPurchases > 0 ? totalSpend / totalPurchases : Infinity;
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const frequency = parseFloat(String(c.frequency_atual || 0));
    const isEscala = c.status === 'escala';

    // ── KILL RULES (TESTE) — baseado em CPA ─────────────────
    if (!isEscala) {
      // Kill #1: Gastou 2x CPA target, ZERO conversão → MORTO
      if (totalPurchases === 0 && totalSpend >= CPA_TARGET * CPA_KILL_MULTIPLIER) {
        await pauseOnMeta(c.meta_ad_id);
        await sb.from('criativos').update({ status: 'morto', updated_by: 'kill-check-v3' }).eq('id', c.id);
        await updateGeracaoItem(sb, c.id, 'morto', totalSpend, roas, c.dias_ativo || 0);
        await notifyTelegram(`🔴 <b>KILL #1:</b> ${c.nome}\nR$${totalSpend.toFixed(0)} gasto, ZERO conversão (2x CPA target R$${CPA_TARGET})`);
        kills++;
        continue;
      }

      // Kill #2: Gastou 1.5x CPA target, apenas 1 conversão → MONITORA 48h
      if (totalPurchases === 1 && totalSpend >= CPA_TARGET * CPA_MONITOR_MULTIPLIER) {
        await notifyTelegram(`⏳ <b>MONITOR:</b> ${c.nome}\nR$${totalSpend.toFixed(0)} com 1 conversão (1.5x CPA target). Monitorando 48h.`);
        monitors++;
        continue;
      }

      // Kill #3: CPA 50%+ acima do target por 5 dias → PAUSADO
      if ((c.dias_ativo || 0) >= CPA_HIGH_DAYS && cpa > CPA_TARGET * 1.5) {
        await pauseOnMeta(c.meta_ad_id);
        await sb.from('criativos').update({ status: 'pausado', updated_by: 'kill-check-v3' }).eq('id', c.id);
        await updateGeracaoItem(sb, c.id, 'pausado', totalSpend, roas, c.dias_ativo || 0);
        await notifyTelegram(`🔴 <b>KILL #3:</b> ${c.nome}\nCPA R$${cpa.toFixed(0)} (50%+ acima de R$${CPA_TARGET}) por ${c.dias_ativo} dias`);
        kills++;
        continue;
      }
    }

    // ── KILL RULES (ESCALA) — baseado em ROAS ───────────────
    if (isEscala) {
      // Escala Kill: ROAS < 1.3 por 5 dias seguidos → PAUSADO
      const { data: metrics } = await sb
        .from('metricas_criativos')
        .select('roas, date')
        .eq('criativo_id', c.id)
        .order('date', { ascending: false })
        .limit(ESCALA_ROAS_KILL_DAYS);

      if (metrics && metrics.length >= ESCALA_ROAS_KILL_DAYS) {
        const allBelowThreshold = metrics.every(m => parseFloat(String(m.roas || 0)) < ESCALA_ROAS_KILL);
        if (allBelowThreshold) {
          await pauseOnMeta(c.meta_ad_id);
          await sb.from('criativos').update({ status: 'pausado', updated_by: 'kill-check-v3' }).eq('id', c.id);
          await updateGeracaoItem(sb, c.id, 'pausado', totalSpend, roas, c.dias_ativo || 0);
          const avgRoas = metrics.reduce((sum, m) => sum + parseFloat(String(m.roas || 0)), 0) / metrics.length;
          await notifyTelegram(
            `🔴 <b>KILL ESCALA:</b> ${c.nome}\n` +
            `ROAS < ${ESCALA_ROAS_KILL}x por ${ESCALA_ROAS_KILL_DAYS} dias seguidos (média: ${avgRoas.toFixed(2)}x)\n` +
            `Pode voltar em 2-3 semanas se público esfriar.`,
          );
          kills++;
          continue;
        }
      }
    }

    // ── SATURAÇÃO (ambas): Frequência > 3.5 + CTR caindo → SATURADO ──
    if (frequency > FREQUENCY_SATURATION) {
      const { data: metrics } = await sb
        .from('metricas_criativos')
        .select('ctr')
        .eq('criativo_id', c.id)
        .order('date', { ascending: false })
        .limit(3);

      if (metrics && metrics.length >= 3) {
        const ctrs = metrics.map((m) => parseFloat(String(m.ctr)));
        // CTR caindo nos últimos 3 dias
        if (ctrs[0] < ctrs[1] && ctrs[1] < ctrs[2]) {
          await pauseOnMeta(c.meta_ad_id);
          await sb.from('criativos').update({ status: 'saturado', updated_by: 'kill-check-v3' }).eq('id', c.id);
          await updateGeracaoItem(sb, c.id, 'saturado', totalSpend, roas, c.dias_ativo || 0);
          const msg = isEscala
            ? `🟠 <b>SATURAÇÃO ESCALA:</b> ${c.nome}\nFreq ${frequency.toFixed(1)}, CTR caindo. Pode voltar em 2-3 semanas.`
            : `🟠 <b>SATURAÇÃO:</b> ${c.nome}\nFreq ${frequency.toFixed(1)}, CTR caindo há 3 dias.`;
          await notifyTelegram(msg);
          kills++;
        }
      }
    }

    // ── CTR DROP (teste): CTR caiu 30%+ vs primeiros dias → PAUSADO ──
    if ((c.dias_ativo || 0) > 3 && !isEscala) {
      const { data: allMetrics } = await sb
        .from('metricas_criativos')
        .select('ctr, date')
        .eq('criativo_id', c.id)
        .order('date', { ascending: true });

      if (allMetrics && allMetrics.length >= 4) {
        const initialCtrs = allMetrics.slice(0, 3);
        const avgInitialCtr = initialCtrs.reduce((sum, m) => sum + parseFloat(String(m.ctr || 0)), 0) / 3;
        const currentCtr = parseFloat(String(c.ctr_atual || 0));

        if (avgInitialCtr > 0 && currentCtr < avgInitialCtr * (1 - CTR_DROP_PCT)) {
          await pauseOnMeta(c.meta_ad_id);
          await sb.from('criativos').update({ status: 'pausado', updated_by: 'kill-check-v3' }).eq('id', c.id);
          await updateGeracaoItem(sb, c.id, 'pausado', totalSpend, roas, c.dias_ativo || 0);
          const dropPct = ((1 - currentCtr / avgInitialCtr) * 100).toFixed(0);
          await notifyTelegram(`🔴 <b>KILL CTR:</b> ${c.nome}\nCTR caiu ${dropPct}% vs primeiros 3 dias (creative fatigue)`);
          kills++;
        }
      }
    }
  }

  return NextResponse.json({ checked: criativos.length, kills, monitors });
}
