import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { enrollLeadInCadence } from '@/lib/sdr/cadence-engine'

export const dynamic = 'force-dynamic'

/**
 * POST: Enroll lead(s) in cadence
 * Body: { lead_ids: string[], cadence_id?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead_ids, cadence_id } = body as {
      lead_ids: string[]
      cadence_id?: string
    }

    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json(
        { error: 'lead_ids e obrigatorio e deve ser um array nao vazio' },
        { status: 400 }
      )
    }

    const results: { lead_id: string; success: boolean; execution_id?: string; error?: string }[] = []

    for (const leadId of lead_ids) {
      const result = await enrollLeadInCadence(leadId, cadence_id)
      results.push({
        lead_id: leadId,
        success: result.success,
        execution_id: result.executionId,
        error: result.error,
      })
    }

    const enrolled = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return NextResponse.json({
      enrolled,
      failed,
      results,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/cadences/enroll] POST unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
