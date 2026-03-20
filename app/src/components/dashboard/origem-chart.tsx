'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface OrigemData {
  name: string
  value: number
}

interface OrigemChartProps {
  data: OrigemData[]
}

const COLORS = [
  '#A3E635',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { percent: number } }[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm border backdrop-blur-sm"
      style={{
        background: 'rgba(10, 10, 10, 0.95)',
        borderColor: 'var(--border-color-light)',
        color: 'var(--text-primary)',
      }}
    >
      <p className="font-bold text-[13px] mb-1">{item.name}</p>
      <p className="font-extrabold" style={{ color: '#A3E635' }}>{formatCurrency(item.value)}</p>
      <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{(item.payload.percent * 100).toFixed(1)}%</p>
    </div>
  )
}

function CustomLegend({ payload }: { payload?: { value: string; color: string }[] }) {
  if (!payload) return null
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 justify-center">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="truncate max-w-[120px]">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function OrigemChart({ data }: OrigemChartProps) {
  return (
    <div className="card p-6">
      <h3 className="text-sm font-bold uppercase tracking-wider mb-6" style={{ color: 'var(--text-secondary)' }}>
        Vendas por Origem
      </h3>
      {data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
          Nenhum dado disponivel
        </div>
      ) : (
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={65}
                outerRadius={105}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.85} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
