import { NextResponse } from 'next/server'
import { getDialQueue } from '@/lib/sdr/cadence-engine'

export const dynamic = 'force-dynamic'

/**
 * GET: Get current dial queue (leads ready for phone call)
 * Returns leads with phone numbers, ordered by queued time.
 */
export async function GET() {
  try {
    const queue = await getDialQueue()

    return NextResponse.json({
      data: queue,
      total: queue.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/cadences/queue] GET unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
