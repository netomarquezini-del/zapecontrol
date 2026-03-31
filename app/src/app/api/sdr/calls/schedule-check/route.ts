import { NextResponse } from 'next/server'
import { isDialingAllowed } from '@/lib/sdr/anatel-schedule'

export const dynamic = 'force-dynamic'

/**
 * GET: Check if dialing is currently allowed per ANATEL schedule.
 * Used by the softphone UI to enable/disable the dial button.
 */
export async function GET() {
  try {
    const result = isDialingAllowed()

    return NextResponse.json({
      allowed: result.allowed,
      reason: result.reason || null,
      nextWindow: result.nextWindow ? result.nextWindow.toISOString() : null,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/calls/schedule-check] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
