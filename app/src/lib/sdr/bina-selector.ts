import { getServiceSupabase } from '@/lib/supabase'

export interface BinaResult {
  number: string
  numberId: string
  ddd: string
}

/**
 * Select the best number for a lead based on DDD matching + round-robin.
 *
 * Strategy:
 * 1. Find active numbers matching lead's DDD
 * 2. If multiple, pick the one with lowest call_count (round-robin)
 * 3. If no match, fallback to default number (lowest total call_count)
 * 4. Increment call_count on selected number
 */
export async function selectBinaNumber(leadPhone: string): Promise<BinaResult | null> {
  const supabase = getServiceSupabase()
  const ddd = extractDDD(leadPhone)

  // Step 1: Try to find an active number matching the lead's DDD
  let { data: numbers, error } = await supabase
    .from('sdr_numbers')
    .select('id, number, ddd, call_count')
    .eq('status', 'ativo')
    .eq('ddd', ddd)
    .order('call_count', { ascending: true })
    .limit(1)

  if (error) {
    console.error('[bina-selector] Error querying by DDD:', error.message)
    return null
  }

  // Step 3: Fallback — pick any active number with the lowest call_count
  if (!numbers || numbers.length === 0) {
    const fallback = await supabase
      .from('sdr_numbers')
      .select('id, number, ddd, call_count')
      .eq('status', 'ativo')
      .order('call_count', { ascending: true })
      .limit(1)

    if (fallback.error) {
      console.error('[bina-selector] Error querying fallback:', fallback.error.message)
      return null
    }

    numbers = fallback.data
  }

  if (!numbers || numbers.length === 0) {
    console.warn('[bina-selector] No active numbers available in pool')
    return null
  }

  const selected = numbers[0]

  // Step 4: Increment call_count and update last_used_at
  const { error: updateError } = await supabase
    .from('sdr_numbers')
    .update({
      call_count: (selected.call_count ?? 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', selected.id)

  if (updateError) {
    console.error('[bina-selector] Error updating call_count:', updateError.message)
    // Still return the selected number even if update fails
  }

  return {
    number: selected.number,
    numberId: selected.id,
    ddd: selected.ddd,
  }
}

/**
 * Extract DDD from Brazilian phone number.
 * Handles: +5511999999999, 5511999999999, 11999999999, (11)99999-9999
 */
export function extractDDD(phone: string): string {
  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Remove country code 55 if present (phone has 12-13 digits with country code)
  let local: string
  if (digits.length >= 12 && digits.startsWith('55')) {
    local = digits.slice(2)
  } else {
    local = digits
  }

  // DDD is the first 2 digits of the local number
  return local.slice(0, 2)
}
