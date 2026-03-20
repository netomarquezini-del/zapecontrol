'use client'

import { Trophy, TrendingUp, TrendingDown } from 'lucide-react'

interface CloserData {
  position: number
  name: string
  vendas: number
  meta: number
  percentAtingido: number
  reunioes: number
  conversao: number
}

interface CloserRankingProps {
  data: CloserData[]
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

function getStatusColor(percent: number): string {
  if (percent >= 100) return '#A3E635'
  if (percent >= 70) return '#f59e0b'
  return '#ef4444'
}

function getStatusBg(percent: number): string {
  if (percent >= 100) return 'rgba(163, 230, 53, 0.08)'
  if (percent >= 70) return 'rgba(245, 158, 11, 0.08)'
  return 'rgba(239, 68, 68, 0.08)'
}

function getPositionStyle(pos: number) {
  if (pos === 1) return { bg: 'rgba(163, 230, 53, 0.12)', color: '#A3E635', border: 'rgba(163, 230, 53, 0.2)' }
  if (pos === 2) return { bg: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.15)' }
  if (pos === 3) return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.15)' }
  return { bg: 'var(--border-color)', color: 'var(--text-muted)', border: 'transparent' }
}

export default function CloserRanking({ data }: CloserRankingProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-400/8 border border-amber-400/15">
          <Trophy size={15} className="text-amber-400" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          Ranking de Closers
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th className="text-left py-3 px-3 text-label">#</th>
              <th className="text-left py-3 px-3 text-label">Closer</th>
              <th className="text-right py-3 px-3 text-label">Meta</th>
              <th className="text-right py-3 px-3 text-label">Vendas</th>
              <th className="text-right py-3 px-3 text-label">% Atingido</th>
              <th className="text-right py-3 px-3 text-label">Reunioes</th>
              <th className="text-right py-3 px-3 text-label">Conversao</th>
            </tr>
          </thead>
          <tbody>
            {data.map((closer) => {
              const color = getStatusColor(closer.percentAtingido)
              const bg = getStatusBg(closer.percentAtingido)
              const posStyle = getPositionStyle(closer.position)
              return (
                <tr
                  key={closer.position}
                  className="transition-all duration-200 group/row"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="py-3.5 px-3">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold"
                      style={{
                        background: posStyle.bg,
                        color: posStyle.color,
                        border: `1px solid ${posStyle.border}`,
                      }}
                    >
                      {closer.position}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-bold" style={{ color: 'var(--text-primary)' }}>
                    {closer.name}
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(closer.meta)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-extrabold" style={{ color: '#A3E635' }}>
                    {formatCurrency(closer.vendas)}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                      style={{ background: bg, color }}
                    >
                      {closer.percentAtingido >= 100 ? (
                        <TrendingUp size={11} />
                      ) : (
                        <TrendingDown size={11} />
                      )}
                      {closer.percentAtingido.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {closer.reunioes}
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {closer.conversao.toFixed(1)}%
                  </td>
                </tr>
              )
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                  Nenhum dado encontrado para este periodo
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
