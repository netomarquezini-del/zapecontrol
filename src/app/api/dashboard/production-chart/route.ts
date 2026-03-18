import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth/permissions'
import { calculatePoints } from '@/lib/scoring'
import { Product, ScoringRule } from '@/types'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '7')
  const productId = searchParams.get('product_id')
  const type = searchParams.get('type')

  const supabase = createServerClient()
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days + 1)

  const start = startDate.toISOString().split('T')[0]
  const end = endDate.toISOString().split('T')[0]

  let query = supabase
    .from('production_entries')
    .select('*, product:products(*)')
    .gte('production_date', start)
    .lte('production_date', end)
    .order('production_date')

  if (productId) query = query.eq('product_id', productId)

  const { data: entries } = await query
  const { data: rules } = await supabase.from('scoring_rules').select('*').eq('is_active', true)
  const scoringRules = (rules || []) as ScoringRule[]

  // Fetch global goals
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .is('product_id', null)
    .lte('valid_from', end)
    .or(`valid_until.is.null,valid_until.gte.${start}`)
    .order('valid_from', { ascending: false })
    .limit(1)

  const dailyGoal = goals?.[0]?.daily_target || null

  // Group by date
  const dateMap: Record<string, { quantity: number; points: number }> = {}
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dateMap[d.toISOString().split('T')[0]] = { quantity: 0, points: 0 }
  }

  for (const entry of entries || []) {
    const product = entry.product as Product
    if (type && product.type !== type) continue

    const date = entry.production_date
    if (!dateMap[date]) dateMap[date] = { quantity: 0, points: 0 }
    dateMap[date].quantity += entry.quantity
    dateMap[date].points += calculatePoints(product, entry.quantity, scoringRules)
  }

  const chartData = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      quantity: data.quantity,
      points: Math.round(data.points * 100) / 100,
      goal: dailyGoal,
    }))

  return NextResponse.json(chartData)
}
