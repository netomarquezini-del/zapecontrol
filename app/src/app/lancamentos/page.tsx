"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { Plus, CalendarDays, RefreshCw } from "lucide-react";
import MovementForm from "@/components/lancamentos/movement-form";
import MovementTable from "@/components/lancamentos/movement-table";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

    // Fetch movements for the selected date
    const { data: movs, error } = await supabase
      .from("movements")
      .select("*")
      .eq("data_raw", selectedDate)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar lançamentos:", error);
      setMovements([]);
      setLoading(false);
      return;
    }

    // Fetch closers to resolve names
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

  // Format display date
  const displayDate = (() => {
    try {
      const [year, month, day] = selectedDate.split("-");
      return `${day}/${month}/${year}`;
    } catch {
      return selectedDate;
    }
  })();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Lançamentos
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Gerencie os lançamentos diários dos closers.
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2">
              <CalendarDays size={18} className="text-emerald-400" />
              <input
                type="date"
                className="border-0 bg-transparent text-sm text-white focus:outline-none"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <span className="text-sm text-zinc-400">{displayDate}</span>
            <button
              onClick={fetchMovements}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              title="Atualizar"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <button
            onClick={handleNewEntry}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} />
            Novo Lançamento
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-zinc-500">
              <RefreshCw size={20} className="animate-spin" />
              <span className="text-sm">Carregando lançamentos...</span>
            </div>
          </div>
        ) : (
          <MovementTable
            movements={movements}
            onEdit={handleEdit}
            onDeleted={handleSaved}
          />
        )}
      </div>

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
