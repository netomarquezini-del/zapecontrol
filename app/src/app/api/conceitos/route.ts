import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/conceitos — list with filters, sorted by ICE
export async function GET(req: NextRequest) {
  const sb = getServiceSupabase();
  const params = req.nextUrl.searchParams;

  const tipo = params.get('tipo');
  const angulo = params.get('angulo');
  const persona = params.get('persona');
  const emocao = params.get('emocao');
  const ativo = params.get('ativo');

  let query = sb.from('conceitos').select('*');

  if (tipo) query = query.eq('tipo', tipo);
  if (angulo) query = query.eq('angulo', angulo);
  if (persona) query = query.eq('persona', persona);
  if (emocao) query = query.eq('emocao', emocao);
  if (ativo !== null && ativo !== undefined) query = query.eq('ativo', ativo === 'true');

  query = query.order('ice_score', { ascending: false });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

// POST /api/conceitos — create new conceito
export async function POST(req: NextRequest) {
  const sb = getServiceSupabase();
  const body = await req.json();

  if (!body.nome || !body.descricao) {
    return NextResponse.json({ error: 'nome and descricao are required' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('conceitos')
    .insert({
      nome: body.nome,
      descricao: body.descricao,
      tipo: body.tipo || 'angulo',
      angulo: body.angulo || null,
      persona: body.persona || null,
      emocao: body.emocao || null,
      ice_impacto: body.ice_impacto || 5,
      ice_confianca: body.ice_confianca || 5,
      ice_facilidade: body.ice_facilidade || 5,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
