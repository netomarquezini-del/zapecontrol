import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 min — precisa de tempo pra sync + kill + winner

// POST /api/criativos/otimizar-teste
// Cron permanente — roda todo dia às 04:03 (Vercel Cron)
// Executa em sequência: sync métricas → kill check → winner check
// Chamado pelo vercel.json cron schedule
export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zapecontrol.vercel.app';
  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  // Passo 1: Sincronizar métricas da Meta API
  try {
    const syncRes = await fetch(`${baseUrl}/api/metricas/sync`, { method: 'POST' });
    results.sync = await syncRes.json();
    if (!syncRes.ok) errors.push(`sync: ${syncRes.status}`);
  } catch (err) {
    results.sync = { error: String(err) };
    errors.push(`sync: ${String(err)}`);
  }

  // Passo 2: Aplicar kill rules (pausar/matar criativos ruins)
  try {
    const killRes = await fetch(`${baseUrl}/api/criativos/kill-check`, { method: 'POST' });
    results.kill = await killRes.json();
    if (!killRes.ok) errors.push(`kill: ${killRes.status}`);
  } catch (err) {
    results.kill = { error: String(err) };
    errors.push(`kill: ${String(err)}`);
  }

  // Passo 3: Detectar winners e graduar pra escala
  try {
    const winnerRes = await fetch(`${baseUrl}/api/criativos/winner-check`, { method: 'POST' });
    results.winner = await winnerRes.json();
    if (!winnerRes.ok) errors.push(`winner: ${winnerRes.status}`);
  } catch (err) {
    results.winner = { error: String(err) };
    errors.push(`winner: ${String(err)}`);
  }

  // Notificar no Telegram se houve ações
  const killData = results.kill as Record<string, number> | undefined;
  const winnerData = results.winner as Record<string, number> | undefined;
  const hadActions = (killData?.kills ?? 0) > 0 || (winnerData?.winners ?? 0) > 0 || (winnerData?.graduated ?? 0) > 0;

  if (hadActions) {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.LEO_TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      if (botToken && chatId) {
        const lines = [
          '📊 <b>Otimização Campanha Teste — Resumo 04h</b>',
          '',
          `🔍 Criativos analisados: ${killData?.checked ?? 0}`,
          `🔴 Kills: ${killData?.kills ?? 0}`,
          `⏳ Monitorando: ${killData?.monitors ?? 0}`,
          `🏅 Winners detectados: ${winnerData?.winners ?? 0}`,
          `⬆️ Graduados pra escala: ${winnerData?.graduated ?? 0}`,
        ];
        if (errors.length > 0) {
          lines.push('', `❌ Erros: ${errors.join(', ')}`);
        }
        lines.push('', '— Léo Cron 🎯');

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), parse_mode: 'HTML' }),
        });
      }
    } catch {
      // Silent
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    errors,
    results,
  });
}

// GET handler — Vercel Cron calls GET by default
export async function GET() {
  return POST();
}
