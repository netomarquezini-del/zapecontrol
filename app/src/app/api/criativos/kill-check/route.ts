import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { CPA_TARGET, FREQUENCY_SATURATION, MIN_IMPRESSIONS_FOR_KILL, CPA_KILL_MULTIPLIER, CPA_MONITOR_MULTIPLIER, CPA_HIGH_DAYS, CTR_DROP_PCT, ESCALA_CPA_KILL_MULTIPLIER, ESCALA_MIN_KILL_IMPRESSIONS, STATUS_TO_GERACAO_RESULTADO, type CreativeStatus } from '@/lib/types-criativos';

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

  // Check both em_teste AND escala criativos (different tolerances)
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
    // REGRA DE OURO: Nunca julgar antes de 1.000 impressões
    if ((c.total_impressions || 0) < MIN_IMPRESSIONS_FOR_KILL) continue;

    const totalSpend = parseFloat(String(c.total_spend || 0));
    const totalPurchases = c.total_purchases || 0;
    const cpa = totalPurchases > 0 ? totalSpend / totalPurchases : Infinity;
    const roas = totalSpend > 0 ? parseFloat(String(c.total_revenue || 0)) / totalSpend : 0;
    const frequency = parseFloat(String(c.frequency_atual || 0));
    const isEscala = c.status === 'escala';

    // ── KILL RULES (TESTE) ──────────────────────────────────
    if (!isEscala) {
      // Kill #1: Gastou 2x CPA target, ZERO conversão → PAUSA IMEDIATO
      if (totalPurchases === 0 && totalSpend >= CPA_TARGET * CPA_KILL_MULTIPLIER) {
        await pauseOnMeta(c.meta_ad_id);
        await sb.from('criativos').update({ status: 'morto', updated_by: 'kill-rule-v2' }).eq('id', c.id);
        await updateGeracaoItem(sb, c.id, 'morto', totalSpend, roas, c.dias_ativo || 0);
        await notifyTelegram(`🔴 KILL #1: ${c.nome} — R$${totalSpend.toFixed(0)} gasto, ZERO conversão (2x CPA target R$${CPA_TARGET})`);
        kills++;
        continue;
      }

      // Kill #2: Gastou 1.5x CPA target, apenas 1 conversão → MONITORA 48h
      if (totalPurchases === 1 && totalSpend >= CPA_TARGET * CPA_MONITOR_MULTIPLIER) {
        await notifyTelegram(`⏳ MONITOR: ${c.nome} — R$${totalSpend.toFixed(0)} com 1 conversão (1.5x CPA target). Monitorando 48h.`);
        monitors++;
        continue;
      }

      // Kill #3: CPA 50%+ acima do target por 5 dias → PAUSA
      if ((c.dias_ativo || 0) >= CPA_HIGH_DAYS && cpa > CPA_TARGET * 1.5) {
        await pauseOnMeta(c.meta_ad_id);
        await sb.from('criativos').update({ status: 'pausado', updated_by: 'kill-rule-v2' }).eq('id', c.id);
        await updateGeracaoItem(sb, c.id, 'pausado', totalSpend, roas, c.dias_ativo || 0);
        await notifyTelegram(`🔴 KILL #3: ${c.nome} — CPA R$${cpa.toFixed(0)} (50%+ acima) por ${c.dias_ativo} dias`);
        kills++;
        continue;
      }
    }

    // ── KILL RULES (ESCALA — mais tolerante) ─────────────────
    if (isEscala) {
      // Escala Kill #1: CPA 50%+ acima por 5 dias → PAUSA (mais paciente)
      if ((c.dias_ativo || 0) >= CPA_HIGH_DAYS && cpa > CPA_TARGET * 1.5) {
        await pauseOnMeta(c.meta_ad_id);
        await sb.from('criativos').update({ status: 'pausado', updated_by: 'kill-rule-v2' }).eq('id', c.id);
        await updateGeracaoItem(sb, c.id, 'pausado', totalSpend, roas, c.dias_ativo || 0);
        await notifyTelegram(`🔴 KILL ESCALA: ${c.nome} — CPA R$${cpa.toFixed(0)} (50%+ acima) por ${c.dias_ativo} dias`);
        kills++;
        continue;
      }

      // Escala Kill #2: CPA 3x target com 2.000+ impressões → ARQUIVA
      if ((c.total_impressions || 0) >= ESCALA_MIN_KILL_IMPRESSIONS && cpa > CPA_TARGET * ESCALA_CPA_KILL_MULTIPLIER) {
        await pauseOnMeta(c.meta_ad_id);
        await sb.from('criativos').update({ status: 'morto', updated_by: 'kill-rule-v2' }).eq('id', c.id);
        await updateGeracaoItem(sb, c.id, 'morto', totalSpend, roas, c.dias_ativo || 0);
        await notifyTelegram(`🔴 ARQUIVA ESCALA: ${c.nome} — CPA R$${cpa.toFixed(0)} (3x target) com ${c.total_impressions} impressões`);
        kills++;
        continue;
      }
    }

    // ── KILL #4 (ambas): Frequência > 3.5 + CTR caindo → PAUSA ──
    if (frequency > FREQUENCY_SATURATION) {
      const { data: metrics } = await sb
        .from('metricas_criativos')
        .select('ctr')
        .eq('criativo_id', c.id)
        .order('date', { ascending: false })
        .limit(3);

      if (metrics && metrics.length >= 3) {
        const ctrs = metrics.map((m) => parseFloat(String(m.ctr)));
        if (ctrs[0] < ctrs[1] && ctrs[1] < ctrs[2]) {
          await pauseOnMeta(c.meta_ad_id);
          await sb.from('criativos').update({ status: 'saturado', updated_by: 'kill-rule-v2' }).eq('id', c.id);
          await updateGeracaoItem(sb, c.id, 'saturado', totalSpend, roas, c.dias_ativo || 0);
          const msg = isEscala
            ? `🟠 SATURAÇÃO ESCALA: ${c.nome} — freq ${frequency}, CTR caindo. Pode voltar em 2-3 semanas.`
            : `🟠 SATURAÇÃO: ${c.nome} — freq ${frequency}, CTR caindo há 3 dias`;
          await notifyTelegram(msg);
          kills++;
        }
      }
    }

    // ── KILL #5 (ambas): CTR caiu 30%+ vs primeiros dias → PAUSA ──
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
          await sb.from('criativos').update({ status: 'pausado', updated_by: 'kill-rule-v2' }).eq('id', c.id);
          await updateGeracaoItem(sb, c.id, 'pausado', totalSpend, roas, c.dias_ativo || 0);
          const dropPct = ((1 - currentCtr / avgInitialCtr) * 100).toFixed(0);
          await notifyTelegram(`🔴 KILL #5: ${c.nome} — CTR caiu ${dropPct}% vs primeiros 3 dias (creative fatigue)`);
          kills++;
        }
      }
    }
  }

  return NextResponse.json({ checked: criativos.length, kills, monitors });
}
