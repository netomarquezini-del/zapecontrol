"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import {
  Loader2,
  Check,
  AlertCircle,
  Pencil,
  X,
  Sparkles,
} from "lucide-react";

interface MetaMensal {
  id: string;
  mes: string;
  nivel: string;
  meta_mensal_vendas: number;
  meta_diaria_vendas: number;
}

interface MetaTemplate {
  id: string;
  nivel: string;
  meta_vendas_mensal: number;
  meta_vendas_diaria: number;
  meta_closer_mensal: number;
  meta_closer_diaria: number;
  meta_sdr_mensal: number;
  meta_sdr_diaria: number;
}

const LEVEL_CONFIG: Record<
  string,
  { label: string; bg: string; border: string; text: string; badge: string }
> = {
  minima: {
    label: "Mínima",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/20",
    text: "text-zinc-300",
    badge: "bg-zinc-500/20 text-zinc-400",
  },
  super: {
    label: "Super",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-300",
    badge: "bg-blue-500/20 text-blue-400",
  },
  ultra: {
    label: "Ultra",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-300",
    badge: "bg-purple-500/20 text-purple-400",
  },
  black: {
    label: "Black",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-300",
    badge: "bg-amber-500/20 text-amber-400",
  },
};

const LEVEL_ORDER = ["minima", "super", "ultra", "black"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export default function MetaLevels({
  selectedMonth,
}: {
  selectedMonth: string;
}) {
  const [metas, setMetas] = useState<MetaMensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    meta_mensal_vendas: 0,
    meta_diaria_vendas: 0,
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const fetchMetas = useCallback(async () => {
    const supabase = getSupabase();
    setLoading(true);
    const { data, error } = await supabase
      .from("metas_mensais")
      .select("*")
      .eq("mes", selectedMonth)
      .order("nivel");

    if (error) {
      setFeedback({ type: "error", msg: "Erro ao carregar metas." });
    } else {
      // Sort by LEVEL_ORDER
      const sorted = (data || []).sort(
        (a: MetaMensal, b: MetaMensal) =>
          LEVEL_ORDER.indexOf(a.nivel) - LEVEL_ORDER.indexOf(b.nivel)
      );
      setMetas(sorted);
    }
    setLoading(false);
  }, [selectedMonth]);

  useEffect(() => {
    fetchMetas();
  }, [fetchMetas]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const generateFromTemplate = async () => {
    const supabase = getSupabase();
    setGenerating(true);
    try {
      // Fetch templates
      const { data: templates, error: tErr } = await supabase
        .from("meta_templates")
        .select("*");

      if (tErr || !templates?.length) {
        setFeedback({
          type: "error",
          msg: "Erro ao buscar templates de metas.",
        });
        setGenerating(false);
        return;
      }

      // Fetch closers count for multiplier
      const { count: closerCount } = await supabase
        .from("closers")
        .select("*", { count: "exact", head: true });

      const multiplier = closerCount || 1;

      const records = templates.map((t: MetaTemplate) => ({
        mes: selectedMonth,
        nivel: t.nivel,
        meta_mensal_vendas: t.meta_vendas_mensal * multiplier,
        meta_diaria_vendas: t.meta_vendas_diaria * multiplier,
      }));

      const { error: insertErr } = await supabase
        .from("metas_mensais")
        .upsert(records, { onConflict: "mes,nivel" });

      if (insertErr) {
        setFeedback({ type: "error", msg: "Erro ao gerar metas: " + insertErr.message });
      } else {
        setFeedback({ type: "success", msg: "Metas geradas com sucesso!" });
        await fetchMetas();
      }
    } catch {
      setFeedback({ type: "error", msg: "Erro inesperado ao gerar metas." });
    }
    setGenerating(false);
  };

  const startEdit = (meta: MetaMensal) => {
    setEditingId(meta.id);
    setEditValues({
      meta_mensal_vendas: meta.meta_mensal_vendas,
      meta_diaria_vendas: meta.meta_diaria_vendas,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    const supabase = getSupabase();
    setSaving(true);
    const { error } = await supabase
      .from("metas_mensais")
      .update({
        meta_mensal_vendas: editValues.meta_mensal_vendas,
        meta_diaria_vendas: editValues.meta_diaria_vendas,
      })
      .eq("id", id);

    if (error) {
      setFeedback({ type: "error", msg: "Erro ao salvar." });
    } else {
      setFeedback({ type: "success", msg: "Meta atualizada!" });
      setEditingId(null);
      await fetchMetas();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        <span className="ml-2 text-zinc-500">Carregando metas...</span>
      </div>
    );
  }

  if (metas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-center">
          <p className="text-zinc-400 text-lg mb-1">
            Nenhuma meta definida para este mês.
          </p>
          <p className="text-zinc-600 text-sm">
            Gere as metas automaticamente a partir do template configurado.
          </p>
        </div>
        <button
          onClick={generateFromTemplate}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg bg-lime-500/10 border border-lime-500/20 px-5 py-2.5 text-sm font-medium text-lime-400 hover:bg-lime-500/20 transition-colors disabled:opacity-50"
        >
          {generating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          Gerar metas a partir do template
        </button>
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

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metas.map((meta) => {
          const config = LEVEL_CONFIG[meta.nivel] || LEVEL_CONFIG.minima;
          const isEditing = editingId === meta.id;

          return (
            <div
              key={meta.id}
              className={`relative rounded-xl border ${config.border} ${config.bg} p-5 transition-all`}
            >
              {/* Level badge */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${config.badge}`}
                >
                  {config.label}
                </span>
                {!isEditing && (
                  <button
                    onClick={() => startEdit(meta)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {isEditing && (
                  <button
                    onClick={cancelEdit}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                    title="Cancelar"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Meta mensal */}
              <div className="mb-3">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">
                  Meta Mensal Vendas
                </p>
                {isEditing ? (
                  <input
                    type="number"
                    value={editValues.meta_mensal_vendas}
                    onChange={(e) =>
                      setEditValues((v) => ({
                        ...v,
                        meta_mensal_vendas: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-md border border-[#333] bg-[#111] px-3 py-1.5 text-lg font-bold text-white outline-none focus:border-lime-500/40"
                  />
                ) : (
                  <p className={`text-xl font-bold ${config.text}`}>
                    {formatCurrency(meta.meta_mensal_vendas)}
                  </p>
                )}
              </div>

              {/* Meta diária */}
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">
                  Meta Diária
                </p>
                {isEditing ? (
                  <input
                    type="number"
                    value={editValues.meta_diaria_vendas}
                    onChange={(e) =>
                      setEditValues((v) => ({
                        ...v,
                        meta_diaria_vendas: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-md border border-[#333] bg-[#111] px-3 py-1.5 text-lg font-bold text-white outline-none focus:border-lime-500/40"
                  />
                ) : (
                  <p className={`text-xl font-bold ${config.text}`}>
                    {formatCurrency(meta.meta_diaria_vendas)}
                  </p>
                )}
              </div>

              {/* Save button */}
              {isEditing && (
                <button
                  onClick={() => saveEdit(meta.id)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-lime-500/10 border border-lime-500/20 px-4 py-2 text-sm font-medium text-lime-400 hover:bg-lime-500/20 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Salvar
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
