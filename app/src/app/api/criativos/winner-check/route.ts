import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { WINNER_MIN_PURCHASES, WINNER_MIN_ROAS, MIN_IMPRESSIONS_FOR_KILL, BUDGET_FREEZE_DAYS, ESCALA_MIN_WINNERS, ESCALA_MAX_WINNERS, STATUS_TO_GERACAO_RESULTADO } from '@/lib/types-criativos';

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

// POST /api/criativos/winner-check
// v3 — Graduação: 20+ compras E ROAS ≥ 1.8x (regras Neto 02/04/2026)
// Se existe campanha de escala → sobe na hora
// Se não existe → acumula até 8 winners, aí cria
export async function POST() {
  const sb = getServiceSupabase();

  // 1. Buscar criativos em teste com meta_ad_id
  const { data: criativos, error } = await sb
    .from('criativos')
    .select('*')
    .eq('status', 'em_teste')
    .not('meta_ad_id', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!criativos || criativos.length === 0) {
    return NextResponse.json({ checked: 0, winners: 0, graduated: 0 });
  }

  let winnersDetected = 0;
  let graduated = 0;

  for (const c of criativos) {
    // Dias 1-5: não analisar (campanha nova, Andromeda aprendendo)
    if ((c.dias_ativo || 0) < BUDGET_FREEZE_DAYS) continue;

    // Nunca julgar antes de 1.000 impressões
    if ((c.total_impressions || 0) < MIN_IMPRESSIONS_FOR_KILL) continue;

    const totalPurchases = c.total_purchases || 0;
    const totalSpend = parseFloat(String(c.total_spend || 0));
    const totalRevenue = parseFloat(String(c.total_revenue || 0));
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const cpa = totalPurchases > 0 ? totalSpend / totalPurchases : 0;

    // GRADUAÇÃO: 20+ compras E ROAS ≥ 1.8x
    if (totalPurchases >= WINNER_MIN_PURCHASES && roas >= WINNER_MIN_ROAS) {
      await sb.from('criativos').update({
        status: 'winner',
        is_winner: true,
        winner_at: new Date().toISOString(),
        updated_by: 'winner-check-v3',
      }).eq('id', c.id);

      winnersDetected++;

      await notifyTelegram(
        `🏅 <b>WINNER DETECTADO:</b> ${c.nome}\n` +
        `Compras: ${totalPurchases} | ROAS: ${roas.toFixed(2)}x | CPA: R$${cpa.toFixed(2)}\n` +
        `Critério: ${WINNER_MIN_PURCHASES}+ compras E ROAS ≥ ${WINNER_MIN_ROAS}x ✅`,
      );

      // Retroalimentação: update geracoes_ia_itens
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
        // Non-blocking
      }
    }
  }

  // 2. Tentar graduar winners para escala
  if (winnersDetected > 0) {
    graduated = await tryGraduateToEscala(sb);
  }

  return NextResponse.json({ checked: criativos.length, winners: winnersDetected, graduated });
}

// Graduar winners para campanha de escala
async function tryGraduateToEscala(sb: ReturnType<typeof getServiceSupabase>): Promise<number> {
  // Buscar todos os winners pendentes (não estão em escala ainda)
  const { data: winners } = await sb
    .from('criativos')
    .select('*')
    .eq('status', 'winner')
    .not('meta_ad_id', 'is', null);

  if (!winners || winners.length === 0) return 0;

  // Verificar se existe campanha de escala ativa
  const { data: escalaCreatives } = await sb
    .from('criativos')
    .select('id, meta_campaign_id')
    .eq('status', 'escala');

  const hasEscalaCampaign = escalaCreatives && escalaCreatives.length > 0;
  let graduated = 0;

  if (hasEscalaCampaign) {
    // Campanha de escala existe — verificar vagas (max 15)
    const currentCount = escalaCreatives.length;
    const slotsAvailable = ESCALA_MAX_WINNERS - currentCount;

    if (slotsAvailable > 0) {
      // Tem vagas — graduar os melhores winners por ROAS
      const sortedWinners = winners
        .sort((a, b) => (b.roas_atual || 0) - (a.roas_atual || 0))
        .slice(0, slotsAvailable);

      for (const w of sortedWinners) {
        await sb.from('criativos').update({
          status: 'escala',
          updated_by: 'winner-check-v3-graduation',
        }).eq('id', w.id);

        graduated++;

        const roas = w.roas_atual || 0;
        await notifyTelegram(
          `⬆️ <b>GRADUADO PRA ESCALA:</b> ${w.nome}\n` +
          `ROAS: ${roas.toFixed(2)}x | Compras: ${w.total_purchases}\n` +
          `Usando mesmo Post ID (prova social preservada)`,
        );
      }
    } else if (slotsAvailable <= 0) {
      // Escala cheia (15) — trocar pelo pior se novo winner tem ROAS melhor
      const worstEscala = escalaCreatives.length > 0
        ? await sb.from('criativos').select('*').eq('status', 'escala').order('roas_atual', { ascending: true }).limit(1)
        : null;

      const worst = worstEscala?.data?.[0];
      if (worst) {
        for (const w of winners) {
          if ((w.roas_atual || 0) > (worst.roas_atual || 0)) {
            // Novo winner é melhor que o pior da escala — troca
            await sb.from('criativos').update({
              status: 'pausado',
              updated_by: 'winner-check-v3-swap',
            }).eq('id', worst.id);

            await sb.from('criativos').update({
              status: 'escala',
              updated_by: 'winner-check-v3-graduation',
            }).eq('id', w.id);

            graduated++;

            await notifyTelegram(
              `🔄 <b>TROCA NA ESCALA:</b>\n` +
              `⬆️ Entra: ${w.nome} (ROAS ${(w.roas_atual || 0).toFixed(2)}x)\n` +
              `⬇️ Sai: ${worst.nome} (ROAS ${(worst.roas_atual || 0).toFixed(2)}x)`,
            );
            break; // 1 troca por ciclo
          }
        }
      }
    }
  } else {
    // Não existe campanha de escala — precisa acumular 8 winners mínimo
    if (winners.length >= ESCALA_MIN_WINNERS) {
      // Tem 8+ winners! Hora de criar campanha de escala
      await notifyTelegram(
        `🚀 <b>${winners.length} WINNERS ACUMULADOS!</b>\n` +
        `Mínimo de ${ESCALA_MIN_WINNERS} atingido.\n` +
        `Pronto pra criar campanha de escala!\n` +
        `Winners: ${winners.map(w => w.nome).join(', ')}`,
      );
      // Marcar como escala (a criação da campanha na Meta será manual ou via outro endpoint)
      const toGraduate = winners
        .sort((a, b) => (b.roas_atual || 0) - (a.roas_atual || 0))
        .slice(0, ESCALA_MAX_WINNERS);

      for (const w of toGraduate) {
        await sb.from('criativos').update({
          status: 'escala',
          updated_by: 'winner-check-v3-graduation',
        }).eq('id', w.id);
        graduated++;
      }
    } else {
      await notifyTelegram(
        `📊 <b>WINNERS ACUMULANDO:</b> ${winners.length}/${ESCALA_MIN_WINNERS}\n` +
        `Faltam ${ESCALA_MIN_WINNERS - winners.length} winners pra criar campanha de escala.`,
      );
    }
  }

  return graduated;
}
