// ============================================================
// Creative Management Panel — TypeScript Types
// Matches Supabase schema from migration-creative-panel.sql
// ============================================================

// ────────────────────────────────────────────────────────────
// ENUMS (as TypeScript union types)
// ────────────────────────────────────────────────────────────

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

export type SugestaoTipo =
  | 'novo_hook'
  | 'novo_angulo'
  | 'novo_formato'
  | 'novo_copy'
  | 'nova_emocao'
  | 'nova_persona'
  | 'mashup'
  | 'escala_vertical';

export type SugestaoStatus =
  | 'pendente'
  | 'aceita'
  | 'rejeitada'
  | 'produzida';

// ────────────────────────────────────────────────────────────
// TABLE TYPES
// ────────────────────────────────────────────────────────────

export interface Creative {
  id: string;

  // Identity
  nome: string;
  descricao: string | null;

  // Classification
  status: CreativeStatus;
  angulo: CreativeAngulo;
  formato: CreativeFormato;
  persona: CreativePersona;
  emocao_primaria: CreativeEmocao;
  emocao_secundaria: CreativeEmocao | null;

  // Content
  hook: string | null;
  copy_primario: string | null;
  copy_titulo: string | null;
  copy_descricao: string | null;
  roteiro: string | null;

  // Production
  agente_produtor: string | null;
  conceito_id: string | null;
  ruminacao_id: string | null;
  formato_id: string | null;
  variacao_de: string | null;
  geracao: number;

  // Files
  arquivo_principal: string | null;
  arquivo_thumbnail: string | null;
  arquivo_preview: string | null;
  mime_type: string | null;
  duracao_segundos: number | null;
  resolucao: string | null;
  tamanho_bytes: number | null;

  // Meta Ads Integration
  meta_ad_id: string | null;
  meta_adset_id: string | null;
  meta_campaign_id: string | null;
  meta_creative_id: string | null;
  meta_media_id: string | null;
  meta_upload_at: string | null;
  meta_url: string | null;

  // Performance Snapshot
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

  // Winner Detection
  is_winner: boolean;
  winner_at: string | null;
  dias_consecutivos_bom: number;

  // Tags & Notes
  tags: string[];
  notas: string | null;

  // Audit
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface Conceito {
  id: string;

  // Content
  nome: string;
  descricao: string;
  tipo: ConceitoTipo;

  // Classification
  angulo: CreativeAngulo | null;
  persona: CreativePersona | null;
  emocao: CreativeEmocao | null;

  // ICE Scoring
  ice_impacto: number;
  ice_confianca: number;
  ice_facilidade: number;
  ice_score: number; // Generated column

  // Usage tracking
  vezes_usado: number;
  melhor_roas: number | null;
  pior_roas: number | null;
  media_roas: number | null;

  // Status
  ativo: boolean;

  // Audit
  created_at: string;
  updated_at: string;
}

export interface Ruminacao {
  id: string;

  // Content
  texto: string;
  texto_variantes: string[];

  // Classification
  trigger: TriggerType;
  emocao: CreativeEmocao;
  angulo: CreativeAngulo | null;
  persona: CreativePersona | null;

  // Scoring
  impacto_estimado: number;

  // Performance
  vezes_usado: number;
  melhor_ctr: number | null;
  media_ctr: number | null;
  melhor_hook_rate: number | null;

  // Status
  ativo: boolean;

  // Audit
  created_at: string;
  updated_at: string;
}

export interface Formato {
  id: string;

  // Identity
  nome: string;
  formato: CreativeFormato;
  tipo: 'video' | 'estatico';

  // Specs
  largura: number;
  altura: number;
  aspect_ratio: string;
  duracao_min: number | null;
  duracao_max: number | null;
  tamanho_max_mb: number;

  // Production guidance
  agente_recomendado: string | null;
  template_remotion: string | null;
  diretrizes: string | null;

  // Performance tracking
  media_ctr: number | null;
  media_roas: number | null;
  total_criativos: number;
  total_winners: number;

  // Audit
  created_at: string;
  updated_at: string;
}

export interface MetricaCriativo {
  id: string;

  // References
  criativo_id: string;
  meta_ad_id: string;

  // Date
  date: string;

  // Core metrics
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;

  // Rates
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;

  // Conversions
  purchases: number;
  revenue: number;
  cost_per_purchase: number;
  roas: number;

  // Funnel
  landing_page_views: number;
  add_to_cart: number;
  initiate_checkout: number;
  add_payment_info: number;
  link_clicks: number;

  // Video-specific
  video_views_3s: number;
  video_views_15s: number;
  video_views_complete: number;
  hook_rate: number;
  hold_rate: number;

  // Engagement
  post_reactions: number;
  post_comments: number;
  post_shares: number;
  post_saves: number;

  // Sync metadata
  synced_at: string;
}

export interface SugestaoVariacao {
  id: string;

  // Source
  criativo_origem_id: string;

  // Suggestion
  tipo: SugestaoTipo;
  descricao: string;

  // Suggested values
  angulo_sugerido: CreativeAngulo | null;
  formato_sugerido: CreativeFormato | null;
  persona_sugerida: CreativePersona | null;
  emocao_sugerida: CreativeEmocao | null;
  hook_sugerido: string | null;
  copy_sugerido: string | null;

  // Reasoning
  motivo: string;
  confianca: number;
  impacto_estimado: number;

  // Status
  status: SugestaoStatus;
  criativo_gerado_id: string | null;

  // Audit
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

// ────────────────────────────────────────────────────────────
// STATUS TRANSITION MAP
// Defines which status transitions are valid
// ────────────────────────────────────────────────────────────

export const STATUS_TRANSITIONS: Record<CreativeStatus, CreativeStatus[]> = {
  ideia:        ['em_producao', 'morto'],
  em_producao:  ['revisao', 'morto'],
  revisao:      ['aprovado', 'em_producao', 'morto'],       // Can send back to production
  aprovado:     ['pronto', 'morto'],
  pronto:       ['em_teste', 'morto'],                      // Auto-upload triggers em_teste
  em_teste:     ['winner', 'saturado', 'pausado', 'morto'],
  winner:       ['escala', 'saturado', 'pausado', 'morto'],
  escala:       ['saturado', 'pausado', 'morto'],
  saturado:     ['pausado', 'morto'],
  pausado:      ['em_teste', 'morto'],                      // Can reactivate
  morto:        [],                                          // Terminal state
};

/**
 * Check if a status transition is valid.
 */
export function isValidTransition(from: CreativeStatus, to: CreativeStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

// ────────────────────────────────────────────────────────────
// CONSTANTS (v2 — Andromeda + CBO 31/03/2026)
// Source of truth: /lib/types-criativos.ts
// These are re-exported for convenience in component files
// ────────────────────────────────────────────────────────────

/** CPA target in BRL (a recalibrar com dados novos) */
export const CPA_TARGET = 60;

/** Ticket price in BRL */
export const TICKET_PRICE = 97;

/** Frequency above this = saturated */
export const FREQUENCY_SATURATION = 3.5;

/** Consecutive good days to become winner */
export const WINNER_DAYS_THRESHOLD = 3;

/** Minimum conversions to become winner (v2: 5 compras) */
export const WINNER_CONVERSIONS_THRESHOLD = 5;

/** Default Meta Ads link */
export const DEFAULT_META_URL = 'https://netomarquezini.com.br/curso-ads/';

// ────────────────────────────────────────────────────────────
// HELPER TYPES
// ────────────────────────────────────────────────────────────

/** For creating a new creative (omit auto-generated fields) */
export type CreativeInsert = Omit<Creative,
  | 'id'
  | 'total_spend' | 'total_impressions' | 'total_clicks' | 'total_purchases' | 'total_revenue'
  | 'cpa_atual' | 'roas_atual' | 'ctr_atual' | 'frequency_atual' | 'dias_ativo'
  | 'is_winner' | 'winner_at' | 'dias_consecutivos_bom'
  | 'created_at' | 'updated_at'
> & {
  nome: string;
  formato: CreativeFormato;
};

/** For updating a creative (all fields optional except id) */
export type CreativeUpdate = Partial<Omit<Creative, 'id'>> & { id: string };

/** For creating a new conceito */
export type ConceitoInsert = Omit<Conceito,
  | 'id' | 'ice_score' | 'vezes_usado' | 'melhor_roas' | 'pior_roas' | 'media_roas'
  | 'created_at' | 'updated_at'
>;

/** For creating a new ruminacao */
export type RuminacaoInsert = Omit<Ruminacao,
  | 'id' | 'vezes_usado' | 'melhor_ctr' | 'media_ctr' | 'melhor_hook_rate'
  | 'created_at' | 'updated_at'
>;
