import { supabase } from "./supabase";
import type {
  Closer,
  Sdr,
  Origem,
  Servico,
  MetaTemplate,
  MetaMensal,
  MetaMensalUpsert,
  MetaCloser,
  MetaCloserUpsert,
  MetaSdr,
  MetaSdrUpsert,
  Movement,
  MovementInsert,
  MovementUpdate,
  MovementFilters,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Throw on Supabase errors so callers always get clean data. */
function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) {
    throw result.error;
  }
  return result.data as T;
}

// ---------------------------------------------------------------------------
// Lookup tables
// ---------------------------------------------------------------------------

export async function fetchClosers(): Promise<Closer[]> {
  return unwrap(
    await supabase.from("closers").select("*").order("name")
  );
}

export async function fetchSdrs(): Promise<Sdr[]> {
  return unwrap(
    await supabase.from("sdrs").select("*").order("name")
  );
}

export async function fetchOrigens(): Promise<Origem[]> {
  return unwrap(
    await supabase.from("origens").select("*").order("name")
  );
}

export async function fetchServicos(): Promise<Servico[]> {
  return unwrap(
    await supabase.from("servicos").select("*").order("name")
  );
}

// ---------------------------------------------------------------------------
// Movements
// ---------------------------------------------------------------------------

export async function fetchMovements(
  filters?: MovementFilters
): Promise<Movement[]> {
  let query = supabase
    .from("movements")
    .select("*")
    .order("data_raw", { ascending: false });

  if (filters?.mes) {
    // mes is "YYYY-MM" — match rows whose data_raw starts with that prefix
    const startDate = `${filters.mes}-01`;
    const [y, m] = filters.mes.split("-").map(Number);
    const endDate =
      m === 12
        ? `${y + 1}-01-01`
        : `${y}-${String(m + 1).padStart(2, "0")}-01`;
    query = query.gte("data_raw", startDate).lt("data_raw", endDate);
  }

  if (filters?.closer_id) {
    query = query.eq("closer_id", filters.closer_id);
  }

  return unwrap(await query);
}

export async function fetchMovementsByDate(
  date: string
): Promise<Movement[]> {
  // date can be "DD/MM/YYYY" (display) or "YYYY-MM-DD" (raw)
  const isRaw = /^\d{4}-\d{2}-\d{2}$/.test(date);

  if (isRaw) {
    return unwrap(
      await supabase
        .from("movements")
        .select("*")
        .eq("data_raw", date)
        .order("closer_id")
    );
  }

  return unwrap(
    await supabase
      .from("movements")
      .select("*")
      .eq("data", date)
      .order("closer_id")
  );
}

export async function createMovement(
  data: MovementInsert
): Promise<Movement> {
  const result = await supabase
    .from("movements")
    .insert(data)
    .select()
    .single();
  return unwrap(result);
}

export async function updateMovement(
  id: number,
  data: MovementUpdate
): Promise<Movement> {
  const result = await supabase
    .from("movements")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  return unwrap(result);
}

export async function deleteMovement(id: number): Promise<void> {
  unwrap(await supabase.from("movements").delete().eq("id", id));
}

// ---------------------------------------------------------------------------
// Meta templates
// ---------------------------------------------------------------------------

export async function fetchMetaTemplates(): Promise<MetaTemplate[]> {
  return unwrap(
    await supabase.from("meta_templates").select("*").order("id")
  );
}

// ---------------------------------------------------------------------------
// Metas mensais
// ---------------------------------------------------------------------------

export async function fetchMetasMensais(
  mes: string
): Promise<MetaMensal[]> {
  return unwrap(
    await supabase
      .from("metas_mensais")
      .select("*")
      .eq("mes", mes)
      .order("id")
  );
}

export async function upsertMetasMensais(
  data: MetaMensalUpsert
): Promise<MetaMensal> {
  const result = await supabase
    .from("metas_mensais")
    .upsert(data, { onConflict: "mes" })
    .select()
    .single();
  return unwrap(result);
}

// ---------------------------------------------------------------------------
// Metas closers
// ---------------------------------------------------------------------------

export async function fetchMetasClosers(
  mes_id: number
): Promise<MetaCloser[]> {
  return unwrap(
    await supabase
      .from("metas_closers")
      .select("*")
      .eq("mes_id", mes_id)
      .order("closer_id")
  );
}

export async function upsertMetasClosers(
  data: MetaCloserUpsert | MetaCloserUpsert[]
): Promise<MetaCloser[]> {
  const rows = Array.isArray(data) ? data : [data];
  const result = await supabase
    .from("metas_closers")
    .upsert(rows, { onConflict: "mes_id,closer_id" })
    .select();
  return unwrap(result);
}

// ---------------------------------------------------------------------------
// Metas SDRs
// ---------------------------------------------------------------------------

export async function fetchMetasSdrs(
  mes_id: number
): Promise<MetaSdr[]> {
  return unwrap(
    await supabase
      .from("metas_sdrs")
      .select("*")
      .eq("mes_id", mes_id)
      .order("sdr_id")
  );
}

export async function upsertMetasSdrs(
  data: MetaSdrUpsert | MetaSdrUpsert[]
): Promise<MetaSdr[]> {
  const rows = Array.isArray(data) ? data : [data];
  const result = await supabase
    .from("metas_sdrs")
    .upsert(rows, { onConflict: "mes_id,sdr_id" })
    .select();
  return unwrap(result);
}
