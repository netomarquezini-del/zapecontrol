"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Pencil, Trash2, Loader2 } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value
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

interface MovementTableProps {
  movements: Movement[];
  onEdit: (movement: Movement) => void;
  onDeleted: () => void;
}

function sumQuantidade(items: SdrMetric[] | null): number {
  return (items ?? []).reduce((sum, item) => sum + (item.quantidade || 0), 0);
}

function sumValor(ganhos: Ganho[] | null): number {
  return (ganhos ?? []).reduce((sum, g) => sum + (g.valor || 0), 0);
}

export default function MovementTable({
  movements,
  onEdit,
  onDeleted,
}: MovementTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }

    setDeletingId(id);
    const { error } = await supabase.from("movements").delete().eq("id", id);
    setDeletingId(null);
    setConfirmId(null);

    if (!error) {
      onDeleted();
    }
  };

  if (movements.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-8 text-center">
        <p className="text-zinc-500">Nenhum lançamento encontrado para esta data.</p>
      </div>
    );
  }

  // Totals
  const totals = {
    agendamentos: movements.reduce((s, m) => s + sumQuantidade(m.agendamentos), 0),
    reunioes: movements.reduce((s, m) => s + sumQuantidade(m.reunioes), 0),
    reagendamentos: movements.reduce((s, m) => s + sumQuantidade(m.reagendamentos), 0),
    noshows: movements.reduce((s, m) => s + sumQuantidade(m.noshows), 0),
    vendas: movements.reduce((s, m) => s + sumValor(m.ganhos), 0),
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-700 bg-zinc-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700 bg-zinc-800/60">
            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Closer
            </th>
            <th className="px-3 py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Agend.
            </th>
            <th className="px-3 py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Reuniões
            </th>
            <th className="px-3 py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Reag.
            </th>
            <th className="px-3 py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              No-Shows
            </th>
            <th className="px-3 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Vendas (R$)
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => (
            <tr
              key={m.id}
              className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/40 transition-colors"
            >
              <td className="px-4 py-3 font-medium text-white">
                {m.closer_name || `Closer #${m.closer_id}`}
              </td>
              <td className="px-3 py-3 text-center text-zinc-300">
                {sumQuantidade(m.agendamentos)}
              </td>
              <td className="px-3 py-3 text-center text-zinc-300">
                {sumQuantidade(m.reunioes)}
              </td>
              <td className="px-3 py-3 text-center text-zinc-300">
                {sumQuantidade(m.reagendamentos)}
              </td>
              <td className="px-3 py-3 text-center text-zinc-300">
                {sumQuantidade(m.noshows)}
              </td>
              <td className="px-3 py-3 text-right font-medium text-emerald-400">
                {formatBRL(sumValor(m.ganhos))}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onEdit(m)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                    title="Editar"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={deletingId === m.id}
                    className={`rounded-lg p-1.5 transition-colors ${
                      confirmId === m.id
                        ? "bg-red-900/40 text-red-400 hover:bg-red-900/60"
                        : "text-zinc-400 hover:bg-zinc-700 hover:text-red-400"
                    }`}
                    title={confirmId === m.id ? "Clique novamente para confirmar" : "Excluir"}
                  >
                    {deletingId === m.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-zinc-600 bg-zinc-800/60">
            <td className="px-4 py-3 text-sm font-bold text-white uppercase">
              Total
            </td>
            <td className="px-3 py-3 text-center font-bold text-white">
              {totals.agendamentos}
            </td>
            <td className="px-3 py-3 text-center font-bold text-white">
              {totals.reunioes}
            </td>
            <td className="px-3 py-3 text-center font-bold text-white">
              {totals.reagendamentos}
            </td>
            <td className="px-3 py-3 text-center font-bold text-white">
              {totals.noshows}
            </td>
            <td className="px-3 py-3 text-right font-bold text-emerald-400">
              {formatBRL(totals.vendas)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
