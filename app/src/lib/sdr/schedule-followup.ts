/**
 * Schedule follow-up processor
 * Handles D-1 and D-0 follow-up messages via WhatsApp
 * Also detects no-shows (scheduled_at + 1h passed without status = 'realizado')
 */

import { getServiceSupabase } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/sdr/whatsapp-client'

interface FollowupResult {
  d1_sent: number
  d0_sent: number
  no_shows: number
}

/**
 * Get the follow-up template message.
 */
export function getFollowupTemplate(type: 'd1' | 'd0'): string {
  if (type === 'd1') {
    return 'Ola {{nome}}, lembrando que amanha as {{hora}} voce tem uma reuniao agendada com {{closer}}. Confirma sua presenca?'
  }
  return 'Ola {{nome}}, sua reuniao e hoje as {{hora}} com {{closer}}. Estamos te esperando!'
}

/**
 * Replace template variables with actual values.
 */
function renderTemplate(
  template: string,
  vars: { nome: string; hora: string; closer: string }
): string {
  return template
    .replace(/\{\{nome\}\}/gi, vars.nome)
    .replace(/\{\{hora\}\}/gi, vars.hora)
    .replace(/\{\{closer\}\}/gi, vars.closer)
}

/**
 * Process all pending follow-ups and detect no-shows.
 * Called by cron or manually via the followup API route.
 */
export async function processFollowups(): Promise<FollowupResult> {
  const result: FollowupResult = { d1_sent: 0, d0_sent: 0, no_shows: 0 }
  const supabase = getServiceSupabase()
  const now = new Date()

  // ── Compute date boundaries ──────────────────────────────
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const tomorrowEnd = new Date(todayEnd)
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)

  // ── 1. D-1 follow-ups (scheduled for tomorrow, flag not sent) ─
  const { data: d1Schedules, error: d1Err } = await supabase
    .from('sdr_schedules')
    .select(`
      id,
      scheduled_at,
      closer_user_id,
      lead_id,
      sdr_leads!inner ( id, nome, telefone )
    `)
    .in('status', ['agendado', 'confirmado'])
    .gte('scheduled_at', tomorrowStart.toISOString())
    .lte('scheduled_at', tomorrowEnd.toISOString())
    .eq('followup_sent_d1', false)

  if (d1Err) {
    console.error('[schedule-followup] D-1 query error:', d1Err.message)
  }

  for (const schedule of d1Schedules || []) {
    try {
      const lead = schedule.sdr_leads as unknown as { id: string; nome: string; telefone: string }
      const closerName = await getCloserName(supabase, schedule.closer_user_id)
      const hora = formatTime(schedule.scheduled_at)

      const content = renderTemplate(getFollowupTemplate('d1'), {
        nome: lead.nome,
        hora,
        closer: closerName,
      })

      const sendResult = await sendWhatsAppMessage(lead.telefone, content)
      if (sendResult.success) {
        await supabase
          .from('sdr_schedules')
          .update({ followup_sent_d1: true })
          .eq('id', schedule.id)

        // Log the message
        await supabase.from('sdr_messages').insert({
          lead_id: lead.id,
          sdr_user_id: 'system',
          channel: 'whatsapp',
          direction: 'outbound',
          status: 'sent',
          content,
          external_message_id: sendResult.externalMessageId || null,
          sent_at: new Date().toISOString(),
        })

        result.d1_sent++
      }
    } catch (err) {
      console.error(`[schedule-followup] D-1 send failed for schedule ${schedule.id}:`, err)
    }
  }

  // ── 2. D-0 follow-ups (scheduled for today, flag not sent) ─
  const { data: d0Schedules, error: d0Err } = await supabase
    .from('sdr_schedules')
    .select(`
      id,
      scheduled_at,
      closer_user_id,
      lead_id,
      sdr_leads!inner ( id, nome, telefone )
    `)
    .in('status', ['agendado', 'confirmado'])
    .gte('scheduled_at', todayStart.toISOString())
    .lte('scheduled_at', todayEnd.toISOString())
    .eq('followup_sent_d0', false)

  if (d0Err) {
    console.error('[schedule-followup] D-0 query error:', d0Err.message)
  }

  for (const schedule of d0Schedules || []) {
    try {
      const lead = schedule.sdr_leads as unknown as { id: string; nome: string; telefone: string }
      const closerName = await getCloserName(supabase, schedule.closer_user_id)
      const hora = formatTime(schedule.scheduled_at)

      const content = renderTemplate(getFollowupTemplate('d0'), {
        nome: lead.nome,
        hora,
        closer: closerName,
      })

      const sendResult = await sendWhatsAppMessage(lead.telefone, content)
      if (sendResult.success) {
        await supabase
          .from('sdr_schedules')
          .update({ followup_sent_d0: true })
          .eq('id', schedule.id)

        await supabase.from('sdr_messages').insert({
          lead_id: lead.id,
          sdr_user_id: 'system',
          channel: 'whatsapp',
          direction: 'outbound',
          status: 'sent',
          content,
          external_message_id: sendResult.externalMessageId || null,
          sent_at: new Date().toISOString(),
        })

        result.d0_sent++
      }
    } catch (err) {
      console.error(`[schedule-followup] D-0 send failed for schedule ${schedule.id}:`, err)
    }
  }

  // ── 3. No-show detection ────────────────────────────────
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const { data: noShows, error: nsErr } = await supabase
    .from('sdr_schedules')
    .select('id, lead_id')
    .in('status', ['agendado', 'confirmado'])
    .lt('scheduled_at', oneHourAgo.toISOString())

  if (nsErr) {
    console.error('[schedule-followup] No-show query error:', nsErr.message)
  }

  for (const schedule of noShows || []) {
    try {
      await supabase
        .from('sdr_schedules')
        .update({
          status: 'no_show',
          no_show_at: now.toISOString(),
        })
        .eq('id', schedule.id)

      // Log interaction
      await supabase.from('sdr_interactions').insert({
        lead_id: schedule.lead_id,
        sdr_user_id: 'system',
        type: 'schedule',
        summary: 'No-show detectado automaticamente',
        metadata: {
          schedule_id: schedule.id,
          detected_at: now.toISOString(),
        },
      })

      result.no_shows++
    } catch (err) {
      console.error(`[schedule-followup] No-show update failed for schedule ${schedule.id}:`, err)
    }
  }

  return result
}

/**
 * Get closer display name from users table.
 */
async function getCloserName(
  supabase: ReturnType<typeof getServiceSupabase>,
  closerUserId: string | null
): Promise<string> {
  if (!closerUserId) return 'Equipe'

  const { data } = await supabase
    .from('users')
    .select('name')
    .eq('id', closerUserId)
    .single()

  return data?.name || 'Equipe'
}

/**
 * Format a datetime string to HH:mm in Sao Paulo timezone.
 */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}
