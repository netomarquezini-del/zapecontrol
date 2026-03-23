import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    service: 'joana-cs-monitor',
    version: 'v1',
    config: {
      zapiConfigured: !!process.env.JOANA_ZAPI_BASE_URL,
      supabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    }
  })
}
