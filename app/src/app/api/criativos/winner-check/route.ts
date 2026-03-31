import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { CPA_TARGET, WINNER_MIN_DAYS, WINNER_MIN_PURCHASES, STATUS_TO_GERACAO_RESULTADO } from '@/lib/types-criativos';

export const dynamic = 'force-dynamic';

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

// POST /api/criativos/winner-check — detect winners among em_teste criativos
export async function POST() {
  const sb = getServiceSupabase();

  const { data: criativos, error } = await sb
    .from('criativos')
    .select('*')
    .eq('status', 'em_teste')
    .not('meta_ad_id', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!criativos || criativos.length === 0) {
    return NextResponse.json({ checked: 0, winners: 0 });
  }

  let winnersDetected = 0;

  for (const c of criativos) {
    // Check consecutive good CPA days
    const { data: metrics } = await sb
      .from('metricas_criativos')
      .select('*')
      .eq('criativo_id', c.id)
      .order('date', { ascending: false });

    if (!metrics || metrics.length < WINNER_MIN_DAYS) continue;

    let consecutiveDays = 0;
    let totalPurchases = 0;
    let totalSpend = 0;
    let totalRevenue = 0;

    for (const m of metrics) {
      totalPurchases += m.purchases || 0;
      totalSpend += parseFloat(String(m.spend || 0));
      totalRevenue += parseFloat(String(m.revenue || 0));

      if (m.purchases > 0 && parseFloat(String(m.cost_per_purchase)) <= CPA_TARGET) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    // v2: 5+ compras + CPA ≤ target por 3-5 dias + 1.000 impressões + tendência estável
    const totalImpressions = c.total_impressions || 0;
    if (consecutiveDays >= WINNER_MIN_DAYS && totalPurchases >= WINNER_MIN_PURCHASES && totalImpressions >= 1000) {
      await sb.from('criativos').update({
        status: 'winner',
        is_winner: true,
        winner_at: new Date().toISOString(),
        dias_consecutivos_bom: consecutiveDays,
        updated_by: 'winner-check-v2',
      }).eq('id', c.id);

      winnersDetected++;

      const cpa = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
      const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

      await notifyTelegram(
        `🏅 WINNER DETECTADO: ${c.nome}\n` +
        `CPA: R$${cpa.toFixed(2)} | ROAS: ${roas.toFixed(2)} | Compras: ${totalPurchases}\n` +
        `Dias consecutivos bom: ${consecutiveDays}\n` +
        `Duplicar pra escala com MESMO Post ID!`,
      );

      // Trigger variation generation
      try {
        await fetch(new URL('/api/sugestoes/generate', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3333').toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ criativo_id: c.id }),
        });
      } catch {
        // Non-blocking
      }

      // Retroalimentação: update geracoes_ia_itens if this criativo was AI-generated
      try {
        const resultado = STATUS_TO_GERACAO_RESULTADO['winner'];
        if (resultado) {
          await sb.from('geracoes_ia_itens').update({
            resultado,
            cpa_final: cpa,
            roas_final: roas,
            dias_ativo_final: c.dias_ativo || 0,
            total_spend_final: totalSpend,
          }).eq('criativo_id', c.id);
        }
      } catch {
        // Non-blocking — don't break winner detection
      }
    }
  }

  return NextResponse.json({ checked: criativos.length, winners: winnersDetected });
}
