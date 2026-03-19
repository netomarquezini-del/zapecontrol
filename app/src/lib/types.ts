// ---------------------------------------------------------------------------
// ZapeControl — canonical TypeScript types for every Supabase table
// ---------------------------------------------------------------------------

// ---- Lookup / reference tables --------------------------------------------

export interface Closer {
  id: number;
  name: string;
  created_at: string; // ISO timestamp
}

export interface Sdr {
  id: number;
  name: string;
  created_at: string;
}

export interface Origem {
  id: number;
  name: string;
  /** JSON-encoded string array, e.g. '["Instagram","Facebook"]' */
  sub_origem: string;
  created_at: string;
}

export interface Servico {
  id: number;
  name: string;
  created_at: string;
}

// ---- Meta templates -------------------------------------------------------

export type MetaNivel = "minima" | "super" | "ultra" | "black";

export interface MetaTemplate {
  id: number;
  nivel: MetaNivel;
  meta_vendas_mensal: number;
  meta_vendas_diaria: number;
  meta_closer_mensal: number;
  meta_closer_diaria: number;
  meta_sdr_mensal: number;
  meta_sdr_diaria: number;
}

// ---- Metas mensais --------------------------------------------------------

export interface MetaMensal {
  id: number;
  /** Format "YYYY-MM" */
  mes: string;
  nivel: MetaNivel;
  meta_mensal_vendas: number;
  meta_diaria_vendas: number;
  created_at: string;
  updated_at: string;
}

export interface MetaCloser {
  id: number;
  mes_id: number;
  closer_id: number;
  meta_mensal: number;
  meta_diaria: number;
  created_at: string;
  updated_at: string;
}

export interface MetaSdr {
  id: number;
  mes_id: number;
  sdr_id: number;
  meta_mensal: number;
  meta_diaria: number;
  created_at: string;
  updated_at: string;
}

// ---- JSONB sub-types used inside movements --------------------------------

export interface AgendamentoEntry {
  sdr_id: number;
  quantidade: number;
}

export interface ReuniaoEntry {
  sdr_id: number;
  quantidade: number;
}

export interface ReagendamentoEntry {
  sdr_id: number;
  quantidade: number;
}

export interface NoshowEntry {
  sdr_id: number;
  quantidade: number;
}

export interface GanhoEntry {
  valor: number;
  sdr_id: number;
  sdr_name: string;
  origem_id: number;
  servico_id: number;
  sub_origem: string;
  origem_name: string;
  servico_name: string;
}

// ---- Movement -------------------------------------------------------------

export interface Movement {
  id: number;
  /** Display date "DD/MM/YYYY" */
  data: string;
  /** ISO date for sorting / filtering "YYYY-MM-DD" */
  data_raw: string;
  closer_id: number;
  agendamentos: AgendamentoEntry[];
  reunioes: ReuniaoEntry[];
  reagendamentos: ReagendamentoEntry[];
  noshows: NoshowEntry[];
  ganhos: GanhoEntry[];
  created_at: string;
  updated_at: string;
}

/** Payload used when creating a new movement (id and timestamps excluded). */
export type MovementInsert = Omit<Movement, "id" | "created_at" | "updated_at">;

/** Payload used when updating an existing movement (all fields optional). */
export type MovementUpdate = Partial<MovementInsert>;

// ---- Movements audit ------------------------------------------------------

export interface MovementAudit {
  id: number;
  movement_id: number;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string;
  changed_at: string;
}

// ---- Meta histórico -------------------------------------------------------

export interface MetaHistorico {
  id: number;
  mes: string;
  nivel: string;
  meta_mensal_vendas: number;
  total_closers: number;
  total_sdrs: number;
  criado_em: string;
}

// ---- Upsert payloads ------------------------------------------------------

export type MetaMensalUpsert = Omit<MetaMensal, "id" | "created_at" | "updated_at">;

export type MetaCloserUpsert = Omit<MetaCloser, "id" | "created_at" | "updated_at">;

export type MetaSdrUpsert = Omit<MetaSdr, "id" | "created_at" | "updated_at">;

// ---- Filter helpers -------------------------------------------------------

export interface MovementFilters {
  /** "YYYY-MM" — filters by the first 7 chars of data_raw */
  mes?: string;
  closer_id?: number;
}
