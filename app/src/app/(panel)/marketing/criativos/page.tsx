'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Stats {
  total: number;
  ao_vivo: number;
  winners: number;
  saturando: number;
}

const SECTIONS = [
  {
    href: '/marketing/criativos/pipeline',
    title: 'Pipeline',
    description: 'Kanban board com todos os criativos por status',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="5" height="18" rx="1" />
        <rect x="10" y="8" width="5" height="13" rx="1" />
        <rect x="17" y="5" width="5" height="16" rx="1" />
      </svg>
    ),
  },
  {
    href: '/marketing/criativos/briefing',
    title: 'Briefing',
    description: 'Criar novos criativos com o framework CRAVE',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    href: '/marketing/criativos/matriz',
    title: 'Matriz',
    description: 'Heatmap de cobertura Angulo x Formato',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: '/marketing/criativos/biblioteca',
    title: 'Biblioteca',
    description: 'Busca e filtragem de todos os criativos',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    href: '/marketing/criativos/performance',
    title: 'Performance',
    description: 'KPIs, alertas e ranking dos criativos ao vivo',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: '/marketing/criativos/inteligencia',
    title: 'Inteligencia',
    description: 'Rankings, insights e sugestoes automaticas',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
  },
];

export default function CriativosOverviewPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, ao_vivo: 0, winners: 0, saturando: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/criativos?limit=500');
      const json = await res.json();
      const data = json.data || [];
      setStats({
        total: data.length,
        ao_vivo: data.filter((c: { status: string }) => ['em_teste', 'winner', 'escala'].includes(c.status)).length,
        winners: data.filter((c: { is_winner: boolean }) => c.is_winner).length,
        saturando: data.filter((c: { status: string }) => c.status === 'saturado').length,
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Gestao de Criativos</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Visao geral do pipeline criativo
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={stats.total} loading={loading} />
        <StatCard label="Ao Vivo" value={stats.ao_vivo} loading={loading} color="var(--accent)" />
        <StatCard label="Winners" value={stats.winners} loading={loading} color="#F59E0B" />
        <StatCard label="Saturando" value={stats.saturando} loading={loading} color="#EF4444" />
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-2xl border p-5 transition-all duration-200 hover:border-[var(--accent)]"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors"
              style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}
            >
              {section.icon}
            </div>
            <h3 className="text-sm font-bold mb-1">{section.title}</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, loading, color }: { label: string; value: number; loading: boolean; color?: string }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      {loading ? (
        <div className="w-10 h-6 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-card-hover)' }} />
      ) : (
        <div className="text-xl font-bold" style={{ color: color || 'var(--text-primary)' }}>
          {value}
        </div>
      )}
    </div>
  );
}
