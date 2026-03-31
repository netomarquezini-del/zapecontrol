import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET: Single cadence with full details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceSupabase()

    const { data, error } = await supabase
      .from('sdr_cadences')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[api/sdr/cadences/[id]] GET error:', error.message)
      return NextResponse.json({ error: 'Cadencia nao encontrada' }, { status: 404 })
    }

    // Get execution stats
    const { data: executions } = await supabase
      .from('sdr_cadence_executions')
      .select('status')
      .eq('cadence_id', id)

    const stats = { active: 0, paused: 0, completed: 0, exited: 0 }
    for (const exec of executions || []) {
      const s = exec.status as keyof typeof stats
      if (s in stats) stats[s]++
    }

    return NextResponse.json({ ...data, execution_stats: stats })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/cadences/[id]] GET unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PUT: Update cadence (name, description, steps, is_active, is_default)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceSupabase()
    const body = await request.json()

    const allowedFields = ['name', 'description', 'steps', 'is_active', 'is_default']
    const updateData: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in body) {
        updateData[key] = body[key]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    // Validate steps if provided
    if (updateData.steps) {
      const steps = updateData.steps as { step: number; channel: string; delay_days: number }[]
      for (const step of steps) {
        if (!step.step || !step.channel || step.delay_days === undefined) {
          return NextResponse.json(
            { error: 'Cada step deve ter: step, channel, delay_days' },
            { status: 400 }
          )
        }
      }
    }

    // If setting as default, unset current default
    if (updateData.is_default === true) {
      await supabase
        .from('sdr_cadences')
        .update({ is_default: false })
        .eq('is_default', true)
        .neq('id', id)
    }

    const { data, error } = await supabase
      .from('sdr_cadences')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[api/sdr/cadences/[id]] PUT error:', error.message)
      return NextResponse.json({ error: 'Erro ao atualizar cadencia' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/cadences/[id]] PUT unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE: Soft delete (set is_active = false)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceSupabase()

    const { error } = await supabase
      .from('sdr_cadences')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('[api/sdr/cadences/[id]] DELETE error:', error.message)
      return NextResponse.json({ error: 'Erro ao desativar cadencia' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/cadences/[id]] DELETE unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
