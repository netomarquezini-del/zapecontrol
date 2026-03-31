import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET: List all cadences with execution stats (count per status)
 */
export async function GET() {
  try {
    const supabase = getServiceSupabase()

    // Get all cadences
    const { data: cadences, error } = await supabase
      .from('sdr_cadences')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[api/sdr/cadences] GET error:', error.message)
      return NextResponse.json({ error: 'Erro ao buscar cadencias' }, { status: 500 })
    }

    // Get execution stats per cadence
    const cadenceIds = (cadences || []).map((c) => c.id)

    let stats: Record<string, { active: number; paused: number; completed: number; exited: number }> = {}

    if (cadenceIds.length > 0) {
      const { data: executions } = await supabase
        .from('sdr_cadence_executions')
        .select('cadence_id, status')
        .in('cadence_id', cadenceIds)

      // Aggregate stats
      for (const exec of executions || []) {
        if (!stats[exec.cadence_id]) {
          stats[exec.cadence_id] = { active: 0, paused: 0, completed: 0, exited: 0 }
        }
        const s = exec.status as keyof typeof stats[string]
        if (s in stats[exec.cadence_id]) {
          stats[exec.cadence_id][s]++
        }
      }
    }

    const result = (cadences || []).map((c) => ({
      ...c,
      execution_stats: stats[c.id] || { active: 0, paused: 0, completed: 0, exited: 0 },
    }))

    return NextResponse.json({ data: result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/cadences] GET unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST: Create cadence
 * Body: { name, description?, steps: SdrCadenceStep[], is_default?, created_by? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()
    const body = await request.json()
    const { name, description, steps, is_default, created_by } = body

    if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: 'name e steps sao obrigatorios' },
        { status: 400 }
      )
    }

    // Validate steps
    for (const step of steps) {
      if (!step.step || !step.channel || step.delay_days === undefined) {
        return NextResponse.json(
          { error: 'Cada step deve ter: step, channel, delay_days' },
          { status: 400 }
        )
      }
      if (!['phone', 'whatsapp', 'instagram'].includes(step.channel)) {
        return NextResponse.json(
          { error: `Canal invalido: ${step.channel}` },
          { status: 400 }
        )
      }
    }

    // If setting as default, unset current default
    if (is_default) {
      await supabase
        .from('sdr_cadences')
        .update({ is_default: false })
        .eq('is_default', true)
    }

    const { data, error } = await supabase
      .from('sdr_cadences')
      .insert({
        name,
        description: description || null,
        steps,
        is_active: true,
        is_default: is_default || false,
        total_leads: 0,
        conversion_rate: null,
        created_by: created_by || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[api/sdr/cadences] POST error:', error.message)
      return NextResponse.json({ error: 'Erro ao criar cadencia' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/cadences] POST unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
