'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Loader2,
  ClipboardCheck,
  Filter,
  RefreshCw,
  ExternalLink,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnaliseRecord {
  id: string;
  nome_cliente: string;
  data_agendamento: string | null;
  data_analise: string | null;
  consultor: string | null;
  status: string | null;
  closer: string | null;
  data_call_fechamento: string | null;
  fechou: string | null;
  mes_referencia: string | null;
  observacoes: string | null;
  data_finalizacao: string | null;
}

function getMonthLabel(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}


export default function AnaliseContasPage() {
  const [allRecords, setAllRecords] = useState<AnaliseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMes, setFilterMes] = useState<string>('');
  const [filterConsultor, setFilterConsultor] = useState<string>('');
  const [filterCloser, setFilterCloser] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/comercial/analise-contas`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      setAllRecords(json.records ?? []);
    } catch (err) {
      console.error('[AnaliseContas] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Extrair opções únicas dos dados reais (para dropdowns dinâmicos)
  const uniqueMeses = [...new Set(allRecords.map(r => getMonthLabel(r.data_agendamento)).filter(Boolean))].sort() as string[];
  const uniqueConsultores = [...new Set(allRecords.map(r => r.consultor).filter(Boolean))].sort() as string[];
  const uniqueClosers = [...new Set(allRecords.map(r => r.closer).filter(Boolean))].sort() as string[];
  const uniqueStatuses = [...new Set(allRecords.map(r => r.status).filter(Boolean))].sort() as string[];

  // Filtrar no client-side (case-insensitive)
  const records = allRecords.filter(r => {
    if (filterMes && getMonthLabel(r.data_agendamento) !== filterMes) return false;
    if (filterConsultor && (r.consultor || '').toLowerCase() !== filterConsultor.toLowerCase()) return false;
    if (filterCloser && (r.closer || '').toLowerCase() !== filterCloser.toLowerCase()) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  // Compute metrics from filtered records
  const total = records.length;
  const concluidos = records.filter(r => (r.status || '').includes('Conclu'));
  const semInteresse = records.filter(r => (r.status || '').toLowerCase().includes('sem interesse') || (r.status || '').toLowerCase().includes('finalizado'));
  const noshow = records.filter(r => (r.status || '').toLowerCase().includes('noshow') || (r.status || '').toLowerCase().includes('no show'));
  const fechouSim = concluidos.filter(r => (r.fechou || '').toLowerCase() === 'sim');
  const taxaFechamento = concluidos.length > 0 ? ((fechouSim.length / concluidos.length) * 100).toFixed(1) : '0.0';

  // Metrics by consultor
  const consultorStats: Record<string, { total: number; concluido: number; semInteresse: number; noshow: number }> = {};
  records.forEach(r => {
    const c = r.consultor || 'N/A';
    if (!consultorStats[c]) consultorStats[c] = { total: 0, concluido: 0, semInteresse: 0, noshow: 0 };
    consultorStats[c].total++;
    if ((r.status || '').includes('Conclu')) consultorStats[c].concluido++;
    if ((r.status || '').toLowerCase().includes('sem interesse') || (r.status || '').toLowerCase().includes('finalizado')) consultorStats[c].semInteresse++;
    if ((r.status || '').toLowerCase().includes('noshow') || (r.status || '').toLowerCase().includes('no show')) consultorStats[c].noshow++;
  });

  // Metrics by closer
  const closerStats: Record<string, { total: number; sim: number; nao: number }> = {};
  concluidos.forEach(r => {
    const c = r.closer || 'N/A';
    if (!closerStats[c]) closerStats[c] = { total: 0, sim: 0, nao: 0 };
    closerStats[c].total++;
    if ((r.fechou || '').toLowerCase() === 'sim') closerStats[c].sim++;
    else closerStats[c].nao++;
  });

  // ── Chart theme constants ──────────────────────────────────────
  const COLORS = {
    lime: '#A3E635',
    green: '#22C55E',
    red: '#EF4444',
    yellow: '#EAB308',
    blue: '#3B82F6',
    zinc: '#A3A3A3',
  };

  const tooltipStyle = {
    contentStyle: { backgroundColor: '#1A1A1A', border: '1px solid #222222', borderRadius: 8, fontSize: 12 },
    labelStyle: { color: '#A3A3A3', fontWeight: 700, fontSize: 11 },
    itemStyle: { color: '#ffffff' },
  };

  const axisTickStyle = { fill: '#666666', fontSize: 11 };

  // ── Chart Data (useMemo) ──────────────────────────────────────

  // 1. Funil de Conversao
  const funnelData = useMemo(() => {
    const totalAgendados = records.length;
    const totalConcluidos = records.filter(r => (r.status || '').includes('Conclu')).length;
    const totalFechou = records.filter(r => (r.status || '').includes('Conclu') && (r.fechou || '').toLowerCase() === 'sim').length;
    return [
      { name: 'Total Agendados', value: totalAgendados, pct: 100, fill: COLORS.zinc },
      { name: 'Concluido (Closer)', value: totalConcluidos, pct: totalAgendados > 0 ? +((totalConcluidos / totalAgendados) * 100).toFixed(1) : 0, fill: COLORS.lime },
      { name: 'Fechou (Sim)', value: totalFechou, pct: totalAgendados > 0 ? +((totalFechou / totalAgendados) * 100).toFixed(1) : 0, fill: COLORS.green },
    ];
  }, [records]);

  // Helper: group records by month (YYYY-MM) from data_agendamento
  const getYearMonth = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  };
  const shortMonth = (ym: string): string => {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${names[parseInt(m, 10) - 1]}/${y.slice(2)}`;
  };

  // 2. Taxa de Fechamento por Mes
  const closingRateByMonth = useMemo(() => {
    const grouped: Record<string, { concluidos: number; fechou: number; total: number }> = {};
    records.forEach(r => {
      const ym = getYearMonth(r.data_agendamento);
      if (!ym) return;
      if (!grouped[ym]) grouped[ym] = { concluidos: 0, fechou: 0, total: 0 };
      grouped[ym].total++;
      if ((r.status || '').includes('Conclu')) {
        grouped[ym].concluidos++;
        if ((r.fechou || '').toLowerCase() === 'sim') grouped[ym].fechou++;
      }
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, d]) => ({
        month: shortMonth(ym),
        taxa: d.concluidos > 0 ? +((d.fechou / d.concluidos) * 100).toFixed(1) : 0,
        volume: d.total,
      }));
  }, [records]);

  // 3. Distribuicao de Status (Donut)
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = { 'Concluido (Closer)': 0, 'Sem Interesse': 0, 'NoShow': 0, 'Agendado': 0 };
    records.forEach(r => {
      const s = (r.status || '').toLowerCase();
      if (s.includes('conclu')) counts['Concluido (Closer)']++;
      else if (s.includes('sem interesse') || s.includes('finalizado')) counts['Sem Interesse']++;
      else if (s.includes('noshow') || s.includes('no show')) counts['NoShow']++;
      else counts['Agendado']++;
    });
    const colorMap: Record<string, string> = {
      'Concluido (Closer)': COLORS.green,
      'Sem Interesse': COLORS.red,
      'NoShow': COLORS.yellow,
      'Agendado': COLORS.zinc,
    };
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value, fill: colorMap[name] }));
  }, [records]);

  // 4. Performance por Consultor (stacked)
  const consultorChartData = useMemo(() => {
    const grouped: Record<string, { concluido: number; semInteresse: number; noshow: number }> = {};
    records.forEach(r => {
      const c = r.consultor || 'N/A';
      if (!grouped[c]) grouped[c] = { concluido: 0, semInteresse: 0, noshow: 0 };
      const s = (r.status || '').toLowerCase();
      if (s.includes('conclu')) grouped[c].concluido++;
      else if (s.includes('sem interesse') || s.includes('finalizado')) grouped[c].semInteresse++;
      else if (s.includes('noshow') || s.includes('no show')) grouped[c].noshow++;
    });
    return Object.entries(grouped)
      .map(([name, d]) => ({ name, ...d, total: d.concluido + d.semInteresse + d.noshow }))
      .sort((a, b) => b.total - a.total);
  }, [records]);

  // 5. Performance por Closer
  const closerChartData = useMemo(() => {
    const grouped: Record<string, { sim: number; nao: number }> = {};
    records.filter(r => (r.status || '').includes('Conclu')).forEach(r => {
      const c = r.closer || 'N/A';
      if (!grouped[c]) grouped[c] = { sim: 0, nao: 0 };
      if ((r.fechou || '').toLowerCase() === 'sim') grouped[c].sim++;
      else grouped[c].nao++;
    });
    return Object.entries(grouped)
      .map(([name, d]) => ({
        name,
        sim: d.sim,
        nao: d.nao,
        taxa: d.sim + d.nao > 0 ? +((d.sim / (d.sim + d.nao)) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => (b.sim + b.nao) - (a.sim + a.nao));
  }, [records]);

  // 6. Volume por Mes (barras agrupadas por status)
  const volumeByMonth = useMemo(() => {
    const grouped: Record<string, { concluido: number; semInteresse: number; noshow: number; agendado: number }> = {};
    records.forEach(r => {
      const ym = getYearMonth(r.data_agendamento);
      if (!ym) return;
      if (!grouped[ym]) grouped[ym] = { concluido: 0, semInteresse: 0, noshow: 0, agendado: 0 };
      const s = (r.status || '').toLowerCase();
      if (s.includes('conclu')) grouped[ym].concluido++;
      else if (s.includes('sem interesse') || s.includes('finalizado')) grouped[ym].semInteresse++;
      else if (s.includes('noshow') || s.includes('no show')) grouped[ym].noshow++;
      else grouped[ym].agendado++;
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, d]) => ({ month: shortMonth(ym), ...d }));
  }, [records]);

  // 7. Tempo Medio (Agendamento -> Analise) por Consultor
  const tempoAgendamentoAnalise = useMemo(() => {
    const grouped: Record<string, number[]> = {};
    records.forEach(r => {
      if (!r.data_agendamento || !r.data_analise) return;
      const c = r.consultor || 'N/A';
      const diff = (new Date(r.data_analise).getTime() - new Date(r.data_agendamento).getTime()) / (1000 * 60 * 60 * 24);
      if (diff < 0) return;
      if (!grouped[c]) grouped[c] = [];
      grouped[c].push(diff);
    });
    return Object.entries(grouped)
      .map(([name, days]) => {
        const avg = +(days.reduce((a, b) => a + b, 0) / days.length).toFixed(1);
        return { name, dias: avg, fill: avg <= 2 ? COLORS.lime : avg <= 5 ? COLORS.yellow : COLORS.red };
      })
      .sort((a, b) => a.dias - b.dias);
  }, [records]);

  // 8. Tempo Medio (Analise -> Call) por Closer
  const tempoAnaliseCall = useMemo(() => {
    const grouped: Record<string, number[]> = {};
    records.forEach(r => {
      if (!r.data_analise || !r.data_call_fechamento) return;
      const c = r.closer || 'N/A';
      const diff = (new Date(r.data_call_fechamento).getTime() - new Date(r.data_analise).getTime()) / (1000 * 60 * 60 * 24);
      if (diff < 0) return;
      if (!grouped[c]) grouped[c] = [];
      grouped[c].push(diff);
    });
    return Object.entries(grouped)
      .map(([name, days]) => {
        const avg = +(days.reduce((a, b) => a + b, 0) / days.length).toFixed(1);
        return { name, dias: avg, fill: avg <= 2 ? COLORS.lime : avg <= 5 ? COLORS.yellow : COLORS.red };
      })
      .sort((a, b) => a.dias - b.dias);
  }, [records]);

  // 9. Taxa de NoShow por Mes
  const noshowByMonth = useMemo(() => {
    const grouped: Record<string, { total: number; noshow: number }> = {};
    records.forEach(r => {
      const ym = getYearMonth(r.data_agendamento);
      if (!ym) return;
      if (!grouped[ym]) grouped[ym] = { total: 0, noshow: 0 };
      grouped[ym].total++;
      const s = (r.status || '').toLowerCase();
      if (s.includes('noshow') || s.includes('no show')) grouped[ym].noshow++;
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, d]) => ({
        month: shortMonth(ym),
        taxa: d.total > 0 ? +((d.noshow / d.total) * 100).toFixed(1) : 0,
      }));
  }, [records]);

  // 10. Ranking de Consultores (taxa conversao)
  const consultorRanking = useMemo(() => {
    const grouped: Record<string, { total: number; concluido: number }> = {};
    records.forEach(r => {
      const c = r.consultor || 'N/A';
      if (!grouped[c]) grouped[c] = { total: 0, concluido: 0 };
      grouped[c].total++;
      if ((r.status || '').includes('Conclu')) grouped[c].concluido++;
    });
    return Object.entries(grouped)
      .map(([name, d]) => ({
        name,
        taxa: d.total > 0 ? +((d.concluido / d.total) * 100).toFixed(1) : 0,
        total: d.total,
      }))
      .sort((a, b) => b.taxa - a.taxa);
  }, [records]);

  // ── Chart card wrapper ────────────────────────────────────────
  const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-xl border border-[#222222] bg-[#111111] p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500 mb-4">{title}</p>
      <div className="h-[280px]">{children}</div>
    </div>
  );

  const selectCls = 'rounded-xl border border-[#222222] bg-[#111111] px-3 py-2 text-[12px] font-bold text-white outline-none focus:border-lime-400/30 transition-colors [color-scheme:dark] cursor-pointer';
  const th = 'py-3 px-4 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-600';
  const td = 'py-3 px-4 text-[13px]';


  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <ClipboardCheck size={20} className="text-lime-400" />
            <h1 className="text-xl font-extrabold text-white">Acompanhamento Analises</h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Analises de contas — consultores e closers</p>
        </div>
        <a
          href="/analise-contas/lancamento"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl bg-lime-400/10 border border-lime-400/20 px-5 py-2.5 text-[12px] font-extrabold text-lime-400 hover:bg-lime-400/15 transition-all cursor-pointer tracking-wide"
        >
          <ExternalLink size={15} /> Lancar Analise
        </a>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <Filter size={14} className="text-zinc-600" />
        <select value={filterMes} onChange={e => setFilterMes(e.target.value)} className={selectCls}>
          <option value="">Todos os meses</option>
          {uniqueMeses.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterConsultor} onChange={e => setFilterConsultor(e.target.value)} className={selectCls}>
          <option value="">Todos consultores</option>
          {uniqueConsultores.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterCloser} onChange={e => setFilterCloser(e.target.value)} className={selectCls}>
          <option value="">Todos closers</option>
          {uniqueClosers.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
          <option value="">Todos status</option>
          {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={fetchData} className="rounded-xl p-2.5 text-zinc-600 hover:text-lime-400 hover:bg-lime-400/5 transition-all cursor-pointer">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={28} className="animate-spin text-lime-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Carregando</span>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="rounded-xl border border-[#222222] bg-[#111111] p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users size={14} className="text-zinc-500" />
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-500">Total Analises</p>
              </div>
              <p className="text-2xl font-extrabold text-white">{total}</p>
            </div>
            <div className="rounded-xl border border-[#222222] bg-[#111111] p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <UserCheck size={14} className="text-green-500" />
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-500">Concluidas (Closer)</p>
              </div>
              <p className="text-2xl font-extrabold text-green-500">{concluidos.length}</p>
              <p className="text-[10px] text-zinc-600 mt-1">{total > 0 ? ((concluidos.length / total) * 100).toFixed(1) : '0.0'}%</p>
            </div>
            <div className="rounded-xl border border-[#222222] bg-[#111111] p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <UserX size={14} className="text-red-500" />
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-500">Sem Interesse</p>
              </div>
              <p className="text-2xl font-extrabold text-red-500">{semInteresse.length}</p>
              <p className="text-[10px] text-zinc-600 mt-1">{total > 0 ? ((semInteresse.length / total) * 100).toFixed(1) : '0.0'}%</p>
            </div>
            <div className="rounded-xl border border-[#222222] bg-[#111111] p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-yellow-500" />
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-500">NoShow</p>
              </div>
              <p className="text-2xl font-extrabold text-yellow-500">{noshow.length}</p>
              <p className="text-[10px] text-zinc-600 mt-1">{total > 0 ? ((noshow.length / total) * 100).toFixed(1) : '0.0'}%</p>
            </div>
            <div className="rounded-xl border border-[#222222] bg-[#111111] p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp size={14} className="text-lime-400" />
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-500">Taxa Fechamento</p>
              </div>
              <p className="text-2xl font-extrabold text-lime-400">{taxaFechamento}%</p>
              <p className="text-[10px] text-zinc-600 mt-1">{fechouSim.length} de {concluidos.length}</p>
            </div>
          </div>

          {/* Consultor Stats */}
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-3">Por Consultor</p>
            <div className="rounded-xl border border-[#222222] bg-[#111111] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #222222' }}>
                    <th className={`text-left ${th}`}>Consultor</th>
                    <th className={`text-center ${th}`}>Total</th>
                    <th className={`text-center ${th}`}>Concluidas</th>
                    <th className={`text-center ${th}`}>Sem Interesse</th>
                    <th className={`text-center ${th}`}>NoShow</th>
                    <th className={`text-center ${th}`}>Taxa Conversao</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(consultorStats).sort((a, b) => b[1].total - a[1].total).map(([name, stats]) => (
                    <tr key={name} style={{ borderBottom: '1px solid #222222' }} className="hover:bg-white/[0.02] transition-colors">
                      <td className={`${td} font-extrabold text-white`}>{name}</td>
                      <td className={`${td} text-center font-semibold text-zinc-300`}>{stats.total}</td>
                      <td className={`${td} text-center font-semibold text-green-500`}>{stats.concluido}</td>
                      <td className={`${td} text-center font-semibold text-red-500`}>{stats.semInteresse}</td>
                      <td className={`${td} text-center font-semibold text-yellow-500`}>{stats.noshow}</td>
                      <td className={`${td} text-center font-bold text-lime-400`}>
                        {stats.total > 0 ? ((stats.concluido / stats.total) * 100).toFixed(1) : '0.0'}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Closer Stats */}
          {Object.keys(closerStats).length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 mb-3">Por Closer</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(closerStats).sort((a, b) => b[1].total - a[1].total).map(([name, stats]) => (
                  <div key={name} className="rounded-xl border border-[#222222] bg-[#111111] p-4">
                    <p className="text-sm font-extrabold text-white mb-3">{name}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[10px] text-zinc-500 uppercase">Total Calls</span>
                        <span className="text-sm font-bold text-zinc-300">{stats.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-zinc-500 uppercase">Fechou Sim</span>
                        <span className="text-sm font-bold text-green-500">{stats.sim}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-zinc-500 uppercase">Fechou Nao</span>
                        <span className="text-sm font-bold text-red-500">{stats.nao}</span>
                      </div>
                      <div className="flex justify-between pt-1" style={{ borderTop: '1px solid #222222' }}>
                        <span className="text-[10px] text-zinc-500 uppercase">Taxa Conversao</span>
                        <span className="text-sm font-extrabold text-lime-400">
                          {stats.total > 0 ? ((stats.sim / stats.total) * 100).toFixed(1) : '0.0'}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Charts Section ──────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

            {/* 1. Funil de Conversao */}
            <ChartCard title="Funil de Conversao">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" horizontal={false} />
                  <XAxis type="number" tick={axisTickStyle} />
                  <YAxis type="category" dataKey="name" tick={axisTickStyle} width={130} />
                  <Tooltip {...tooltipStyle} formatter={(value: any, _name: any, props: any) => [`${value} (${props.payload.pct}%)`, 'Quantidade']} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {funnelData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 3. Distribuicao de Status (Donut) */}
            <ChartCard title="Distribuicao de Status">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value, percent }: any) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {statusDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 2. Taxa de Fechamento por Mes */}
            <ChartCard title="Taxa de Fechamento por Mes">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={closingRateByMonth} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                  <XAxis dataKey="month" tick={axisTickStyle} />
                  <YAxis yAxisId="left" tick={axisTickStyle} unit="%" />
                  <YAxis yAxisId="right" orientation="right" tick={axisTickStyle} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#A3A3A3' }} />
                  <Bar yAxisId="right" dataKey="volume" name="Volume" fill={COLORS.zinc} opacity={0.3} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="left" type="monotone" dataKey="taxa" name="Taxa (%)" stroke={COLORS.lime} strokeWidth={2} dot={{ fill: COLORS.lime, r: 4 }} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 6. Volume por Mes */}
            <ChartCard title="Volume por Mes">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={volumeByMonth} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                  <XAxis dataKey="month" tick={axisTickStyle} />
                  <YAxis tick={axisTickStyle} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#A3A3A3' }} />
                  <Bar dataKey="concluido" name="Concluido" fill={COLORS.green} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="semInteresse" name="Sem Interesse" fill={COLORS.red} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="noshow" name="NoShow" fill={COLORS.yellow} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="agendado" name="Agendado" fill={COLORS.zinc} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 4. Performance por Consultor (stacked) */}
            <ChartCard title="Performance por Consultor">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={consultorChartData} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                  <XAxis dataKey="name" tick={axisTickStyle} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={axisTickStyle} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#A3A3A3' }} />
                  <Bar dataKey="concluido" name="Concluido" stackId="a" fill={COLORS.green} />
                  <Bar dataKey="semInteresse" name="Sem Interesse" stackId="a" fill={COLORS.red} />
                  <Bar dataKey="noshow" name="NoShow" stackId="a" fill={COLORS.yellow} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 5. Performance por Closer */}
            <ChartCard title="Performance por Closer">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={closerChartData} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                  <XAxis dataKey="name" tick={axisTickStyle} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={axisTickStyle} />
                  <Tooltip {...tooltipStyle} formatter={(value: any, name: any) => [value, name]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#A3A3A3' }} />
                  <Bar dataKey="sim" name="Fechou Sim" fill={COLORS.green} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="nao" name="Fechou Nao" fill={COLORS.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 7. Tempo Medio Agendamento -> Analise por Consultor */}
            <ChartCard title="Tempo Medio Agendamento → Analise (dias)">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={tempoAgendamentoAnalise} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" horizontal={false} />
                  <XAxis type="number" tick={axisTickStyle} unit=" d" />
                  <YAxis type="category" dataKey="name" tick={axisTickStyle} width={100} />
                  <Tooltip {...tooltipStyle} formatter={(value: any) => [`${value} dias`, 'Tempo Medio']} />
                  <Bar dataKey="dias" radius={[0, 6, 6, 0]}>
                    {tempoAgendamentoAnalise.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 8. Tempo Medio Analise -> Call por Closer */}
            <ChartCard title="Tempo Medio Analise → Call (dias)">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={tempoAnaliseCall} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" horizontal={false} />
                  <XAxis type="number" tick={axisTickStyle} unit=" d" />
                  <YAxis type="category" dataKey="name" tick={axisTickStyle} width={100} />
                  <Tooltip {...tooltipStyle} formatter={(value: any) => [`${value} dias`, 'Tempo Medio']} />
                  <Bar dataKey="dias" radius={[0, 6, 6, 0]}>
                    {tempoAnaliseCall.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 9. Taxa de NoShow por Mes */}
            <ChartCard title="Taxa de NoShow por Mes">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={noshowByMonth} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                  <XAxis dataKey="month" tick={axisTickStyle} />
                  <YAxis tick={axisTickStyle} unit="%" />
                  <Tooltip {...tooltipStyle} formatter={(value: any) => [`${value}%`, 'Taxa NoShow']} />
                  <Line type="monotone" dataKey="taxa" stroke={COLORS.yellow} strokeWidth={2} dot={{ fill: COLORS.yellow, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 10. Ranking de Consultores */}
            <ChartCard title="Ranking Consultores (Taxa Conversao)">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={consultorRanking} layout="vertical" margin={{ left: 10, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" horizontal={false} />
                  <XAxis type="number" tick={axisTickStyle} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" tick={axisTickStyle} width={100} />
                  <Tooltip {...tooltipStyle} formatter={(value: any, _name: any, props: any) => [`${value}% (${props.payload.total} analises)`, 'Taxa']} />
                  <Bar dataKey="taxa" fill={COLORS.lime} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

          </div>

          {/* Link to full list */}
          <div className="text-center pt-2">
            <a
              href="/analise-contas/lancamento"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[12px] font-bold text-zinc-500 hover:text-lime-400 transition-colors"
            >
              <ExternalLink size={14} /> Ver todas as analises no Kanban
            </a>
          </div>
        </>
      )}

    </div>
  );
}
