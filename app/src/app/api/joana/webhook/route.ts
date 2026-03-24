import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/joana/supabase'
import { extractGroupMessage, isTeamMember } from '@/lib/joana/extract-message'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    // Handle reaction events — Z-API sends reactions without body/text/message
    if (data.type === 'reaction' || data.reaction) {
      return handleReaction(data)
    }

    // Ignore ack-only events
    if (data.ack && !data.body && !data.text && !data.message) {
      return NextResponse.json({ status: 'ignored', reason: 'ack only' })
    }
    // Ignore status updates without message
    if (!data.body && !data.text && !data.message && data.status) {
      return NextResponse.json({ status: 'ignored', reason: 'status update' })
    }

    const msg = extractGroupMessage(data)
    if (!msg) {
      return NextResponse.json({ status: 'ignored', reason: 'not a group message or empty' })
    }

    const supabase = getServiceClient()
    const now = new Date().toISOString()

    const errors: string[] = []

    // Upsert group
    const { error: groupErr } = await supabase.from('cs_groups').upsert({
      id: msg.groupId,
      name: msg.groupName,
      last_activity: msg.timestamp,
      updated_at: now
    }, { onConflict: 'id' })
    if (groupErr) errors.push(`group: ${groupErr.message}`)

    // Upsert member
    if (msg.senderPhone) {
      const { error: memberErr } = await supabase.from('cs_group_members').upsert({
        group_id: msg.groupId,
        phone: msg.senderPhone,
        name: msg.senderName,
        is_team: msg.isTeamMember,
        last_seen: msg.timestamp
      }, { onConflict: 'group_id,phone' })
      if (memberErr) errors.push(`member: ${memberErr.message}`)
    }

    // Insert message — check for duplicates manually if messageId exists
    if (msg.messageId) {
      const { data: existing } = await supabase.from('cs_messages')
        .select('id').eq('message_id', msg.messageId).limit(1)
      if (existing && existing.length > 0) {
        return NextResponse.json({ status: 'ignored', reason: 'duplicate message' })
      }
    }

    const { error: msgErr } = await supabase.from('cs_messages').insert({
      message_id: msg.messageId,
      group_id: msg.groupId,
      sender_phone: msg.senderPhone || 'unknown',
      sender_name: msg.senderName,
      is_team_member: msg.isTeamMember,
      content: msg.content,
      message_type: msg.messageType,
      media_url: msg.mediaUrl,
      timestamp: msg.timestamp
    })
    if (msgErr) errors.push(`msg: ${msgErr.message}`)

    if (errors.length > 0) {
      console.error('[JOANA-CS] Webhook DB errors:', errors)
      return NextResponse.json({ status: 'partial', errors })
    }

    return NextResponse.json({ status: 'received' })
  } catch (e: any) {
    console.error('[JOANA-CS] Webhook error:', e.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * Handle reaction events from Z-API.
 * Reactions count as team interaction — saves as a message so checkAlerts
 * sees it as a team response (prevents false SLA alerts).
 */
async function handleReaction(data: Record<string, any>) {
  try {
    const groupId = data.chatId || data.phone
    if (!groupId || (!groupId.includes('@g.us') && !groupId.includes('-group'))) {
      return NextResponse.json({ status: 'ignored', reason: 'reaction not from group' })
    }

    const senderPhone = (data.participantPhone || data.participant || data.senderPhone || '').replace(/\D/g, '')
    const senderName = data.senderName || data.participantName || data.pushName || ''
    const isTeam = isTeamMember(senderName, data.fromMe === true, senderPhone)

    // Only save team reactions (we care about consultors reacting to client msgs)
    if (!isTeam) {
      return NextResponse.json({ status: 'ignored', reason: 'client reaction — not tracked' })
    }

    const emoji = data.reaction?.value || data.reaction || ''
    const groupName = data.chatName || data.chat?.name || groupId

    let timestamp: string
    if (data.momment) {
      timestamp = new Date(data.momment).toISOString()
    } else if (data.timestamp) {
      const ts = data.timestamp > 1e12 ? data.timestamp : data.timestamp * 1000
      timestamp = new Date(ts).toISOString()
    } else {
      timestamp = new Date().toISOString()
    }

    const reactionMsgId = data.messageId || data.id?.id || `reaction-${groupId}-${Date.now()}`

    const supabase = getServiceClient()

    // Upsert group activity
    await supabase.from('cs_groups').upsert({
      id: groupId,
      name: groupName,
      last_activity: timestamp,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })

    // Save reaction as a team message — this is what checkAlerts looks for
    const { error } = await supabase.from('cs_messages').insert({
      message_id: reactionMsgId,
      group_id: groupId,
      sender_phone: senderPhone || 'unknown',
      sender_name: senderName,
      is_team_member: true,
      content: `[reação: ${emoji}]`,
      message_type: 'reaction',
      media_url: null,
      timestamp
    })

    if (error) {
      console.error('[JOANA-CS] Reaction save error:', error.message)
      return NextResponse.json({ status: 'partial', errors: [error.message] })
    }

    return NextResponse.json({ status: 'received', type: 'reaction' })
  } catch (e: any) {
    console.error('[JOANA-CS] Reaction error:', e.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
