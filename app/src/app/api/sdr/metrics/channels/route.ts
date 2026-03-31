import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const url = request.nextUrl

    const period = url.searchParams.get('period') || '7d'
    const startDate = url.searchParams.get('start_date') || undefined
    const endDate = url.searchParams.get('end_date') || undefined
    const sdrId = url.searchParams.get('sdr_id') || undefined

    const now = new Date()
    let start: string
    let end: string = now.toISOString()

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        break
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        break
      case 'custom':
        start = startDate ? new Date(startDate).toISOString() : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        if (endDate) end = new Date(endDate + 'T23:59:59').toISOString()
        break
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }

    // Fetch messages
    let messagesQuery = supabase
      .from('sdr_messages')
      .select('channel, direction, status, sent_at, delivered_at, read_at, created_at')
      .gte('created_at', start)
      .lte('created_at', end)
      .eq('direction', 'outbound')

    if (sdrId) {
      messagesQuery = messagesQuery.eq('sdr_user_id', sdrId)
    }

    const { data: messages, error: msgError } = await messagesQuery

    if (msgError) {
      console.error('[api/sdr/metrics/channels] messages error:', msgError.message)
      return NextResponse.json({ error: 'Erro ao buscar mensagens' }, { status: 500 })
    }

    // Fetch inbound messages for response rate
    let inboundQuery = supabase
      .from('sdr_messages')
      .select('channel, lead_id, created_at')
      .gte('created_at', start)
      .lte('created_at', end)
      .eq('direction', 'inbound')

    if (sdrId) {
      inboundQuery = inboundQuery.eq('sdr_user_id', sdrId)
    }

    const { data: inboundMessages } = await inboundQuery

    // Fetch calls for phone channel
    let callsQuery = supabase
      .from('sdr_calls')
      .select('status, duration_seconds, created_at')
      .gte('created_at', start)
      .lte('created_at', end)

    if (sdrId) {
      callsQuery = callsQuery.eq('sdr_user_id', sdrId)
    }

    const { data: calls, error: callsError } = await callsQuery

    if (callsError) {
      console.error('[api/sdr/metrics/channels] calls error:', callsError.message)
      return NextResponse.json({ error: 'Erro ao buscar chamadas' }, { status: 500 })
    }

    // Process WhatsApp messages
    const waMessages = (messages || []).filter(m => m.channel === 'whatsapp')
    const waSent = waMessages.length
    const waDelivered = waMessages.filter(m => m.status === 'delivered' || m.status === 'read').length
    const waRead = waMessages.filter(m => m.status === 'read').length
    const waInbound = (inboundMessages || []).filter(m => m.channel === 'whatsapp')

    // Response rate: unique leads that replied / unique leads messaged
    const waLeadsSent = new Set(waMessages.map(() => 'lead')).size // simplified
    const waResponseRate = waSent > 0 ? (waInbound.length / waSent) * 100 : 0

    // Avg response time (simplified)
    const waAvgResponseTime = 0 // Would need lead-level correlation

    // Process Instagram messages
    const igMessages = (messages || []).filter(m => m.channel === 'instagram')
    const igSent = igMessages.length
    const igDelivered = igMessages.filter(m => m.status === 'delivered' || m.status === 'read').length
    const igRead = igMessages.filter(m => m.status === 'read').length
    const igInbound = (inboundMessages || []).filter(m => m.channel === 'instagram')
    const igResponseRate = igSent > 0 ? (igInbound.length / igSent) * 100 : 0

    // Process phone calls
    const allCalls = calls || []
    const phoneTotalCalls = allCalls.length
    const phoneAnswered = allCalls.filter(c => c.status === 'answered' || c.status === 'completed').length
    const phoneConnectionRate = phoneTotalCalls > 0 ? (phoneAnswered / phoneTotalCalls) * 100 : 0
    const phoneDurations = allCalls
      .filter(c => c.duration_seconds && c.duration_seconds > 0)
      .map(c => c.duration_seconds as number)
    const phoneAvgDuration = phoneDurations.length > 0
      ? phoneDurations.reduce((a, b) => a + b, 0) / phoneDurations.length
      : 0

    return NextResponse.json({
      whatsapp: {
        sent: waSent,
        delivered: waDelivered,
        read: waRead,
        response_rate: Math.round(waResponseRate * 100) / 100,
        avg_response_time: waAvgResponseTime,
      },
      instagram: {
        sent: igSent,
        delivered: igDelivered,
        read: igRead,
        response_rate: Math.round(igResponseRate * 100) / 100,
        avg_response_time: 0,
      },
      phone: {
        total: phoneTotalCalls,
        answered: phoneAnswered,
        connection_rate: Math.round(phoneConnectionRate * 100) / 100,
        avg_duration: Math.round(phoneAvgDuration),
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/metrics/channels] unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
