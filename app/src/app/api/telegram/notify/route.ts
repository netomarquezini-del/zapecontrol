import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CHANNEL_CONFIG: Record<string, { tokenEnv: string; chatEnv: string }> = {
  leo: { tokenEnv: 'TELEGRAM_BOT_TOKEN', chatEnv: 'TELEGRAM_CHAT_ID' },
  max: { tokenEnv: 'MAX_TELEGRAM_BOT_TOKEN', chatEnv: 'MAX_TELEGRAM_CHAT_ID' },
  maicon: { tokenEnv: 'MAICON_TELEGRAM_BOT_TOKEN', chatEnv: 'MAICON_TELEGRAM_CHAT_ID' },
  thomas: { tokenEnv: 'THOMAS_TELEGRAM_BOT_TOKEN', chatEnv: 'THOMAS_TELEGRAM_CHAT_ID' },
};

// POST /api/telegram/notify — send notification to Telegram channel
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { channel, message, event } = body;

  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const channels = channel ? [channel] : ['leo'];
  const results: Array<{ channel: string; success: boolean; error?: string }> = [];

  for (const ch of channels) {
    const config = CHANNEL_CONFIG[ch];
    if (!config) {
      results.push({ channel: ch, success: false, error: 'Unknown channel' });
      continue;
    }

    const botToken = process.env[config.tokenEnv] || process.env.LEO_TELEGRAM_BOT_TOKEN;
    const chatId = process.env[config.chatEnv];

    if (!botToken || !chatId) {
      results.push({ channel: ch, success: false, error: 'Missing bot token or chat ID' });
      continue;
    }

    try {
      const prefix = event ? `[${event.toUpperCase()}] ` : '';
      const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `${prefix}${message}`,
          parse_mode: 'HTML',
        }),
      });

      const result = await resp.json();
      if (!result.ok) {
        results.push({ channel: ch, success: false, error: result.description });
      } else {
        results.push({ channel: ch, success: true });
      }
    } catch (err) {
      results.push({ channel: ch, success: false, error: err instanceof Error ? err.message : 'Unknown' });
      // Stop on error — notify once, never spam
      break;
    }
  }

  return NextResponse.json({ results });
}
