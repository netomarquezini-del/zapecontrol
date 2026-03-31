import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { ALL_FORMATOS, type CreativeFormato, type CreativeAngulo } from '@/lib/types-criativos';

export const dynamic = 'force-dynamic';

const ANGULO_ADJACENCY: Record<string, string[]> = {
  dor: ['contraste', 'identificacao'],
  desejo: ['curiosidade', 'contraste'],
  prova_social: ['autoridade', 'contraste'],
  autoridade: ['prova_social', 'educativo'],
  urgencia: ['dor', 'desejo'],
  curiosidade: ['educativo', 'controverso'],
  contraste: ['dor', 'desejo'],
  identificacao: ['dor', 'desejo'],
  educativo: ['autoridade', 'curiosidade'],
  controverso: ['curiosidade', 'dor'],
};

// POST /api/sugestoes/generate — generate variation suggestions for a winner
export async function POST(req: NextRequest) {
  const sb = getServiceSupabase();
  const body = await req.json();
  const { criativo_id } = body;

  if (!criativo_id) {
    return NextResponse.json({ error: 'criativo_id is required' }, { status: 400 });
  }

  // Get winner criativo
  const { data: winner, error } = await sb
    .from('criativos')
    .select('*')
    .eq('id', criativo_id)
    .single();

  if (error || !winner) {
    return NextResponse.json({ error: 'Criativo not found' }, { status: 404 });
  }

  // Get existing criativos for this conceito+angulo to find format gaps
  const { data: existing } = await sb
    .from('criativos')
    .select('formato')
    .eq('angulo', winner.angulo)
    .eq('conceito_id', winner.conceito_id)
    .not('status', 'eq', 'morto');

  const existingFormatos = new Set((existing || []).map((c) => c.formato));

  const suggestions: Array<{
    tipo: string;
    descricao: string;
    angulo_sugerido?: CreativeAngulo;
    formato_sugerido?: CreativeFormato;
    persona_sugerida?: string;
    emocao_sugerida?: string;
    hook_sugerido?: string;
    copy_sugerido?: string;
    motivo: string;
    confianca: number;
    impacto_estimado: number;
  }> = [];

  // 1. NOVO_FORMATO — suggest missing formats
  const missingFormatos = ALL_FORMATOS.filter((f) => !existingFormatos.has(f));
  const formatSuggestions = missingFormatos.slice(0, 3);
  for (const fmt of formatSuggestions) {
    const isVideo = fmt.startsWith('video_') || fmt.startsWith('story_') || fmt.startsWith('reel_');
    suggestions.push({
      tipo: 'novo_formato',
      descricao: `Adaptar winner "${winner.nome}" para formato ${fmt}`,
      formato_sugerido: fmt,
      copy_sugerido: winner.copy_primario || undefined,
      motivo: `Gap na matriz: formato ${fmt} nao existe para angulo ${winner.angulo}`,
      confianca: 7,
      impacto_estimado: isVideo ? 7 : 6,
    });
  }

  // 2. NOVO_HOOK — same creative, different hook
  const { data: hooks } = await sb
    .from('ruminacoes')
    .select('*')
    .eq('angulo', winner.angulo)
    .eq('ativo', true)
    .order('impacto_estimado', { ascending: false })
    .limit(3);

  if (hooks && hooks.length > 0) {
    const bestHook = hooks[0];
    suggestions.push({
      tipo: 'novo_hook',
      descricao: `Trocar hook do winner por: "${bestHook.texto.substring(0, 60)}..."`,
      hook_sugerido: bestHook.texto,
      motivo: `Ruminacao com impacto estimado ${bestHook.impacto_estimado}`,
      confianca: 6,
      impacto_estimado: bestHook.impacto_estimado,
    });
  }

  // 3. NOVO_ANGULO — try adjacent angle
  const adjacentAngulos = ANGULO_ADJACENCY[winner.angulo] || [];
  if (adjacentAngulos.length > 0) {
    suggestions.push({
      tipo: 'novo_angulo',
      descricao: `Recriar winner com angulo ${adjacentAngulos[0]}`,
      angulo_sugerido: adjacentAngulos[0] as CreativeAngulo,
      copy_sugerido: winner.copy_primario || undefined,
      motivo: `Angulo adjacente a ${winner.angulo} com potencial de replicar resultado`,
      confianca: 5,
      impacto_estimado: 6,
    });
  }

  // 4. NOVA_PERSONA — if winner is 'geral', suggest specific personas
  if (winner.persona === 'geral') {
    for (const p of ['seller_iniciante', 'seller_frustrado'] as const) {
      suggestions.push({
        tipo: 'nova_persona',
        descricao: `Especializar winner para persona ${p}`,
        persona_sugerida: p,
        motivo: `Winner com persona geral pode performar melhor com targeting especifico`,
        confianca: 5,
        impacto_estimado: 5,
      });
    }
  }

  // Insert all suggestions
  if (suggestions.length === 0) {
    return NextResponse.json({ data: [], message: 'No suggestions generated' });
  }

  const records = suggestions.map((s) => ({
    criativo_origem_id: criativo_id,
    tipo: s.tipo,
    descricao: s.descricao,
    angulo_sugerido: s.angulo_sugerido || null,
    formato_sugerido: s.formato_sugerido || null,
    persona_sugerida: s.persona_sugerida || null,
    emocao_sugerida: s.emocao_sugerida || null,
    hook_sugerido: s.hook_sugerido || null,
    copy_sugerido: s.copy_sugerido || null,
    motivo: s.motivo,
    confianca: s.confianca,
    impacto_estimado: s.impacto_estimado,
    status: 'pendente',
  }));

  const { data: inserted, error: insertError } = await sb
    .from('sugestoes_variacoes')
    .insert(records)
    .select();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ data: inserted, count: inserted?.length || 0 });
}

// GET /api/sugestoes — list suggestions
export async function GET(req: NextRequest) {
  const sb = getServiceSupabase();
  const params = req.nextUrl.searchParams;
  const status = params.get('status');
  const origem = params.get('criativo_origem_id');

  let query = sb.from('sugestoes_variacoes').select('*');

  if (status) query = query.eq('status', status);
  if (origem) query = query.eq('criativo_origem_id', origem);

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
