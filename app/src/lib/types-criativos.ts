// ============================================================
// Type definitions for Creative Management Panel
// ============================================================

export type CreativeStatus =
  | 'ideia'
  | 'em_producao'
  | 'revisao'
  | 'aprovado'
  | 'pronto'
  | 'em_teste'
  | 'winner'
  | 'escala'
  | 'saturado'
  | 'pausado'
  | 'morto';

export type CreativeAngulo =
  | 'dor'
  | 'desejo'
  | 'prova_social'
  | 'autoridade'
  | 'urgencia'
  | 'curiosidade'
  | 'contraste'
  | 'identificacao'
  | 'educativo'
  | 'controverso';

export type CreativeFormato =
  | 'video_talking_head'
  | 'video_motion_graphics'
  | 'video_depoimento'
  | 'video_screen_recording'
  | 'video_misto'
  | 'video_caixinha_pergunta'
  | 'estatico_single'
  | 'estatico_carrossel'
  | 'estatico_antes_depois'
  | 'estatico_lista'
  | 'estatico_prova_social'
  | 'estatico_quote'
  | 'estatico_comparacao'
  | 'estatico_numero'
  | 'estatico_headline_bold'
  | 'story_vertical'
  | 'reel_vertical';

export type CreativePersona =
  | 'seller_iniciante'
  | 'seller_intermediario'
  | 'seller_avancado'
  | 'seller_frustrado'
  | 'seller_curioso'
  | 'geral';

export type CreativeEmocao =
  | 'medo'
  | 'frustacao'
  | 'esperanca'
  | 'ambicao'
  | 'inveja'
  | 'confianca'
  | 'curiosidade'
  | 'raiva'
  | 'alivio'
  | 'empolgacao';

export type TriggerType =
  | 'gancho_numerico'
  | 'pergunta'
  | 'afirmacao_choque'
  | 'historia'
  | 'contraste'
  | 'desafio'
  | 'segredo'
  | 'comando'
  | 'lista'
  | 'revelacao';

export type ConceitoTipo =
  | 'hook'
  | 'angulo'
  | 'mecanismo'
  | 'prova'
  | 'oferta'
  | 'cta'
  | 'formato_idea';

export interface Criativo {
  id: string;
  nome: string;
  descricao: string | null;
  status: CreativeStatus;
  angulo: CreativeAngulo;
  formato: CreativeFormato;
  persona: CreativePersona;
  emocao_primaria: CreativeEmocao;
  emocao_secundaria: CreativeEmocao | null;
  hook: string | null;
  copy_primario: string | null;
  copy_titulo: string | null;
  copy_descricao: string | null;
  roteiro: string | null;
  agente_produtor: string | null;
  conceito_id: string | null;
  ruminacao_id: string | null;
  formato_id: string | null;
  variacao_de: string | null;
  geracao: number;
  arquivo_principal: string | null;
  arquivo_thumbnail: string | null;
  arquivo_preview: string | null;
  carousel_items: string[]; // ordered array of public URLs for carousel
  mime_type: string | null;
  duracao_segundos: number | null;
  resolucao: string | null;
  tamanho_bytes: number | null;
  meta_ad_id: string | null;
  meta_adset_id: string | null;
  meta_campaign_id: string | null;
  meta_creative_id: string | null;
  meta_media_id: string | null;
  meta_upload_at: string | null;
  meta_url: string | null;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_purchases: number;
  total_revenue: number;
  cpa_atual: number | null;
  roas_atual: number | null;
  ctr_atual: number | null;
  frequency_atual: number | null;
  dias_ativo: number;
  is_winner: boolean;
  winner_at: string | null;
  dias_consecutivos_bom: number;
  tags: string[];
  notas: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface Conceito {
  id: string;
  nome: string;
  descricao: string;
  tipo: ConceitoTipo;
  angulo: CreativeAngulo | null;
  persona: CreativePersona | null;
  emocao: CreativeEmocao | null;
  ice_impacto: number;
  ice_confianca: number;
  ice_facilidade: number;
  ice_score: number;
  vezes_usado: number;
  melhor_roas: number | null;
  pior_roas: number | null;
  media_roas: number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ruminacao {
  id: string;
  texto: string;
  texto_variantes: string[];
  trigger: TriggerType;
  emocao: CreativeEmocao;
  angulo: CreativeAngulo | null;
  persona: CreativePersona | null;
  impacto_estimado: number;
  vezes_usado: number;
  melhor_ctr: number | null;
  media_ctr: number | null;
  melhor_hook_rate: number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Formato {
  id: string;
  nome: string;
  formato: CreativeFormato;
  tipo: 'video' | 'estatico';
  largura: number;
  altura: number;
  aspect_ratio: string;
  duracao_min: number | null;
  duracao_max: number | null;
  tamanho_max_mb: number;
  agente_recomendado: string | null;
  template_remotion: string | null;
  diretrizes: string | null;
  media_ctr: number | null;
  media_roas: number | null;
  total_criativos: number;
  total_winners: number;
  created_at: string;
  updated_at: string;
}

export interface MetricaCriativo {
  id: string;
  criativo_id: string;
  meta_ad_id: string;
  date: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  purchases: number;
  revenue: number;
  cost_per_purchase: number;
  roas: number;
  hook_rate: number;
  hold_rate: number;
  synced_at: string;
}

export interface SugestaoVariacao {
  id: string;
  criativo_origem_id: string;
  tipo: string;
  descricao: string;
  angulo_sugerido: CreativeAngulo | null;
  formato_sugerido: CreativeFormato | null;
  persona_sugerida: CreativePersona | null;
  emocao_sugerida: CreativeEmocao | null;
  hook_sugerido: string | null;
  copy_sugerido: string | null;
  motivo: string;
  confianca: number;
  impacto_estimado: number;
  status: 'pendente' | 'aceita' | 'rejeitada' | 'produzida';
  criativo_gerado_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface HistoricoStatus {
  id: string;
  criativo_id: string;
  status_anterior: CreativeStatus | null;
  status_novo: CreativeStatus;
  motivo: string | null;
  detalhes: Record<string, unknown>;
  executado_por: string;
  created_at: string;
}

export interface MatrizCobertura {
  angulo: CreativeAngulo;
  formato: CreativeFormato;
  persona: CreativePersona;
  total_criativos: number;
  total_em_teste: number;
  total_winners: number;
  total_mortos: number;
  media_roas: number | null;
  melhor_roas: number | null;
  ultima_atualizacao: string;
}

// ── Status transition adjacency list ─────────────────────────

export const STATUS_TRANSITIONS: Record<CreativeStatus, CreativeStatus[]> = {
  ideia: ['em_producao'],
  em_producao: ['revisao', 'ideia'],
  revisao: ['aprovado', 'em_producao'],
  aprovado: ['pronto', 'revisao'],
  pronto: ['em_teste'],
  em_teste: ['winner', 'saturado', 'pausado', 'morto'],
  winner: ['escala', 'saturado', 'pausado'],
  escala: ['saturado', 'pausado', 'morto'],
  saturado: ['morto', 'pausado'],
  pausado: ['morto', 'em_teste'],
  morto: [],
};

export const STATUS_LABELS: Record<CreativeStatus, string> = {
  ideia: 'Ideia',
  em_producao: 'Producao',
  revisao: 'Revisao',
  aprovado: 'Aprovado',
  pronto: 'Pronto',
  em_teste: 'Ao Vivo',
  winner: 'Winner',
  escala: 'Escala',
  saturado: 'Saturado',
  pausado: 'Pausado',
  morto: 'Morto',
};

export const STATUS_COLORS: Record<CreativeStatus, string> = {
  ideia: '#6B7280',
  em_producao: '#3B82F6',
  revisao: '#F59E0B',
  aprovado: '#10B981',
  pronto: '#8B5CF6',
  em_teste: '#A3E635',
  winner: '#F59E0B',
  escala: '#EC4899',
  saturado: '#EF4444',
  pausado: '#9CA3AF',
  morto: '#374151',
};

export const ANGULO_LABELS: Record<CreativeAngulo, string> = {
  dor: 'Dor',
  desejo: 'Desejo',
  prova_social: 'Prova Social',
  autoridade: 'Autoridade',
  urgencia: 'Urgencia',
  curiosidade: 'Curiosidade',
  contraste: 'Contraste',
  identificacao: 'Identificacao',
  educativo: 'Educativo',
  controverso: 'Controverso',
};

export const ANGULO_COLORS: Record<CreativeAngulo, string> = {
  dor: '#EF4444',
  desejo: '#A3E635',
  prova_social: '#3B82F6',
  autoridade: '#8B5CF6',
  urgencia: '#F59E0B',
  curiosidade: '#06B6D4',
  contraste: '#EC4899',
  identificacao: '#14B8A6',
  educativo: '#6366F1',
  controverso: '#F97316',
};

export const FORMATO_LABELS: Record<CreativeFormato, string> = {
  video_talking_head: 'Talking Head',
  video_motion_graphics: 'Motion Graphics',
  video_depoimento: 'Depoimento',
  video_screen_recording: 'Screen Recording',
  video_misto: 'Video Misto',
  video_caixinha_pergunta: 'Caixinha Pergunta',
  estatico_single: 'Single',
  estatico_carrossel: 'Carrossel',
  estatico_antes_depois: 'Antes/Depois',
  estatico_lista: 'Lista',
  estatico_prova_social: 'Prova Social',
  estatico_quote: 'Quote',
  estatico_comparacao: 'Comparacao',
  estatico_numero: 'Numero',
  estatico_headline_bold: 'Headline Bold',
  story_vertical: 'Story',
  reel_vertical: 'Reel',
};

export const PERSONA_LABELS: Record<CreativePersona, string> = {
  seller_iniciante: 'Iniciante',
  seller_intermediario: 'Intermediario',
  seller_avancado: 'Avancado',
  seller_frustrado: 'Frustrado',
  seller_curioso: 'Curioso',
  geral: 'Geral',
};

export const EMOCAO_LABELS: Record<CreativeEmocao, string> = {
  medo: 'Medo',
  frustacao: 'Frustacao',
  esperanca: 'Esperanca',
  ambicao: 'Ambicao',
  inveja: 'Inveja',
  confianca: 'Confianca',
  curiosidade: 'Curiosidade',
  raiva: 'Raiva',
  alivio: 'Alivio',
  empolgacao: 'Empolgacao',
};

// ── AI Generation types ─────────────────────────────────────

export type GeracaoTipo = 'variacao_winner' | 'criativo_novo';

export type GeracaoVariacaoTipo =
  | 'hook'
  | 'angulo'
  | 'emocao'
  | 'copy_completa'
  | 'remix_total'
  | 'formato';

export type GeracaoResultado =
  | 'pendente'
  | 'em_teste'
  | 'winner'
  | 'morto'
  | 'pausado'
  | 'saturado';

export interface GeracaoIA {
  id: string;
  tipo: GeracaoTipo;
  input_persona: CreativePersona | null;
  input_angulo: CreativeAngulo | null;
  input_emocao: CreativeEmocao | null;
  input_formato: CreativeFormato | null;
  winner_origem_id: string | null;
  contexto_usado: Record<string, unknown>;
  total_criativos_gerados: number;
  total_viraram_winner: number;
  total_mortos: number;
  total_em_teste: number;
  win_rate_geracao: number | null;
  notas: string | null;
  gerado_por: string;
  created_at: string;
  updated_at: string;
}

export interface GeracaoIAItem {
  id: string;
  geracao_id: string;
  criativo_id: string | null;
  variacao_tipo: GeracaoVariacaoTipo | null;
  referencias_usadas: Record<string, unknown>;
  copy_gerada: {
    hook: string | null;
    copy_titulo: string | null;
    copy_descricao: string | null;
    copy_primario: string | null;
    roteiro: string | null;
  };
  resultado: GeracaoResultado;
  cpa_final: number | null;
  roas_final: number | null;
  dias_ativo_final: number | null;
  total_spend_final: number | null;
  created_at: string;
  updated_at: string;
}

// ── Status → GeracaoResultado mapping ───────────────────────

export const STATUS_TO_GERACAO_RESULTADO: Partial<Record<CreativeStatus, GeracaoResultado>> = {
  em_teste: 'em_teste',
  winner: 'winner',
  escala: 'winner',
  morto: 'morto',
  pausado: 'pausado',
  saturado: 'saturado',
};

// ── Business constants (v3 — Andromeda+CBO 02/04/2026) ──────
// Ref: template-campanha-teste.md + template-campanha-escala.md (corrigidos 02/04)
// Regras Neto: 1-1-N, budget teste R$800 fixo, graduação 20 compras + ROAS 1.8x

export const CPA_TARGET = 60; // R$60 CPA target (Shopee ADS 2.0)
export const TICKET = 97;
export const FREQUENCY_SATURATION = 3.5;
export const MIN_IMPRESSIONS_FOR_KILL = 1000; // Nunca julgar antes de 1.000 impressões

// Kill rules (teste) — baseado em CPA
export const CPA_KILL_MULTIPLIER = 2.0; // 2x CPA target + ZERO conversão = pausa imediata
export const CPA_MONITOR_MULTIPLIER = 1.5; // 1.5x CPA target + 1 conversão = monitora 48h
export const CPA_HIGH_DAYS = 5; // CPA 50%+ acima por 5 dias = pausa
export const CTR_DROP_PCT = 0.30; // CTR caiu 30% = pausa

// Kill rules (escala) — baseado em ROAS
export const ESCALA_ROAS_KILL = 1.3; // ROAS < 1.3 por 5 dias seguidos = pausa
export const ESCALA_ROAS_KILL_DAYS = 5; // 5 dias seguidos abaixo de 1.3
// Legacy (manter pra não quebrar imports)
export const ESCALA_CPA_KILL_MULTIPLIER = 3.0;
export const ESCALA_MIN_KILL_IMPRESSIONS = 2000;

// Graduação — winner criteria
export const WINNER_MIN_PURCHASES = 20; // Mínimo 20 compras (ajuste Neto 02/04)
export const WINNER_MIN_ROAS = 1.8; // ROAS mínimo 1.8x (ajuste Neto 02/04)
// Legacy
export const WINNER_MIN_DAYS = 3;

// Budget
export const BUDGET_CHANGE_PCT = 0.15; // ±15% diário (escala)
export const BUDGET_FREEZE_DAYS = 5; // Dias 1-5 intocável (não mexer em NADA)
export const BUDGET_TEST_DAILY = 80000; // R$800/dia campanha teste (centavos) — FIXO, nunca alterar
export const BUDGET_ESCALA_INITIAL = 100000; // R$1.000/dia campanha escala (centavos) — escalável ±15%

// Escala
export const ESCALA_MIN_WINNERS = 8; // Mínimo 8 winners pra criar campanha de escala
export const ESCALA_MAX_WINNERS = 15; // Máximo 15 winners por campanha

// Legacy (manter pra não quebrar imports existentes)
export const ROAS_KILL_THRESHOLD = 1.3;
export const DAILY_BUDGET = 80000; // centavos = R$800 CBO campanha teste
export const CURSO_URL = 'https://netomarquezini.com.br/curso-ads/';

// ── Copy validation ──────────────────────────────────────────

export function validateCopy(copy: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const fullCopy = copy.toLowerCase();

  if (!/4\s*configura[cç][oõ]es/i.test(copy)) {
    errors.push('Copy deve conter "4 configuracoes" (mecanismo unico)');
  }
  if (!/roas\s*(de|acima\s*de)?\s*25/i.test(copy)) {
    errors.push('Copy deve conter "ROAS de 25" (promessa)');
  }

  const prohibited = ['ficar rico rapido', 'dinheiro facil', 'esquema'];
  for (const term of prohibited) {
    if (fullCopy.includes(term)) {
      errors.push(`Copy contem termo proibido: "${term}"`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateCopyFields(fields: {
  copy_primario?: string | null;
  copy_titulo?: string | null;
  copy_descricao?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (fields.copy_primario && fields.copy_primario.length > 250) {
    errors.push(`Texto primario: ${fields.copy_primario.length}/250 caracteres (excedeu)`);
  }
  if (fields.copy_titulo && fields.copy_titulo.length > 40) {
    errors.push(`Headline: ${fields.copy_titulo.length}/40 caracteres (excedeu)`);
  }
  if (fields.copy_descricao && fields.copy_descricao.length > 30) {
    errors.push(`Descricao: ${fields.copy_descricao.length}/30 caracteres (excedeu)`);
  }
  return { valid: errors.length === 0, errors };
}

// ── Kanban columns ───────────────────────────────────────────

export const KANBAN_COLUMNS: CreativeStatus[] = [
  'ideia',
  'em_producao',
  'revisao',
  'aprovado',
  'pronto',
  'em_teste',
  'pausado',
  'morto',
];

// All angulo values
export const ALL_ANGULOS: CreativeAngulo[] = [
  'dor', 'desejo', 'prova_social', 'autoridade', 'urgencia',
  'curiosidade', 'contraste', 'identificacao', 'educativo', 'controverso',
];

// All formato values
export const ALL_FORMATOS: CreativeFormato[] = [
  'video_talking_head', 'video_motion_graphics', 'video_depoimento',
  'video_screen_recording', 'video_misto', 'video_caixinha_pergunta', 'estatico_single',
  'estatico_carrossel', 'estatico_antes_depois', 'estatico_lista',
  'estatico_prova_social', 'estatico_quote', 'estatico_comparacao',
  'estatico_numero', 'estatico_headline_bold', 'story_vertical', 'reel_vertical',
];

// All persona values
export const ALL_PERSONAS: CreativePersona[] = [
  'seller_iniciante', 'seller_intermediario', 'seller_avancado',
  'seller_frustrado', 'seller_curioso', 'geral',
];

// All emocao values
export const ALL_EMOCOES: CreativeEmocao[] = [
  'medo', 'frustacao', 'esperanca', 'ambicao', 'inveja',
  'confianca', 'curiosidade', 'raiva', 'alivio', 'empolgacao',
];
