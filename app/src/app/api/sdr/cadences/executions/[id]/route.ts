import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * PATCH: Update execution (pause, resume, skip)
 * Body: { action: 'pause' | 'resume' | 'skip' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServiceSupabase()
    const body = await request.json()
    const { action } = body as { action: 'pause' | 'resume' | 'skip' }

    if (!action || !['pause', 'resume', 'skip'].includes(action)) {
      return NextResponse.json(
        { error: 'action deve ser pause, resume ou skip' },
        { status: 400 }
      )
    }

    // Get current execution
    const { data: execution, error: fetchError } = await supabase
      .from('sdr_cadence_executions')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !execution) {
      return NextResponse.json({ error: 'Execucao nao encontrada' }, { status: 404 })
    }

    const now = new Date().toISOString()
    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'pause':
        if (execution.status !== 'active') {
          return NextResponse.json(
            { error: 'Somente execucoes ativas podem ser pausadas' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'paused',
          paused_at: now,
        }
        break

      case 'resume':
        if (execution.status !== 'paused') {
          return NextResponse.json(
            { error: 'Somente execucoes pausadas podem ser retomadas' },
            { status: 400 }
          )
        }
        // Recalculate next_action_at: set to now for immediate processing
        updateData = {
          status: 'active',
          paused_at: null,
          next_action_at: now,
        }
        break

      case 'skip': {
        if (execution.status !== 'active' && execution.status !== 'paused') {
          return NextResponse.json(
            { error: 'Somente execucoes ativas ou pausadas podem pular step' },
            { status: 400 }
          )
        }

        // Get cadence to find next step
        const { data: cadence } = await supabase
          .from('sdr_cadences')
          .select('steps')
          .eq('id', execution.cadence_id)
          .single()

        const steps = (cadence?.steps || []) as { step: number; delay_days: number }[]
        const nextStepNumber = execution.current_step + 1
        const nextStep = steps.find((s) => s.step === nextStepNumber)

        if (nextStep) {
          const nextActionAt = new Date()
          nextActionAt.setDate(nextActionAt.getDate() + nextStep.delay_days)
          updateData = {
            status: 'active',
            paused_at: null,
            current_step: nextStepNumber,
            next_action_at: nextActionAt.toISOString(),
          }
        } else {
          // No more steps - complete
          updateData = {
            status: 'completed',
            completed_at: now,
            next_action_at: null,
          }
        }
        break
      }
    }

    const { data, error } = await supabase
      .from('sdr_cadence_executions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[api/sdr/cadences/executions/[id]] PATCH error:', error.message)
      return NextResponse.json({ error: 'Erro ao atualizar execucao' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/cadences/executions/[id]] PATCH unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
