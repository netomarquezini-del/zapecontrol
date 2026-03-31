import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/matriz — coverage matrix data
export async function GET() {
  const sb = getServiceSupabase();

  const { data, error } = await sb
    .from('matriz_cobertura')
    .select('*');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data || [] });
}
