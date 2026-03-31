/**
 * Cadence execution engine
 * Processes sdr_cadence_executions where next_action_at <= now() and status = 'active'
 * Respects ANATEL schedule
 */

import { getServiceSupabase } from '@/lib/supabase'
import { isDialingAllowed } from '@/lib/sdr/anatel-schedule'
import { sendWhatsAppTemplate } from '@/lib/sdr/whatsapp-client'
import { sendInstagramMessage } from '@/lib/sdr/instagram-client'
import type {
  SdrCadence,
  SdrCadenceStep,
  SdrCadenceExecution,
} from '@/lib/types-sdr'

const BATCH_LIMIT = 100

interface BatchResult {
  processed: number
  skipped: number
  errors: number
  details: { executionId: string; action: string; error?: string }[]
}

/**
 * Execute a batch of cadence actions that are due.
 * Called by cron or manually via the execute API route.
 */
export async function executeCadenceBatch(): Promise<BatchResult> {
  const result: BatchResult = { processed: 0, skipped: 0, errors: 0, details: [] }
  const supabase = getServiceSupabase()

  // 1. Check ANATEL schedule for phone calls
  const schedule = isDialingAllowed()
  const phoneAllowed = schedule.allowed

  // 2. Query executions that are due
  const { data: executions, error: fetchError } = await supabase
    .from('sdr_cadence_executions')
    .select('*')
    .eq('status', 'active')
    .lte('next_action_at', new Date().toISOString())
    .order('next_action_at', { ascending: true })
    .limit(BATCH_LIMIT)

  if (fetchError) {
    console.error('[cadence-engine] Error fetching executions:', fetchError.message)
    return { ...result, errors: 1, details: [{ executionId: 'query', action: 'fetch', error: fetchError.message }] }
  }

  if (!executions || executions.length === 0) {
    return result
  }

  // 3. Load all cadences referenced by these executions
  const cadenceIds = [...new Set(executions.map((e: SdrCadenceExecution) => e.cadence_id))]
  const { data: cadences, error: cadenceError } = await supabase
    .from('sdr_cadences')
    .select('*')
    .in('id', cadenceIds)
    .eq('is_active', true)

  if (cadenceError) {
    console.error('[cadence-engine] Error fetching cadences:', cadenceError.message)
    return { ...result, errors: 1, details: [{ executionId: 'query', action: 'fetch-cadences', error: cadenceError.message }] }
  }

  const cadenceMap = new Map<string, SdrCadence>()
  for (const c of cadences || []) {
    cadenceMap.set(c.id, c as SdrCadence)
  }

  // 4. Process each execution
  for (const exec of executions as SdrCadenceExecution[]) {
    const cadence = cadenceMap.get(exec.cadence_id)

    if (!cadence) {
      // Cadence was deactivated or deleted - exit the execution
      await supabase
        .from('sdr_cadence_executions')
        .update({
          status: 'exited',
          exit_reason: 'Cadencia desativada ou removida',
          exited_at: new Date().toISOString(),
        })
        .eq('id', exec.id)

      result.skipped++
      result.details.push({ executionId: exec.id, action: 'exited-no-cadence' })
      continue
    }

    const steps = (cadence.steps || []) as SdrCadenceStep[]
    const currentStep = steps.find((s) => s.step === exec.current_step)

    if (!currentStep) {
      // No more steps - mark as completed
      await supabase
        .from('sdr_cadence_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          next_action_at: null,
        })
        .eq('id', exec.id)

      result.processed++
      result.details.push({ executionId: exec.id, action: 'completed' })
      continue
    }

    try {
      // Execute step based on channel
      if (currentStep.channel === 'phone') {
        if (!phoneAllowed) {
          result.skipped++
          result.details.push({
            executionId: exec.id,
            action: 'skipped-anatel',
            error: schedule.reason,
          })
          continue
        }

        // Add to dial queue by inserting into sdr_dial_queue
        await addToDialQueue(exec.lead_id, exec.id, exec.cadence_id, currentStep.step)
        result.details.push({ executionId: exec.id, action: 'queued-phone' })
      } else if (currentStep.channel === 'whatsapp') {
        await executeMessageStep(exec, currentStep, 'whatsapp')
        result.details.push({ executionId: exec.id, action: 'sent-whatsapp' })
      } else if (currentStep.channel === 'instagram') {
        await executeMessageStep(exec, currentStep, 'instagram')
        result.details.push({ executionId: exec.id, action: 'sent-instagram' })
      }

      // Advance to next step
      const nextStepNumber = exec.current_step + 1
      const nextStep = steps.find((s) => s.step === nextStepNumber)

      if (nextStep) {
        const nextActionAt = new Date()
        nextActionAt.setDate(nextActionAt.getDate() + nextStep.delay_days)

        await supabase
          .from('sdr_cadence_executions')
          .update({
            current_step: nextStepNumber,
            next_action_at: nextActionAt.toISOString(),
          })
          .eq('id', exec.id)
      } else {
        // No more steps - mark as completed
        await supabase
          .from('sdr_cadence_executions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            next_action_at: null,
          })
          .eq('id', exec.id)
      }

      result.processed++
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[cadence-engine] Error processing execution ${exec.id}:`, errMsg)
      result.errors++
      result.details.push({ executionId: exec.id, action: 'error', error: errMsg })
    }
  }

  return result
}

/**
 * Execute a WhatsApp or Instagram message step.
 */
async function executeMessageStep(
  exec: SdrCadenceExecution,
  step: SdrCadenceStep,
  channel: 'whatsapp' | 'instagram'
): Promise<void> {
  const supabase = getServiceSupabase()

  // Get lead info
  const { data: lead, error: leadError } = await supabase
    .from('sdr_leads')
    .select('id, nome, telefone, email, empresa')
    .eq('id', exec.lead_id)
    .single()

  if (leadError || !lead) {
    throw new Error(`Lead nao encontrado: ${exec.lead_id}`)
  }

  // Get template content if template_id is set
  let content = ''
  if (step.template_id) {
    const { data: template } = await supabase
      .from('sdr_message_templates')
      .select('content, variables')
      .eq('id', step.template_id)
      .single()

    if (template) {
      content = template.content
      // Replace variables in template
      content = content.replace(/\{\{nome\}\}/gi, lead.nome || '')
      content = content.replace(/\{\{empresa\}\}/gi, lead.empresa || '')
      content = content.replace(/\{\{telefone\}\}/gi, lead.telefone || '')
      content = content.replace(/\{\{email\}\}/gi, lead.email || '')
    }
  }

  if (!content) {
    console.warn(`[cadence-engine] No template content for step ${step.step}, skipping message`)
    return
  }

  // Send message
  if (channel === 'whatsapp') {
    const result = await sendWhatsAppTemplate(lead.telefone, content)
    if (!result.success) {
      throw new Error(`WhatsApp send failed: ${result.error}`)
    }

    // Log the message
    await supabase.from('sdr_messages').insert({
      lead_id: lead.id,
      sdr_user_id: 'system',
      channel: 'whatsapp',
      direction: 'outbound',
      status: 'sent',
      content,
      template_id: step.template_id,
      external_message_id: result.externalMessageId || null,
      sent_at: new Date().toISOString(),
    })
  } else if (channel === 'instagram') {
    // Instagram needs IGSID, stored in custom_fields
    const { data: fullLead } = await supabase
      .from('sdr_leads')
      .select('custom_fields')
      .eq('id', lead.id)
      .single()

    const igsid = (fullLead?.custom_fields as Record<string, string>)?.instagram_id
    if (!igsid) {
      console.warn(`[cadence-engine] No Instagram ID for lead ${lead.id}, skipping`)
      return
    }

    const result = await sendInstagramMessage(igsid, content)
    if (!result.success) {
      throw new Error(`Instagram send failed: ${result.error}`)
    }

    await supabase.from('sdr_messages').insert({
      lead_id: lead.id,
      sdr_user_id: 'system',
      channel: 'instagram',
      direction: 'outbound',
      status: 'sent',
      content,
      template_id: step.template_id,
      external_message_id: result.externalMessageId || null,
      sent_at: new Date().toISOString(),
    })
  }

  // Log interaction
  await supabase.from('sdr_interactions').insert({
    lead_id: lead.id,
    sdr_user_id: 'system',
    type: 'message',
    summary: `Mensagem automatica (${channel}) - Cadencia step ${step.step}`,
    metadata: {
      cadence_id: exec.cadence_id,
      execution_id: exec.id,
      step: step.step,
      channel,
    },
  })

  // Update lead last_contact_at
  await supabase
    .from('sdr_leads')
    .update({
      last_contact_at: new Date().toISOString(),
    })
    .eq('id', lead.id)
}

/**
 * Add a lead to the dial queue (conceptual table or flag).
 * We store in sdr_interactions as a marker that can be queried.
 */
async function addToDialQueue(
  leadId: string,
  executionId: string,
  cadenceId: string,
  step: number
): Promise<void> {
  const supabase = getServiceSupabase()

  // We use sdr_interactions with type='schedule' and specific metadata
  // to represent dial queue entries. The queue route will query these.
  await supabase.from('sdr_interactions').insert({
    lead_id: leadId,
    sdr_user_id: 'system',
    type: 'schedule',
    summary: `Cadencia: ligacao agendada (step ${step})`,
    metadata: {
      type: 'dial_queue',
      cadence_id: cadenceId,
      execution_id: executionId,
      step,
      queued_at: new Date().toISOString(),
      status: 'pending',
    },
  })
}

/**
 * Enroll a lead in a cadence.
 * If no cadenceId provided, uses the default cadence (is_default = true).
 */
export async function enrollLeadInCadence(
  leadId: string,
  cadenceId?: string
): Promise<{ success: boolean; executionId?: string; error?: string }> {
  const supabase = getServiceSupabase()

  let targetCadenceId = cadenceId

  if (!targetCadenceId) {
    // Find default cadence
    const { data: defaultCadence } = await supabase
      .from('sdr_cadences')
      .select('id')
      .eq('is_active', true)
      .eq('is_default', true)
      .limit(1)
      .single()

    if (!defaultCadence) {
      return { success: false, error: 'Nenhuma cadencia padrao encontrada' }
    }
    targetCadenceId = defaultCadence.id
  }

  // Check if lead already has an active execution for this cadence
  const { data: existing } = await supabase
    .from('sdr_cadence_executions')
    .select('id')
    .eq('lead_id', leadId)
    .eq('cadence_id', targetCadenceId)
    .eq('status', 'active')
    .limit(1)

  if (existing && existing.length > 0) {
    return { success: false, error: 'Lead ja esta ativo nesta cadencia' }
  }

  // Create execution record
  const now = new Date().toISOString()
  const { data: execution, error } = await supabase
    .from('sdr_cadence_executions')
    .insert({
      lead_id: leadId,
      cadence_id: targetCadenceId,
      current_step: 1,
      status: 'active',
      started_at: now,
      next_action_at: now, // Immediate first action
    })
    .select('id')
    .single()

  if (error) {
    console.error('[cadence-engine] Error enrolling lead:', error.message)
    return { success: false, error: error.message }
  }

  // Update lead's cadence_id
  await supabase
    .from('sdr_leads')
    .update({ cadence_id: targetCadenceId })
    .eq('id', leadId)

  return { success: true, executionId: execution?.id }
}

/**
 * Exit a lead from all active cadence executions.
 */
export async function exitLeadFromCadence(
  leadId: string,
  reason: string
): Promise<void> {
  const supabase = getServiceSupabase()
  const now = new Date().toISOString()

  await supabase
    .from('sdr_cadence_executions')
    .update({
      status: 'exited',
      exited_at: now,
      exit_reason: reason,
      next_action_at: null,
    })
    .eq('lead_id', leadId)
    .eq('status', 'active')

  // Clear cadence_id on lead
  await supabase
    .from('sdr_leads')
    .update({ cadence_id: null })
    .eq('id', leadId)
}

/**
 * Get the current dial queue - leads with pending phone calls from cadence.
 */
export async function getDialQueue(): Promise<
  { lead_id: string; phone: string; lead_name: string; execution_id: string; cadence_name: string; step: number; queued_at: string }[]
> {
  const supabase = getServiceSupabase()

  // Get pending dial queue entries
  const { data: interactions, error } = await supabase
    .from('sdr_interactions')
    .select('lead_id, metadata')
    .eq('type', 'schedule')
    .order('created_at', { ascending: true })

  if (error || !interactions) {
    console.error('[cadence-engine] Error fetching dial queue:', error?.message)
    return []
  }

  // Filter for dial_queue entries that are still pending
  const queueEntries = interactions.filter(
    (i) => (i.metadata as Record<string, unknown>)?.type === 'dial_queue' &&
           (i.metadata as Record<string, unknown>)?.status === 'pending'
  )

  if (queueEntries.length === 0) return []

  // Get lead info
  const leadIds = [...new Set(queueEntries.map((q) => q.lead_id))]
  const { data: leads } = await supabase
    .from('sdr_leads')
    .select('id, nome, telefone')
    .in('id', leadIds)

  const leadMap = new Map<string, { nome: string; telefone: string }>()
  for (const l of leads || []) {
    leadMap.set(l.id, { nome: l.nome, telefone: l.telefone })
  }

  // Get cadence names
  const cadenceIds = [...new Set(
    queueEntries.map((q) => (q.metadata as Record<string, string>)?.cadence_id).filter(Boolean)
  )]
  const { data: cadences } = await supabase
    .from('sdr_cadences')
    .select('id, name')
    .in('id', cadenceIds)

  const cadenceNameMap = new Map<string, string>()
  for (const c of cadences || []) {
    cadenceNameMap.set(c.id, c.name)
  }

  return queueEntries.map((q) => {
    const meta = q.metadata as Record<string, string>
    const lead = leadMap.get(q.lead_id)
    return {
      lead_id: q.lead_id,
      phone: lead?.telefone || '',
      lead_name: lead?.nome || '',
      execution_id: meta?.execution_id || '',
      cadence_name: cadenceNameMap.get(meta?.cadence_id || '') || '',
      step: parseInt(meta?.step || '0', 10),
      queued_at: meta?.queued_at || '',
    }
  })
}
