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

  const supabase = createServerClient()
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days + 1)

  const { data: entries } = await supabase
    .from('production_entries')
    .select('*, product:products(*)')
    .gte('production_date', startDate.toISOString().split('T')[0])
    .lte('production_date', endDate.toISOString().split('T')[0])

  const { data: rules } = await supabase.from('scoring_rules').select('*').eq('is_active', true)
  const scoringRules = (rules || []) as ScoringRule[]

  // Aggregate by product
  const productMap: Record<string, { product: Product; quantity: number; points: number }> = {}

  for (const entry of entries || []) {
    const product = entry.product as Product
    if (!productMap[product.id]) {
      productMap[product.id] = { product, quantity: 0, points: 0 }
    }
    productMap[product.id].quantity += entry.quantity
    productMap[product.id].points += calculatePoints(product, entry.quantity, scoringRules)
  }

  const ranking = Object.values(productMap)
    .sort((a, b) => b.points - a.points)
    .slice(0, 10)
    .map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      product_sku: item.product.sku,
      product_type: item.product.type,
      photo_url: item.product.photo_url,
      total_quantity: item.quantity,
      total_points: Math.round(item.points * 100) / 100,
    }))

  return NextResponse.json(ranking)
}
