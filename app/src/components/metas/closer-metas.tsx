"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { Loader2, Check, AlertCircle, Save, Pencil, X } from "lucide-react";

interface Closer {
  id: string;
  name: string;
}

interface CloserMeta {
  id?: string;
  mes_id: string;
  closer_id: string;
  meta_mensal: number;
  meta_diaria: number;
}

interface CloserRow {
  closer: Closer;
  meta: CloserMeta | null;
  editMensal: number;
  editDiaria: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export default function CloserMetas({
  selectedMonth,
}: {
  selectedMonth: string;
}) {
  const [rows, setRows] = useState<CloserRow[]>([]);
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
    const supabase = getSupabase();
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

    // Get all closers
    const { data: closers } = await supabase
      .from("closers")
      .select("*")
      .order("name");

    if (!closers?.length) {
      setRows([]);
      setLoading(false);
      return;
    }

    // Get existing closer metas for this month
    let existingMetas: CloserMeta[] = [];
    if (currentMesId) {
      const { data } = await supabase
        .from("metas_closers")
        .select("*")
        .eq("mes_id", currentMesId);
      existingMetas = data || [];
    }

    const result: CloserRow[] = closers.map((closer: Closer) => {
      const meta = existingMetas.find((m) => m.closer_id === closer.id) || null;
      return {
        closer,
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
    closerId: string,
    field: "editMensal" | "editDiaria",
    value: number
  ) => {
    setRows((prev) =>
      prev.map((r) =>
        r.closer.id === closerId ? { ...r, [field]: value } : r
      )
    );
  };

  const saveRow = async (closerId: string) => {
    const supabase = getSupabase();
    if (!mesId) {
      setFeedback({
        type: "error",
        msg: "Nenhuma meta mensal encontrada para este mês. Gere as metas gerais primeiro.",
      });
      return;
    }

    setSavingRow(closerId);
    const row = rows.find((r) => r.closer.id === closerId);
    if (!row) return;

    const payload = {
      mes_id: mesId,
      closer_id: closerId,
      meta_mensal: row.editMensal,
      meta_diaria: row.editDiaria,
    };

    let error;
    if (row.meta?.id) {
      ({ error } = await supabase
        .from("metas_closers")
        .update({
          meta_mensal: row.editMensal,
          meta_diaria: row.editDiaria,
        })
        .eq("id", row.meta.id));
    } else {
      ({ error } = await supabase.from("metas_closers").insert(payload));
    }

    if (error) {
      setFeedback({ type: "error", msg: "Erro ao salvar: " + error.message });
    } else {
      setFeedback({ type: "success", msg: `Meta de ${row.closer.name} salva!` });
      setEditingId(null);
      await fetchData();
    }
    setSavingRow(null);
  };

  const saveAll = async () => {
    const supabase = getSupabase();
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
      closer_id: r.closer.id,
      meta_mensal: r.editMensal,
      meta_diaria: r.editDiaria,
    }));

    const { error } = await supabase
      .from("metas_closers")
      .upsert(upserts, { onConflict: "mes_id,closer_id" });

    if (error) {
      setFeedback({ type: "error", msg: "Erro ao salvar: " + error.message });
    } else {
      setFeedback({ type: "success", msg: "Todas as metas de closers salvas!" });
      setEditingId(null);
      await fetchData();
    }
    setSavingAll(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        <span className="ml-2 text-zinc-500">Carregando metas de closers...</span>
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
        <p className="text-zinc-400">Nenhum closer cadastrado.</p>
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
              ? "bg-lime-500/10 border border-lime-500/20 text-lime-400"
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
                Closer
              </th>
              <th className="px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Meta Mensal (R$)
              </th>
              <th className="px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Meta Diária (R$)
              </th>
              <th className="px-5 py-3.5 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1e1e]">
            {rows.map((row) => {
              const isEditing = editingId === row.closer.id;
              const isSaving = savingRow === row.closer.id;

              return (
                <tr
                  key={row.closer.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-white">
                      {row.closer.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {isEditing ? (
                      <input
                        type="number"
                        value={row.editMensal}
                        onChange={(e) =>
                          updateRow(
                            row.closer.id,
                            "editMensal",
                            Number(e.target.value)
                          )
                        }
                        className="w-36 rounded-md border border-[#333] bg-[#111] px-3 py-1.5 text-sm text-white outline-none focus:border-lime-500/40"
                      />
                    ) : (
                      <span className="text-sm text-zinc-300">
                        {formatCurrency(row.meta?.meta_mensal || row.editMensal)}
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
                            row.closer.id,
                            "editDiaria",
                            Number(e.target.value)
                          )
                        }
                        className="w-36 rounded-md border border-[#333] bg-[#111] px-3 py-1.5 text-sm text-white outline-none focus:border-lime-500/40"
                      />
                    ) : (
                      <span className="text-sm text-zinc-300">
                        {formatCurrency(row.meta?.meta_diaria || row.editDiaria)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveRow(row.closer.id)}
                            disabled={isSaving}
                            className="flex h-8 items-center gap-1.5 rounded-md bg-lime-500/10 border border-lime-500/20 px-3 text-xs font-medium text-lime-400 hover:bg-lime-500/20 transition-colors disabled:opacity-50"
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
                          onClick={() => setEditingId(row.closer.id)}
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
          className="flex items-center gap-2 rounded-lg bg-lime-500/10 border border-lime-500/20 px-5 py-2.5 text-sm font-medium text-lime-400 hover:bg-lime-500/20 transition-colors disabled:opacity-50"
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
