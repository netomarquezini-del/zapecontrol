import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/joana/supabase'

export async function POST() {
  const baseUrl = process.env.JOANA_ZAPI_BASE_URL
  const clientToken = process.env.JOANA_ZAPI_CLIENT_TOKEN

  if (!baseUrl) {
    return NextResponse.json({ success: false, reason: 'JOANA_ZAPI_BASE_URL not configured' }, { status: 503 })
  }

  try {
    // Fetch all chats from Z-API with pagination
    const allGroups: any[] = []
    for (let page = 1; page <= 10; page++) {
      const res = await fetch(`${baseUrl}/chats?page=${page}&pageSize=500`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': clientToken || ''
        }
      })

      const chats = await res.json()
      if (!Array.isArray(chats) || chats.length === 0) break

      const pageGroups = chats.filter((g: any) =>
        (g.id && (g.id.includes('@g.us') || g.id.includes('-group'))) || g.isGroup === true
      )
      allGroups.push(...pageGroups)
      if (chats.length < 500) break
    }

    const groups = allGroups

    const supabase = getServiceClient()
    let synced = 0

    for (const group of groups) {
      const groupId = group.id || group.phone
      const groupName = group.name || group.title || groupId

      const { error } = await supabase.from('cs_groups').upsert({
        id: groupId,
        name: groupName,
        member_count: group.participantsCount || group.memberCount || 0,
        updated_at: new Date().toISOString(),
        is_active: true
      }, { onConflict: 'id' })

      if (!error) synced++
    }

    return NextResponse.json({ success: true, total: groups.length, synced })
  } catch (e: any) {
    console.error('[JOANA-CS] Sync groups error:', e.message)
    return NextResponse.json({ success: false, reason: e.message }, { status: 500 })
  }
}
