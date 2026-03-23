import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/joana/supabase'

export async function GET() {
  try {
    const supabase = getServiceClient()

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - 7)

    const [groupsRes, todayRes, weekRes, teamTodayRes] = await Promise.all([
      supabase.from('cs_groups').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('cs_messages').select('id', { count: 'exact', head: true }).gte('timestamp', todayStart.toISOString()),
      supabase.from('cs_messages').select('id', { count: 'exact', head: true }).gte('timestamp', weekStart.toISOString()),
      supabase.from('cs_messages').select('id', { count: 'exact', head: true }).eq('is_team_member', true).gte('timestamp', todayStart.toISOString())
    ])

    return NextResponse.json({
      total_groups: groupsRes.count || 0,
      messages_today: todayRes.count || 0,
      messages_week: weekRes.count || 0,
      team_messages_today: teamTodayRes.count || 0,
      client_messages_today: (todayRes.count || 0) - (teamTodayRes.count || 0),
      generated_at: now.toISOString()
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
