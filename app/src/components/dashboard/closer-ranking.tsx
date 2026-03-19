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
  if (percent >= 100) return '#10b981'
  if (percent >= 70) return '#f59e0b'
  return '#ef4444'
}

function getStatusBg(percent: number): string {
  if (percent >= 100) return 'rgba(16, 185, 129, 0.1)'
  if (percent >= 70) return 'rgba(245, 158, 11, 0.1)'
  return 'rgba(239, 68, 68, 0.1)'
}

export default function CloserRanking({ data }: CloserRankingProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={18} className="text-amber-400" />
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          Ranking de Closers
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                #
              </th>
              <th className="text-left py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                Closer
              </th>
              <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                Vendas
              </th>
              <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                Meta
              </th>
              <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                % Atingido
              </th>
              <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                Reuniões
              </th>
              <th className="text-right py-3 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                Conversão
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((closer) => {
              const color = getStatusColor(closer.percentAtingido)
              const bg = getStatusBg(closer.percentAtingido)
              return (
                <tr
                  key={closer.position}
                  className="transition-colors duration-150"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="py-3 px-2">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background:
                          closer.position <= 3
                            ? closer.position === 1
                              ? 'rgba(245, 158, 11, 0.2)'
                              : closer.position === 2
                                ? 'rgba(148, 163, 184, 0.2)'
                                : 'rgba(180, 83, 9, 0.2)'
                            : 'var(--border-color)',
                        color:
                          closer.position === 1
                            ? '#f59e0b'
                            : closer.position === 2
                              ? '#94a3b8'
                              : closer.position === 3
                                ? '#b45309'
                                : 'var(--text-muted)',
                      }}
                    >
                      {closer.position}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {closer.name}
                  </td>
                  <td className="py-3 px-2 text-right font-semibold" style={{ color: '#10b981' }}>
                    {formatCurrency(closer.vendas)}
                  </td>
                  <td className="py-3 px-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                    {formatCurrency(closer.meta)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: bg, color }}
                    >
                      {closer.percentAtingido >= 100 ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}
                      {closer.percentAtingido.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                    {closer.reunioes}
                  </td>
                  <td className="py-3 px-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                    {closer.conversao.toFixed(1)}%
                  </td>
                </tr>
              )
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                  Nenhum dado encontrado para este período
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
