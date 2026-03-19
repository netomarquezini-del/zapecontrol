import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/permissions'
import { calculatePoints } from '@/lib/scoring'
import { Product, ScoringRule } from '@/types'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const { error } = await requirePermission('export_reports')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get('start') || new Date().toISOString().split('T')[0]
  const endDate = searchParams.get('end') || new Date().toISOString().split('T')[0]

  const supabase = createServerClient()

  const { data: entries } = await supabase
    .from('production_entries')
    .select('*, product:products(*), user:users!created_by(name)')
    .gte('production_date', startDate)
    .lte('production_date', endDate)
    .order('production_date')

  const { data: rules } = await supabase.from('scoring_rules').select('*').eq('is_active', true)
  const scoringRules = (rules || []) as ScoringRule[]

  const rows = (entries || []).map((entry) => {
    const product = entry.product as Product
    const points = calculatePoints(product, entry.quantity, scoringRules)
    return {
      'Data': entry.production_date,
      'SKU': product.sku,
      'Produto': product.name,
      'Tipo': product.type === 'embalado' ? 'Embalado' : 'Desembalado',
      'Quantidade': entry.quantity,
      'Pontos': Math.round(points * 100) / 100,
      'Lançado por': entry.user?.name || '',
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 20 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Produção')
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="producao-${startDate}-${endDate}.xlsx"`,
    },
  })
}
