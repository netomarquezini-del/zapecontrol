"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { Loader2, Save, Check, AlertCircle, Calculator } from "lucide-react";

const NIVEIS = ["minima", "super", "ultra", "black"] as const;
type Nivel = (typeof NIVEIS)[number];

const NIVEL_CONFIG: Record<Nivel, { label: string; color: string; bg: string; border: string }> = {
  minima: { label: "Minima", color: "text-zinc-300", bg: "bg-zinc-500/8", border: "border-zinc-500/15" },
  super: { label: "Super", color: "text-blue-400", bg: "bg-blue-500/8", border: "border-blue-500/15" },
  ultra: { label: "Ultra", color: "text-purple-400", bg: "bg-purple-500/8", border: "border-purple-500/15" },
  black: { label: "Black", color: "text-amber-400", bg: "bg-amber-500/8", border: "border-amber-500/15" },
};

interface Closer {
  id: number;
  name: string;
}

interface Sdr {
  id: number;
  name: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function getBusinessDays(month: string): number {
  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, mon - 1, d).getDay();
    if (day >= 1 && day <= 5) count++;
  }
  return count;
}

export default function MetaUnifiedForm({ selectedMonth }: { selectedMonth: string }) {
  const businessDays = getBusinessDays(selectedMonth);

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [closers, setClosers] = useState<Closer[]>([]);
  const [sdrs, setSdrs] = useState<Sdr[]>([]);

  // Metas gerais: { minima: value, super: value, ... }
  const [metasGerais, setMetasGerais] = useState<Record<Nivel, number>>({
    minima: 0, super: 0, ultra: 0, black: 0,
  });

  // Metas por closer: { closerId: value }
  const [metasClosers, setMetasClosers] = useState<Record<number, number>>({});

  // Metas por SDR: { sdrId: value }
  const [metasSdrs, setMetasSdrs] = useState<Record<number, number>>({});

  // Existing IDs for upsert
  const [existingMesIds, setExistingMesIds] = useState<Record<string, number>>({});
  const [existingCloserMetaIds, setExistingCloserMetaIds] = useState<Record<number, number>>({});
  const [existingSdrMetaIds, setExistingSdrMetaIds] = useState<Record<number, number>>({});

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchAll = useCallback(async () => {
    const supabase = getSupabase();
    setLoading(true);

    // Fetch closers + SDRs
    const [closersRes, sdrsRes] = await Promise.all([
      supabase.from("closers").select("id, name").order("name"),
      supabase.from("sdrs").select("id, name").order("name"),
    ]);

    const closersList = (closersRes.data ?? []) as Closer[];
    const sdrsList = (sdrsRes.data ?? []) as Sdr[];
    setClosers(closersList);
    setSdrs(sdrsList);

    // Fetch existing metas_mensais for this month
    const { data: mensais } = await supabase
      .from("metas_mensais")
      .select("*")
      .eq("mes", selectedMonth);

    const gerais: Record<Nivel, number> = { minima: 0, super: 0, ultra: 0, black: 0 };
    const mesIds: Record<string, number> = {};

    (mensais ?? []).forEach((m: { id: number; nivel: string; meta_mensal_vendas: number }) => {
      const nivel = m.nivel as Nivel;
      if (NIVEIS.includes(nivel)) {
        gerais[nivel] = m.meta_mensal_vendas;
        mesIds[nivel] = m.id;
      }
    });
    setMetasGerais(gerais);
    setExistingMesIds(mesIds);

    // Fetch closer metas (use minima mes_id as reference)
    const minimaId = mesIds.minima;
    const closerMetasMap: Record<number, number> = {};
    const closerMetaIdsMap: Record<number, number> = {};

    if (minimaId) {
      const { data: cm } = await supabase
        .from("metas_closers")
        .select("*")
        .eq("mes_id", minimaId);

      (cm ?? []).forEach((row: { id: number; closer_id: number; meta_mensal: number }) => {
        closerMetasMap[row.closer_id] = row.meta_mensal;
        closerMetaIdsMap[row.closer_id] = row.id;
      });
    }

    // Init with existing or 0
    const closerInit: Record<number, number> = {};
    closersList.forEach((c) => {
      closerInit[c.id] = closerMetasMap[c.id] ?? 0;
    });
    setMetasClosers(closerInit);
    setExistingCloserMetaIds(closerMetaIdsMap);

    // Fetch SDR metas
    const sdrMetasMap: Record<number, number> = {};
    const sdrMetaIdsMap: Record<number, number> = {};

    if (minimaId) {
      const { data: sm } = await supabase
        .from("metas_sdrs")
        .select("*")
        .eq("mes_id", minimaId);

      (sm ?? []).forEach((row: { id: number; sdr_id: number; meta_mensal: number }) => {
        sdrMetasMap[row.sdr_id] = row.meta_mensal;
        sdrMetaIdsMap[row.sdr_id] = row.id;
      });
    }

    const sdrInit: Record<number, number> = {};
    sdrsList.forEach((s) => {
      sdrInit[s.id] = sdrMetasMap[s.id] ?? 0;
    });
    setMetasSdrs(sdrInit);
    setExistingSdrMetaIds(sdrMetaIdsMap);

    setLoading(false);
  }, [selectedMonth]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSaveAll = async () => {
    const supabase = getSupabase();
    setSaving(true);

    try {
      // 1. Upsert metas_mensais (4 niveis)
      const metasMensaisPayload = NIVEIS.map((nivel) => ({
        ...(existingMesIds[nivel] ? { id: existingMesIds[nivel] } : {}),
        mes: selectedMonth,
        nivel,
        meta_mensal_vendas: metasGerais[nivel],
        meta_diaria_vendas: businessDays > 0 ? Math.round((metasGerais[nivel] / businessDays) * 100) / 100 : 0,
      }));

      const { data: upsertedMensais, error: errMensais } = await supabase
        .from("metas_mensais")
        .upsert(metasMensaisPayload, { onConflict: "mes,nivel" })
        .select("id, nivel");

      if (errMensais) {
        showFeedback("error", "Erro ao salvar metas gerais: " + errMensais.message);
        setSaving(false);
        return;
      }

      // Get the minima mes_id for closer/sdr metas
      const minimaRecord = (upsertedMensais ?? []).find((m: { nivel: string }) => m.nivel === "minima");
      const mesId = minimaRecord?.id;

      if (!mesId) {
        showFeedback("error", "Erro: meta minima nao foi criada.");
        setSaving(false);
        return;
      }

      // 2. Upsert metas_closers
      const closerPayload = closers.map((c) => ({
        ...(existingCloserMetaIds[c.id] ? { id: existingCloserMetaIds[c.id] } : {}),
        mes_id: mesId,
        closer_id: c.id,
        meta_mensal: metasClosers[c.id] ?? 0,
        meta_diaria: businessDays > 0 ? Math.round(((metasClosers[c.id] ?? 0) / businessDays) * 100) / 100 : 0,
      }));

      const { error: errClosers } = await supabase
        .from("metas_closers")
        .upsert(closerPayload, { onConflict: "mes_id,closer_id" });

      if (errClosers) {
        showFeedback("error", "Erro ao salvar metas closers: " + errClosers.message);
        setSaving(false);
        return;
      }

      // 3. Upsert metas_sdrs
      const sdrPayload = sdrs.map((s) => ({
        ...(existingSdrMetaIds[s.id] ? { id: existingSdrMetaIds[s.id] } : {}),
        mes_id: mesId,
        sdr_id: s.id,
        meta_mensal: metasSdrs[s.id] ?? 0,
        meta_diaria: businessDays > 0 ? Math.round(((metasSdrs[s.id] ?? 0) / businessDays) * 100) / 100 : 0,
      }));

      const { error: errSdrs } = await supabase
        .from("metas_sdrs")
        .upsert(sdrPayload, { onConflict: "mes_id,sdr_id" });

      if (errSdrs) {
        showFeedback("error", "Erro ao salvar metas SDRs: " + errSdrs.message);
        setSaving(false);
        return;
      }

      showFeedback("success", "Todas as metas do mes salvas com sucesso!");
      await fetchAll();
    } catch {
      showFeedback("error", "Erro inesperado ao salvar.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 size={28} className="animate-spin text-lime-400" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
          Carregando metas
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Feedback */}
      {feedback && (
        <div
          className={`rounded-xl px-4 py-3 text-[13px] font-semibold border flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-lime-400/8 border-lime-400/15 text-lime-400"
              : "bg-red-400/8 border-red-400/15 text-red-400"
          }`}
        >
          {feedback.type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
          {feedback.msg}
        </div>
      )}

      {/* Business days info */}
      <div className="flex items-center gap-2 rounded-xl bg-lime-400/5 border border-lime-400/10 px-4 py-3">
        <Calculator size={15} className="text-lime-400" />
        <span className="text-[13px] font-semibold text-zinc-300">
          <span className="text-lime-400 font-extrabold">{businessDays}</span> dias uteis no mes
        </span>
        <span className="text-[11px] text-zinc-600 ml-1">(Seg a Sex — meta diaria calculada automaticamente)</span>
      </div>

      {/* SECTION 1: Metas Gerais por Nivel */}
      <div>
        <h3 className="text-label mb-4">Metas Gerais de Vendas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {NIVEIS.map((nivel) => {
            const config = NIVEL_CONFIG[nivel];
            const mensal = metasGerais[nivel];
            const diaria = businessDays > 0 ? mensal / businessDays : 0;

            return (
              <div key={nivel} className={`rounded-xl border ${config.border} ${config.bg} p-5`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${config.color}`}>
                  {config.label}
                </span>

                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 block mb-1">
                      Meta Mensal (R$)
                    </label>
                    <input
                      type="number"
                      value={mensal || ""}
                      onChange={(e) =>
                        setMetasGerais((prev) => ({ ...prev, [nivel]: Number(e.target.value) }))
                      }
                      placeholder="0"
                      className="w-full rounded-lg border border-[#1a1a1a] bg-[#050505] px-3 py-2 text-lg font-extrabold text-white outline-none focus:border-lime-400/30 transition-colors"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Diaria</span>
                    <span className={`text-sm font-extrabold ${config.color}`}>
                      {formatCurrency(diaria)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Metas por Closer */}
      {closers.length > 0 && (
        <div>
          <h3 className="text-label mb-4">Metas por Closer (R$)</h3>
          <div className="card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <th className="text-left py-3 px-5 text-label">Closer</th>
                  <th className="text-left py-3 px-5 text-label">Meta Mensal</th>
                  <th className="text-right py-3 px-5 text-label">Meta Diaria (auto)</th>
                </tr>
              </thead>
              <tbody>
                {closers.map((c) => {
                  const mensal = metasClosers[c.id] ?? 0;
                  const diaria = businessDays > 0 ? mensal / businessDays : 0;
                  return (
                    <tr
                      key={c.id}
                      style={{ borderBottom: "1px solid var(--border-color)" }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-5 font-bold text-white">{c.name}</td>
                      <td className="py-3 px-5">
                        <input
                          type="number"
                          value={mensal || ""}
                          onChange={(e) =>
                            setMetasClosers((prev) => ({ ...prev, [c.id]: Number(e.target.value) }))
                          }
                          placeholder="0"
                          className="w-40 rounded-lg border border-[#1a1a1a] bg-[#050505] px-3 py-1.5 text-sm font-bold text-white outline-none focus:border-lime-400/30 transition-colors"
                        />
                      </td>
                      <td className="py-3 px-5 text-right font-extrabold text-lime-400">
                        {formatCurrency(diaria)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: Metas por SDR */}
      {sdrs.length > 0 && (
        <div>
          <h3 className="text-label mb-4">Metas por SDR (agendamentos)</h3>
          <div className="card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <th className="text-left py-3 px-5 text-label">SDR</th>
                  <th className="text-left py-3 px-5 text-label">Meta Mensal</th>
                  <th className="text-right py-3 px-5 text-label">Meta Diaria (auto)</th>
                </tr>
              </thead>
              <tbody>
                {sdrs.map((s) => {
                  const mensal = metasSdrs[s.id] ?? 0;
                  const diaria = businessDays > 0 ? mensal / businessDays : 0;
                  return (
                    <tr
                      key={s.id}
                      style={{ borderBottom: "1px solid var(--border-color)" }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-5 font-bold text-white">{s.name}</td>
                      <td className="py-3 px-5">
                        <input
                          type="number"
                          value={mensal || ""}
                          onChange={(e) =>
                            setMetasSdrs((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))
                          }
                          placeholder="0"
                          min={0}
                          step={1}
                          className="w-40 rounded-lg border border-[#1a1a1a] bg-[#050505] px-3 py-1.5 text-sm font-bold text-white outline-none focus:border-lime-400/30 transition-colors"
                        />
                      </td>
                      <td className="py-3 px-5 text-right font-extrabold text-lime-400">
                        {Math.round(diaria * 10) / 10}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SAVE ALL */}
      <div className="flex justify-end pt-2 pb-4">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2.5 rounded-xl bg-lime-400/10 border border-lime-400/20 px-8 py-3 text-[14px] font-bold text-lime-400 hover:bg-lime-400/15 transition-all duration-200 cursor-pointer disabled:opacity-40"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Salvar Todas as Metas do Mes
        </button>
      </div>
    </div>
  );
}
