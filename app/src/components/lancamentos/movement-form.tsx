"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { format, parse } from "date-fns";
import { Plus, Trash2, Save, Loader2, X } from "lucide-react";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value
  );

interface Closer {
  id: number;
  name: string;
}
interface SDR {
  id: number;
  name: string;
}
interface Origem {
  id: number;
  name: string;
  sub_origem: string | null;
}
interface Servico {
  id: number;
  name: string;
}

interface SdrMetric {
  sdr_id: number;
  quantidade: number;
}

interface Ganho {
  valor: number;
  sdr_id: number;
  sdr_name: string;
  origem_id: number;
  origem_name: string;
  sub_origem: string;
  servico_id: number;
  servico_name: string;
}

interface Movement {
  id?: number;
  data: string;
  data_raw: string;
  closer_id: number;
  agendamentos: SdrMetric[];
  reunioes: SdrMetric[];
  reagendamentos: SdrMetric[];
  noshows: SdrMetric[];
  ganhos: Ganho[];
}

interface MovementFormProps {
  selectedDate: string; // YYYY-MM-DD
  editingMovement: Movement | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function MovementForm({
  selectedDate,
  editingMovement,
  onClose,
  onSaved,
}: MovementFormProps) {
  const [closers, setClosers] = useState<Closer[]>([]);
  const [sdrs, setSdrs] = useState<SDR[]>([]);
  const [origens, setOrigens] = useState<Origem[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);

  const [dateValue, setDateValue] = useState(selectedDate);
  const [closerId, setCloserId] = useState<number | "">(
    editingMovement?.closer_id ?? ""
  );

  // SDR metrics: { [sdr_id]: { agendamentos, reunioes, reagendamentos, noshows } }
  const [sdrMetrics, setSdrMetrics] = useState<
    Record<number, { agendamentos: number; reunioes: number; reagendamentos: number; noshows: number }>
  >({});

  const [ganhos, setGanhos] = useState<Ganho[]>(editingMovement?.ganhos ?? []);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Load reference data
  useEffect(() => {
    async function load() {
      const supabase = getSupabase();
      const [c, s, o, sv] = await Promise.all([
        supabase.from("closers").select("*").order("name"),
        supabase.from("sdrs").select("*").order("name"),
        supabase.from("origens").select("*").order("name"),
        supabase.from("servicos").select("*").order("name"),
      ]);
      setClosers(c.data ?? []);
      setSdrs(s.data ?? []);
      setOrigens(o.data ?? []);
      setServicos(sv.data ?? []);
    }
    load();
  }, []);

  // Initialize SDR metrics when SDRs load or when editing
  useEffect(() => {
    if (sdrs.length === 0) return;

    const metrics: Record<number, { agendamentos: number; reunioes: number; reagendamentos: number; noshows: number }> = {};

    sdrs.forEach((sdr) => {
      metrics[sdr.id] = { agendamentos: 0, reunioes: 0, reagendamentos: 0, noshows: 0 };
    });

    if (editingMovement) {
      (editingMovement.agendamentos ?? []).forEach((a) => {
        if (metrics[a.sdr_id]) metrics[a.sdr_id].agendamentos = a.quantidade;
      });
      (editingMovement.reunioes ?? []).forEach((r) => {
        if (metrics[r.sdr_id]) metrics[r.sdr_id].reunioes = r.quantidade;
      });
      (editingMovement.reagendamentos ?? []).forEach((r) => {
        if (metrics[r.sdr_id]) metrics[r.sdr_id].reagendamentos = r.quantidade;
      });
      (editingMovement.noshows ?? []).forEach((n) => {
        if (metrics[n.sdr_id]) metrics[n.sdr_id].noshows = n.quantidade;
      });
    }

    setSdrMetrics(metrics);
  }, [sdrs, editingMovement]);

  const updateSdrMetric = useCallback(
    (sdrId: number, field: string, value: number) => {
      setSdrMetrics((prev) => ({
        ...prev,
        [sdrId]: { ...prev[sdrId], [field]: value },
      }));
    },
    []
  );

  // Ganhos helpers
  const addGanho = () => {
    setGanhos((prev) => [
      ...prev,
      {
        valor: 0,
        sdr_id: 0,
        sdr_name: "",
        origem_id: 0,
        origem_name: "",
        sub_origem: "",
        servico_id: 0,
        servico_name: "",
      },
    ]);
  };

  const removeGanho = (index: number) => {
    setGanhos((prev) => prev.filter((_, i) => i !== index));
  };

  const updateGanho = (index: number, field: string, value: string | number) => {
    setGanhos((prev) => {
      const updated = [...prev];
      const g = { ...updated[index] };

      if (field === "valor") {
        g.valor = Number(value);
      } else if (field === "sdr_id") {
        g.sdr_id = Number(value);
        const sdr = sdrs.find((s) => s.id === Number(value));
        g.sdr_name = sdr?.name ?? "";
      } else if (field === "origem_id") {
        g.origem_id = Number(value);
        const origem = origens.find((o) => o.id === Number(value));
        g.origem_name = origem?.name ?? "";
        g.sub_origem = ""; // reset sub_origem when origem changes
      } else if (field === "sub_origem") {
        g.sub_origem = String(value);
      } else if (field === "servico_id") {
        g.servico_id = Number(value);
        const servico = servicos.find((s) => s.id === Number(value));
        g.servico_name = servico?.name ?? "";
      }

      updated[index] = g;
      return updated;
    });
  };

  const getSubOrigens = (origemId: number): string[] => {
    const origem = origens.find((o) => o.id === origemId);
    if (!origem?.sub_origem) return [];
    try {
      const parsed = JSON.parse(origem.sub_origem);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const handleSave = async () => {
    const supabase = getSupabase();
    if (!closerId) {
      setToast({ type: "error", msg: "Selecione um Closer." });
      return;
    }

    // Validate ganhos — servico is required
    const ganhosSemServico = ganhos.filter((g) => g.valor > 0 && !g.servico_id);
    if (ganhosSemServico.length > 0) {
      setToast({ type: "error", msg: "Todas as vendas precisam ter um Servico selecionado." });
      return;
    }

    setSaving(true);
    setToast(null);

    // Build JSONB arrays — only include SDRs with at least one non-zero value
    const buildMetric = (field: "agendamentos" | "reunioes" | "reagendamentos" | "noshows"): SdrMetric[] => {
      return Object.entries(sdrMetrics)
        .filter(([, m]) => m.agendamentos > 0 || m.reunioes > 0 || m.reagendamentos > 0 || m.noshows > 0)
        .map(([sdrId, m]) => ({ sdr_id: Number(sdrId), quantidade: m[field] }));
    };

    const dateFormatted = format(parse(dateValue, "yyyy-MM-dd", new Date()), "dd/MM/yyyy");

    const payload = {
      data: dateFormatted,
      data_raw: dateValue,
      closer_id: Number(closerId),
      agendamentos: buildMetric("agendamentos"),
      reunioes: buildMetric("reunioes"),
      reagendamentos: buildMetric("reagendamentos"),
      noshows: buildMetric("noshows"),
      ganhos: ganhos.filter((g) => g.valor > 0),
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingMovement?.id) {
      const res = await supabase
        .from("movements")
        .update(payload)
        .eq("id", editingMovement.id);
      error = res.error;
    } else {
      const res = await supabase
        .from("movements")
        .insert({ ...payload, created_at: new Date().toISOString() });
      error = res.error;
    }

    setSaving(false);

    if (error) {
      setToast({ type: "error", msg: `Erro ao salvar: ${error.message}` });
    } else {
      setToast({ type: "success", msg: "Lançamento salvo com sucesso!" });
      setTimeout(() => {
        onSaved();
        onClose();
      }, 800);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500";
  const selectClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500";
  const labelClass = "block text-xs font-medium text-zinc-400 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-10">
      <div className="w-full max-w-4xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {editingMovement ? "Editar Lançamento" : "Novo Lançamento"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Toast */}
          {toast && (
            <div
              className={`rounded-lg px-4 py-3 text-sm font-medium ${
                toast.type === "success"
                  ? "bg-lime-900/50 text-lime-300 border border-lime-700"
                  : "bg-red-900/50 text-red-300 border border-red-700"
              }`}
            >
              {toast.msg}
            </div>
          )}

          {/* Step 1: Date + Closer */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Data</label>
              <input
                type="date"
                className={inputClass}
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Closer</label>
              <select
                className={selectClass}
                value={closerId}
                onChange={(e) => setCloserId(Number(e.target.value) || "")}
              >
                <option value="">Selecione...</option>
                {closers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 2: SDR Metrics */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-lime-400 uppercase tracking-wide">
              Métricas por SDR
            </h3>
            <div className="overflow-x-auto rounded-lg border border-zinc-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-800/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                      SDR
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                      Agend.
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                      Reuniões
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                      Reag.
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                      No-Shows
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sdrs.map((sdr) => (
                    <tr key={sdr.id} className="border-b border-zinc-800 last:border-0">
                      <td className="px-4 py-2 text-white font-medium">{sdr.name}</td>
                      {(["agendamentos", "reunioes", "reagendamentos", "noshows"] as const).map(
                        (field) => (
                          <td key={field} className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              className="w-20 mx-auto block rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-center text-sm text-white focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
                              value={sdrMetrics[sdr.id]?.[field] ?? 0}
                              onChange={(e) =>
                                updateSdrMetric(
                                  sdr.id,
                                  field,
                                  Math.max(0, parseInt(e.target.value) || 0)
                                )
                              }
                            />
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                  {sdrs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                        Carregando SDRs...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 3: Ganhos (Sales) */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-lime-400 uppercase tracking-wide">
                Ganhos (Vendas)
              </h3>
              <button
                type="button"
                onClick={addGanho}
                className="flex items-center gap-1.5 rounded-lg bg-lime-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-lime-700 transition-colors"
              >
                <Plus size={14} />
                Adicionar Venda
              </button>
            </div>

            {ganhos.length === 0 && (
              <p className="text-sm text-zinc-500 italic">
                Nenhuma venda adicionada.
              </p>
            )}

            <div className="space-y-3">
              {ganhos.map((ganho, idx) => {
                const subOrigens = getSubOrigens(ganho.origem_id);
                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-400">
                        Venda #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeGanho(idx)}
                        className="rounded p-1 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Valor */}
                      <div>
                        <label className={labelClass}>Valor (R$)</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          className={inputClass}
                          placeholder="0,00"
                          value={ganho.valor || ""}
                          onChange={(e) =>
                            updateGanho(idx, "valor", e.target.value)
                          }
                        />
                      </div>

                      {/* SDR */}
                      <div>
                        <label className={labelClass}>SDR</label>
                        <select
                          className={selectClass}
                          value={ganho.sdr_id || ""}
                          onChange={(e) =>
                            updateGanho(idx, "sdr_id", e.target.value)
                          }
                        >
                          <option value="">Selecione...</option>
                          {sdrs.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Origem */}
                      <div>
                        <label className={labelClass}>Origem</label>
                        <select
                          className={selectClass}
                          value={ganho.origem_id || ""}
                          onChange={(e) =>
                            updateGanho(idx, "origem_id", e.target.value)
                          }
                        >
                          <option value="">Selecione...</option>
                          {origens.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sub-Origem */}
                      {subOrigens.length > 0 && (
                        <div>
                          <label className={labelClass}>Sub-Origem</label>
                          <select
                            className={selectClass}
                            value={ganho.sub_origem || ""}
                            onChange={(e) =>
                              updateGanho(idx, "sub_origem", e.target.value)
                            }
                          >
                            <option value="">Selecione...</option>
                            {subOrigens.map((so) => (
                              <option key={so} value={so}>
                                {so}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Serviço */}
                      <div>
                        <label className={labelClass}>Serviço</label>
                        <select
                          className={selectClass}
                          value={ganho.servico_id || ""}
                          onChange={(e) =>
                            updateGanho(idx, "servico_id", e.target.value)
                          }
                        >
                          <option value="">Selecione...</option>
                          {servicos.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {ganho.valor > 0 && (
                      <div className="mt-2 text-right text-xs text-lime-400 font-medium">
                        {formatBRL(ganho.valor)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {ganhos.length > 0 && (
              <div className="mt-3 text-right text-sm font-semibold text-lime-400">
                Total Vendas:{" "}
                {formatBRL(ganhos.reduce((sum, g) => sum + (g.valor || 0), 0))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-700 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-lime-600 px-5 py-2 text-sm font-medium text-white hover:bg-lime-700 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
