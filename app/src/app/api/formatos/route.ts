import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/formatos — list all 16 formats
export async function GET(req: NextRequest) {
  const sb = getServiceSupabase();
  const params = req.nextUrl.searchParams;

  const tipo = params.get('tipo'); // 'video' | 'estatico'

  let query = sb.from('formatos').select('*');

  if (tipo) query = query.eq('tipo', tipo);

  query = query.order('nome', { ascending: true });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
