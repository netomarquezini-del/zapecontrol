"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Plus, CalendarDays, RefreshCw, Loader2 } from "lucide-react";
import MovementForm from "@/components/lancamentos/movement-form";
import MovementTable from "@/components/lancamentos/movement-table";

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
  id: number;
  data: string;
  data_raw: string;
  closer_id: number;
  closer_name?: string;
  agendamentos: SdrMetric[];
  reunioes: SdrMetric[];
  reagendamentos: SdrMetric[];
  noshows: SdrMetric[];
  ganhos: Ganho[];
}

export default function LancamentosPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabase();

    const { data: movs, error } = await supabase
      .from("movements")
      .select("*")
      .eq("data_raw", selectedDate)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar lancamentos:", error);
      setMovements([]);
      setLoading(false);
      return;
    }

    const { data: closers } = await supabase.from("closers").select("id, name");
    const closerMap = new Map(
      (closers ?? []).map((c: { id: number; name: string }) => [c.id, c.name])
    );

    const enriched: Movement[] = (movs ?? []).map((m) => ({
      ...m,
      closer_name: closerMap.get(m.closer_id) ?? `Closer #${m.closer_id}`,
      agendamentos: m.agendamentos ?? [],
      reunioes: m.reunioes ?? [],
      reagendamentos: m.reagendamentos ?? [],
      noshows: m.noshows ?? [],
      ganhos: m.ganhos ?? [],
    }));

    setMovements(enriched);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleEdit = (movement: Movement) => {
    setEditingMovement(movement);
    setShowForm(true);
  };

  const handleNewEntry = () => {
    setEditingMovement(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingMovement(null);
  };

  const handleSaved = () => {
    fetchMovements();
  };

  const displayDate = (() => {
    try {
      const [year, month, day] = selectedDate.split("-");
      return `${day}/${month}/${year}`;
    } catch {
      return selectedDate;
    }
  })();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            Lancamentos
          </h1>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mt-1">
            Registros diarios dos closers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-2.5">
            <CalendarDays size={15} className="text-lime-400" />
            <input
              type="date"
              className="border-0 bg-transparent text-sm font-semibold text-white focus:outline-none [color-scheme:dark]"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <span className="text-[11px] font-semibold text-zinc-600">{displayDate}</span>
          <button
            onClick={fetchMovements}
            className="rounded-xl p-2.5 text-zinc-600 hover:text-lime-400 hover:bg-lime-400/5 border border-transparent hover:border-lime-400/15 transition-all duration-200 cursor-pointer"
            title="Atualizar"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={handleNewEntry}
            className="flex items-center gap-2 rounded-xl bg-lime-400/10 border border-lime-400/20 px-5 py-2.5 text-[13px] font-bold text-lime-400 hover:bg-lime-400/15 transition-all duration-200 cursor-pointer"
          >
            <Plus size={16} />
            Novo Lancamento
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={28} className="animate-spin text-lime-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Carregando lancamentos</span>
        </div>
      ) : (
        <MovementTable
          movements={movements}
          onEdit={handleEdit}
          onDeleted={handleSaved}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <MovementForm
          selectedDate={selectedDate}
          editingMovement={editingMovement}
          onClose={handleFormClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
