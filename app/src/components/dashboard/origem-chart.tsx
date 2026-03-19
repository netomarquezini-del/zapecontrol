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
  '#10b981',
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
      className="rounded-lg px-3 py-2 text-sm shadow-lg border"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-color-light)',
        color: 'var(--text-primary)',
      }}
    >
      <p className="font-medium">{item.name}</p>
      <p style={{ color: '#10b981' }}>{formatCurrency(item.value)}</p>
      <p style={{ color: 'var(--text-muted)' }}>{(item.payload.percent * 100).toFixed(1)}%</p>
    </div>
  )
}

function CustomLegend({ payload }: { payload?: { value: string; color: string }[] }) {
  if (!payload) return null
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 justify-center">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="truncate max-w-[120px]">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function OrigemChart({ data }: OrigemChartProps) {
  return (
    <div className="card p-5">
      <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Vendas por Origem
      </h3>
      {data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
          Nenhum dado disponível
        </div>
      ) : (
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
