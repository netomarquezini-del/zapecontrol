import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { processFollowups } from '@/lib/sdr/schedule-followup'

export const dynamic = 'force-dynamic'

const CRON_SECRET = process.env.CRON_SECRET || ''

/**
 * POST: Trigger follow-up processing (called by cron)
 * Accepts optional x-cron-secret header for security
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret if configured
    if (CRON_SECRET) {
      const secret = request.headers.get('x-cron-secret')
      const authHeader = request.headers.get('authorization')
      const isVercelCron = authHeader === `Bearer ${CRON_SECRET}`
      if (!isVercelCron && secret !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const stats = await processFollowups()

    console.log('[api/sdr/schedules/followup] Processed:', stats)

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[api/sdr/schedules/followup] POST unexpected:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
