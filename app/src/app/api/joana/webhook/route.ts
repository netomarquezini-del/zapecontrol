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

    // Fire all 3 Supabase operations in parallel
    await Promise.all([
      // Upsert group
      supabase.from('cs_groups').upsert({
        id: msg.groupId,
        name: msg.groupName,
        last_activity: msg.timestamp,
        updated_at: now
      }, { onConflict: 'id' }),

      // Upsert member
      msg.senderPhone
        ? supabase.from('cs_group_members').upsert({
            group_id: msg.groupId,
            phone: msg.senderPhone,
            name: msg.senderName,
            is_team: msg.isTeamMember,
            last_seen: msg.timestamp
          }, { onConflict: 'group_id,phone' })
        : Promise.resolve(),

      // Insert message (dedup by message_id)
      supabase.from('cs_messages').upsert({
        message_id: msg.messageId,
        group_id: msg.groupId,
        sender_phone: msg.senderPhone,
        sender_name: msg.senderName,
        is_team_member: msg.isTeamMember,
        content: msg.content,
        message_type: msg.messageType,
        media_url: msg.mediaUrl,
        timestamp: msg.timestamp
      }, { onConflict: 'message_id', ignoreDuplicates: true })
    ])

    return NextResponse.json({ status: 'received' })
  } catch (e: any) {
    console.error('[JOANA-CS] Webhook error:', e.message)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
