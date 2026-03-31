import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { executeCadenceBatch } from '@/lib/sdr/cadence-engine'

export const dynamic = 'force-dynamic'

const CRON_SECRET = process.env.CRON_SECRET || ''

/**
 * POST: Trigger cadence execution batch
 * Called by cron or manually from the UI.
 * Optional: X-Cron-Secret header for cron authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // Check cron secret if configured
    if (CRON_SECRET) {
      const cronHeader = request.headers.get('x-cron-secret')
      const authHeader = request.headers.get('authorization')
      const isManual = request.headers.get('x-manual-trigger') === 'true'
      const isVercelCron = authHeader === `Bearer ${CRON_SECRET}`

      if (!isManual && !isVercelCron && cronHeader !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const result = await executeCadenceBatch()

    return NextResponse.json({
      success: true,
      ...result,
      executed_at: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/cadences/execute] POST unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
