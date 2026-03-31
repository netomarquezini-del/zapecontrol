import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function getDateRange(period: string, startDate?: string, endDate?: string) {
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
      if (!startDate || !endDate) {
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      } else {
        start = new Date(startDate).toISOString()
        end = new Date(endDate + 'T23:59:59').toISOString()
      }
      break
    default:
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }

  return { start, end }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const url = request.nextUrl

    const period = url.searchParams.get('period') || '7d'
    const startDate = url.searchParams.get('start_date') || undefined
    const endDate = url.searchParams.get('end_date') || undefined
    const sdrId = url.searchParams.get('sdr_id') || undefined

    const { start, end } = getDateRange(period, startDate, endDate)

    // Fetch calls in period
    let callsQuery = supabase
      .from('sdr_calls')
      .select('id, status, duration_seconds, sdr_user_id, started_at, lead_id, created_at')
      .gte('created_at', start)
      .lte('created_at', end)

    if (sdrId) {
      callsQuery = callsQuery.eq('sdr_user_id', sdrId)
    }

    const { data: calls, error: callsError } = await callsQuery

    if (callsError) {
      console.error('[api/sdr/metrics] calls error:', callsError.message)
      return NextResponse.json({ error: 'Erro ao buscar chamadas' }, { status: 500 })
    }

    // Fetch leads in period
    let leadsQuery = supabase
      .from('sdr_leads')
      .select('id, status, sdr_user_id, created_at')
      .gte('created_at', start)
      .lte('created_at', end)

    if (sdrId) {
      leadsQuery = leadsQuery.eq('sdr_user_id', sdrId)
    }

    const { data: leads, error: leadsError } = await leadsQuery

    if (leadsError) {
      console.error('[api/sdr/metrics] leads error:', leadsError.message)
      return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 })
    }

    const allCalls = calls || []
    const allLeads = leads || []

    // KPI calculations
    const totalCalls = allCalls.length
    const answeredCalls = allCalls.filter(c => c.status === 'answered' || c.status === 'completed')
    const callsAnswered = answeredCalls.length
    const connectionRate = totalCalls > 0 ? (callsAnswered / totalCalls) * 100 : 0

    // Hours in period
    const periodMs = new Date(end).getTime() - new Date(start).getTime()
    const periodHours = Math.max(1, periodMs / (1000 * 60 * 60))
    // Only count business hours (roughly 8h/day)
    const periodDays = Math.max(1, periodMs / (1000 * 60 * 60 * 24))
    const businessHours = Math.max(1, periodDays * 8)
    const callsPerHour = totalCalls / businessHours

    // Average call duration (answered calls only)
    const durations = answeredCalls
      .map(c => c.duration_seconds)
      .filter((d): d is number => d !== null && d > 0)
    const avgCallDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0

    // Cost per connection: total_minutes * 0.15 / connections
    const totalMinutes = durations.reduce((a, b) => a + b, 0) / 60
    const costPerConnection = callsAnswered > 0 ? (totalMinutes * 0.15) / callsAnswered : 0

    // Lead metrics
    const totalLeads = allLeads.length
    const leadsQualified = allLeads.filter(l => l.status === 'qualificado' || l.status === 'agendado').length
    const leadsScheduled = allLeads.filter(l => l.status === 'agendado').length

    // Speed to lead: avg seconds between lead created_at and first call
    // We need to find each lead's first call
    const leadFirstCallMap: Record<string, string> = {}
    for (const call of allCalls) {
      if (!call.lead_id) continue
      if (!leadFirstCallMap[call.lead_id] || call.created_at < leadFirstCallMap[call.lead_id]) {
        leadFirstCallMap[call.lead_id] = call.created_at
      }
    }

    const speedToLeadValues: number[] = []
    for (const lead of allLeads) {
      const firstCallAt = leadFirstCallMap[lead.id]
      if (firstCallAt) {
        const diff = (new Date(firstCallAt).getTime() - new Date(lead.created_at).getTime()) / 1000
        if (diff >= 0) {
          speedToLeadValues.push(diff)
        }
      }
    }
    const speedToLeadAvg = speedToLeadValues.length > 0
      ? speedToLeadValues.reduce((a, b) => a + b, 0) / speedToLeadValues.length
      : 0

    // Calls by day
    const callsByDayMap: Record<string, { total: number; answered: number }> = {}
    for (const call of allCalls) {
      const date = call.created_at.substring(0, 10)
      if (!callsByDayMap[date]) {
        callsByDayMap[date] = { total: 0, answered: 0 }
      }
      callsByDayMap[date].total++
      if (call.status === 'answered' || call.status === 'completed') {
        callsByDayMap[date].answered++
      }
    }

    const callsByDay = Object.entries(callsByDayMap)
      .map(([date, v]) => ({ date, total: v.total, answered: v.answered }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calls by SDR
    const sdrMap: Record<string, { sdr_id: string; total: number; answered: number; durations: number[] }> = {}
    for (const call of allCalls) {
      const sid = call.sdr_user_id || 'unknown'
      if (!sdrMap[sid]) {
        sdrMap[sid] = { sdr_id: sid, total: 0, answered: 0, durations: [] }
      }
      sdrMap[sid].total++
      if (call.status === 'answered' || call.status === 'completed') {
        sdrMap[sid].answered++
        if (call.duration_seconds && call.duration_seconds > 0) {
          sdrMap[sid].durations.push(call.duration_seconds)
        }
      }
    }

    // Fetch SDR names
    const sdrIds = Object.keys(sdrMap).filter(id => id !== 'unknown')
    let sdrNamesMap: Record<string, string> = {}
    if (sdrIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name')
        .in('id', sdrIds)

      if (users) {
        for (const u of users) {
          sdrNamesMap[u.id] = u.name
        }
      }
    }

    const callsBySdr = Object.values(sdrMap).map(s => ({
      sdr_id: s.sdr_id,
      sdr_name: sdrNamesMap[s.sdr_id] || 'Desconhecido',
      total: s.total,
      answered: s.answered,
      avg_duration: s.durations.length > 0
        ? s.durations.reduce((a, b) => a + b, 0) / s.durations.length
        : 0,
      connection_rate: s.total > 0 ? (s.answered / s.total) * 100 : 0,
    }))

    // Also fetch schedules count for SDR ranking
    let schedulesQuery = supabase
      .from('sdr_schedules')
      .select('sdr_user_id')
      .gte('created_at', start)
      .lte('created_at', end)

    if (sdrId) {
      schedulesQuery = schedulesQuery.eq('sdr_user_id', sdrId)
    }

    const { data: schedules } = await schedulesQuery
    const schedulesBySdr: Record<string, number> = {}
    if (schedules) {
      for (const s of schedules) {
        const sid = s.sdr_user_id || 'unknown'
        schedulesBySdr[sid] = (schedulesBySdr[sid] || 0) + 1
      }
    }

    const callsBySdrWithSchedules = callsBySdr.map(s => ({
      ...s,
      schedules: schedulesBySdr[s.sdr_id] || 0,
    }))

    return NextResponse.json({
      kpis: {
        total_calls: totalCalls,
        calls_answered: callsAnswered,
        connection_rate: Math.round(connectionRate * 100) / 100,
        calls_per_hour: Math.round(callsPerHour * 100) / 100,
        avg_call_duration: Math.round(avgCallDuration),
        cost_per_connection: Math.round(costPerConnection * 100) / 100,
        total_leads: totalLeads,
        leads_qualified: leadsQualified,
        leads_scheduled: leadsScheduled,
        speed_to_lead_avg: Math.round(speedToLeadAvg),
      },
      calls_by_day: callsByDay,
      calls_by_sdr: callsBySdrWithSchedules,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/metrics] GET unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
