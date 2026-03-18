import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { calculatePoints } from '@/lib/scoring'
import { Product, ScoringRule } from '@/types'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = createServerClient()
  const today = new Date().toISOString().split('T')[0]

  // Get current week boundaries (Monday-Sunday)
  const now = new Date()
  const dayOfWeek = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - dayOfWeek + 1)
  const weekStart = monday.toISOString().split('T')[0]

  // Previous week
  const prevMonday = new Date(monday)
  prevMonday.setDate(monday.getDate() - 7)
  const prevWeekStart = prevMonday.toISOString().split('T')[0]
  const prevSunday = new Date(monday)
  prevSunday.setDate(monday.getDate() - 1)
  const prevWeekEnd = prevSunday.toISOString().split('T')[0]

  // Fetch scoring rules
  const { data: rules } = await supabase.from('scoring_rules').select('*').eq('is_active', true)
  const scoringRules = (rules || []) as ScoringRule[]

  // Fetch today's production with product data
  const { data: todayEntries } = await supabase
    .from('production_entries')
    .select('*, product:products(*)')
    .eq('production_date', today)

  // Fetch this week's production
  const { data: weekEntries } = await supabase
    .from('production_entries')
    .select('*, product:products(*)')
    .gte('production_date', weekStart)
    .lte('production_date', today)

  // Fetch previous week's production
  const { data: prevWeekEntries } = await supabase
    .from('production_entries')
    .select('*, product:products(*)')
    .gte('production_date', prevWeekStart)
    .lte('production_date', prevWeekEnd)

  // Fetch global goal
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .is('product_id', null)
    .lte('valid_from', today)
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .order('valid_from', { ascending: false })
    .limit(1)

  const globalGoal = goals?.[0]

  // Calculate points
  let todayQuantity = 0
  let todayPoints = 0
  for (const entry of todayEntries || []) {
    todayQuantity += entry.quantity
    todayPoints += calculatePoints(entry.product as Product, entry.quantity, scoringRules)
  }

  let weekQuantity = 0
  let weekPoints = 0
  for (const entry of weekEntries || []) {
    weekQuantity += entry.quantity
    weekPoints += calculatePoints(entry.product as Product, entry.quantity, scoringRules)
  }

  let prevWeekPoints = 0
  for (const entry of prevWeekEntries || []) {
    prevWeekPoints += calculatePoints(entry.product as Product, entry.quantity, scoringRules)
  }

  const todayGoal = globalGoal?.daily_target || null
  const todayPercentage = todayGoal ? Math.round((todayPoints / todayGoal) * 100) : null
  const weekComparison = prevWeekPoints > 0
    ? Math.round(((weekPoints - prevWeekPoints) / prevWeekPoints) * 100)
    : null

  return NextResponse.json({
    todayQuantity,
    todayPoints: Math.round(todayPoints * 100) / 100,
    todayGoal,
    todayPercentage,
    weekQuantity,
    weekPoints: Math.round(weekPoints * 100) / 100,
    weekComparison,
  })
}
