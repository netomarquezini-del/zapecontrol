import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/ruminacoes — list with filters
export async function GET(req: NextRequest) {
  const sb = getServiceSupabase();
  const params = req.nextUrl.searchParams;

  const trigger = params.get('trigger');
  const emocao = params.get('emocao');
  const angulo = params.get('angulo');
  const persona = params.get('persona');
  const conceito_id = params.get('conceito_id');

  let query = sb.from('ruminacoes').select('*');

  if (trigger) query = query.eq('trigger', trigger);
  if (emocao) query = query.eq('emocao', emocao);
  if (angulo) query = query.eq('angulo', angulo);
  if (persona) query = query.eq('persona', persona);
  if (conceito_id) query = query.eq('conceito_id', conceito_id);

  query = query.eq('ativo', true).order('impacto_estimado', { ascending: false });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

// POST /api/ruminacoes — create new ruminacao
export async function POST(req: NextRequest) {
  const sb = getServiceSupabase();
  const body = await req.json();

  if (!body.texto || !body.trigger || !body.emocao) {
    return NextResponse.json({ error: 'texto, trigger, and emocao are required' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('ruminacoes')
    .insert({
      texto: body.texto,
      texto_variantes: body.texto_variantes || [],
      trigger: body.trigger,
      emocao: body.emocao,
      angulo: body.angulo || null,
      persona: body.persona || null,
      impacto_estimado: body.impacto_estimado || 5,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
