"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Loader2, Check, AlertCircle, Save, Pencil, X } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Sdr {
  id: string;
  name: string;
}

interface SdrMeta {
  id?: string;
  mes_id: string;
  sdr_id: string;
  meta_mensal: number;
  meta_diaria: number;
}

interface SdrRow {
  sdr: Sdr;
  meta: SdrMeta | null;
  editMensal: number;
  editDiaria: number;
}

export default function SdrMetas({
  selectedMonth,
}: {
  selectedMonth: string;
}) {
  const [rows, setRows] = useState<SdrRow[]>([]);
  const [mesId, setMesId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setEditingId(null);

    // Get the metas_mensais record for this month (prefer minima, fallback to first)
    const { data: mensais } = await supabase
      .from("metas_mensais")
      .select("id, nivel")
      .eq("mes", selectedMonth)
      .order("nivel");

    const minimaRecord = mensais?.find((m) => m.nivel === "minima");
    const currentMesId = minimaRecord?.id || mensais?.[0]?.id || null;
    setMesId(currentMesId);

    // Get all SDRs
    const { data: sdrs } = await supabase
      .from("sdrs")
      .select("*")
      .order("name");

    if (!sdrs?.length) {
      setRows([]);
      setLoading(false);
      return;
    }

    // Get existing SDR metas for this month
    let existingMetas: SdrMeta[] = [];
    if (currentMesId) {
      const { data } = await supabase
        .from("metas_sdrs")
        .select("*")
        .eq("mes_id", currentMesId);
      existingMetas = data || [];
    }

    const result: SdrRow[] = sdrs.map((sdr: Sdr) => {
      const meta = existingMetas.find((m) => m.sdr_id === sdr.id) || null;
      return {
        sdr,
        meta,
        editMensal: meta?.meta_mensal || 0,
        editDiaria: meta?.meta_diaria || 0,
      };
    });

    setRows(result);
    setLoading(false);
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const updateRow = (
    sdrId: string,
    field: "editMensal" | "editDiaria",
    value: number
  ) => {
    setRows((prev) =>
      prev.map((r) =>
        r.sdr.id === sdrId ? { ...r, [field]: value } : r
      )
    );
  };

  const saveRow = async (sdrId: string) => {
    if (!mesId) {
      setFeedback({
        type: "error",
        msg: "Nenhuma meta mensal encontrada para este mês. Gere as metas gerais primeiro.",
      });
      return;
    }

    setSavingRow(sdrId);
    const row = rows.find((r) => r.sdr.id === sdrId);
    if (!row) return;

    const payload = {
      mes_id: mesId,
      sdr_id: sdrId,
      meta_mensal: row.editMensal,
      meta_diaria: row.editDiaria,
    };

    let error;
    if (row.meta?.id) {
      ({ error } = await supabase
        .from("metas_sdrs")
        .update({
          meta_mensal: row.editMensal,
          meta_diaria: row.editDiaria,
        })
        .eq("id", row.meta.id));
    } else {
      ({ error } = await supabase.from("metas_sdrs").insert(payload));
    }

    if (error) {
      setFeedback({ type: "error", msg: "Erro ao salvar: " + error.message });
    } else {
      setFeedback({ type: "success", msg: `Meta de ${row.sdr.name} salva!` });
      setEditingId(null);
      await fetchData();
    }
    setSavingRow(null);
  };

  const saveAll = async () => {
    if (!mesId) {
      setFeedback({
        type: "error",
        msg: "Nenhuma meta mensal encontrada para este mês. Gere as metas gerais primeiro.",
      });
      return;
    }

    setSavingAll(true);

    const upserts = rows.map((r) => ({
      ...(r.meta?.id ? { id: r.meta.id } : {}),
      mes_id: mesId,
      sdr_id: r.sdr.id,
      meta_mensal: r.editMensal,
      meta_diaria: r.editDiaria,
    }));

    const { error } = await supabase
      .from("metas_sdrs")
      .upsert(upserts, { onConflict: "mes_id,sdr_id" });

    if (error) {
      setFeedback({ type: "error", msg: "Erro ao salvar: " + error.message });
    } else {
      setFeedback({ type: "success", msg: "Todas as metas de SDRs salvas!" });
      setEditingId(null);
      await fetchData();
    }
    setSavingAll(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        <span className="ml-2 text-zinc-500">Carregando metas de SDRs...</span>
      </div>
    );
  }

  if (!mesId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <AlertCircle className="text-zinc-500" size={24} />
        <p className="text-zinc-400">
          Nenhuma meta mensal encontrada para este mês.
        </p>
        <p className="text-zinc-600 text-sm">
          Vá em &quot;Metas Gerais&quot; e gere as metas primeiro.
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <p className="text-zinc-400">Nenhum SDR cadastrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <Check size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {feedback.msg}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#222] bg-[#161616]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#222]">
              <th className="px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                SDR
              </th>
              <th className="px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Meta Mensal (agendamentos)
              </th>
              <th className="px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Meta Diária (agendamentos)
              </th>
              <th className="px-5 py-3.5 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1e1e]">
            {rows.map((row) => {
              const isEditing = editingId === row.sdr.id;
              const isSaving = savingRow === row.sdr.id;

              return (
                <tr
                  key={row.sdr.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-white">
                      {row.sdr.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {isEditing ? (
                      <input
                        type="number"
                        value={row.editMensal}
                        onChange={(e) =>
                          updateRow(
                            row.sdr.id,
                            "editMensal",
                            Number(e.target.value)
                          )
                        }
                        className="w-36 rounded-md border border-[#333] bg-[#111] px-3 py-1.5 text-sm text-white outline-none focus:border-emerald-500/40"
                        min={0}
                        step={1}
                      />
                    ) : (
                      <span className="text-sm text-zinc-300">
                        {row.meta?.meta_mensal ?? row.editMensal}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {isEditing ? (
                      <input
                        type="number"
                        value={row.editDiaria}
                        onChange={(e) =>
                          updateRow(
                            row.sdr.id,
                            "editDiaria",
                            Number(e.target.value)
                          )
                        }
                        className="w-36 rounded-md border border-[#333] bg-[#111] px-3 py-1.5 text-sm text-white outline-none focus:border-emerald-500/40"
                        min={0}
                        step={1}
                      />
                    ) : (
                      <span className="text-sm text-zinc-300">
                        {row.meta?.meta_diaria ?? row.editDiaria}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveRow(row.sdr.id)}
                            disabled={isSaving}
                            className="flex h-8 items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                          >
                            {isSaving ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Check size={12} />
                            )}
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditingId(row.sdr.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Save all button */}
      <div className="flex justify-end">
        <button
          onClick={saveAll}
          disabled={savingAll}
          className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-5 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
        >
          {savingAll ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Salvar Tudo
        </button>
      </div>
    </div>
  );
}
