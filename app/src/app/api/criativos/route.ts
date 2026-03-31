import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { validateCopyFields } from '@/lib/types-criativos';

export const dynamic = 'force-dynamic';

// GET /api/criativos — list with filters + pagination
export async function GET(req: NextRequest) {
  const sb = getServiceSupabase();
  const params = req.nextUrl.searchParams;

  const status = params.get('status');
  const angulo = params.get('angulo');
  const formato = params.get('formato');
  const persona = params.get('persona');
  const search = params.get('search');
  const sort = params.get('sort') || 'created_at';
  const order = params.get('order') || 'desc';
  const page = parseInt(params.get('page') || '1', 10);
  const limit = Math.min(parseInt(params.get('limit') || '50', 10), 100);
  const offset = (page - 1) * limit;

  let query = sb.from('criativos').select('*', { count: 'exact' });

  if (status) {
    const statuses = status.split(',');
    query = query.in('status', statuses);
  }
  if (angulo) query = query.eq('angulo', angulo);
  if (formato) query = query.eq('formato', formato);
  if (persona) query = query.eq('persona', persona);
  if (search) query = query.or(`nome.ilike.%${search}%,copy_primario.ilike.%${search}%,hook.ilike.%${search}%`);

  query = query.order(sort, { ascending: order === 'asc' }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, total: count, page, limit });
}

// POST /api/criativos — create new criativo
export async function POST(req: NextRequest) {
  const sb = getServiceSupabase();
  const body = await req.json();

  // Required fields
  if (!body.nome || !body.formato) {
    return NextResponse.json({ error: 'nome and formato are required' }, { status: 400 });
  }

  // Validate copy field lengths
  const copyValidation = validateCopyFields(body);
  if (!copyValidation.valid) {
    return NextResponse.json({ error: 'Copy validation failed', details: copyValidation.errors }, { status: 400 });
  }

  const record = {
    nome: body.nome,
    descricao: body.descricao || null,
    status: 'ideia' as const,
    angulo: body.angulo || 'dor',
    formato: body.formato,
    persona: body.persona || 'geral',
    emocao_primaria: body.emocao_primaria || 'frustacao',
    emocao_secundaria: body.emocao_secundaria || null,
    hook: body.hook || null,
    copy_primario: body.copy_primario || null,
    copy_titulo: body.copy_titulo || null,
    copy_descricao: body.copy_descricao || null,
    roteiro: body.roteiro || null,
    agente_produtor: body.agente_produtor || null,
    conceito_id: body.conceito_id || null,
    ruminacao_id: body.ruminacao_id || null,
    formato_id: body.formato_id || null,
    variacao_de: body.variacao_de || null,
    geracao: body.geracao || 1,
    tags: body.tags || [],
    notas: body.notas || null,
    created_by: body.created_by || 'manual',
    updated_by: body.created_by || 'manual',
  };

  const { data, error } = await sb.from('criativos').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log initial status
  await sb.from('historico_status').insert({
    criativo_id: data.id,
    status_anterior: null,
    status_novo: 'ideia',
    motivo: 'Criativo criado',
    executado_por: record.created_by,
  });

  return NextResponse.json({ data }, { status: 201 });
}
