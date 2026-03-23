import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/joana/supabase'
import { extractGroupMessage } from '@/lib/joana/extract-message'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

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
