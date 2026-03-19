'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface DailySale {
  day: string
  vendas: number
}

interface SalesChartProps {
  data: DailySale[]
  metaDiaria: number
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-3 py-2 text-sm shadow-lg border"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-color-light)',
        color: 'var(--text-primary)',
      }}
    >
      <p className="font-medium mb-1">Dia {label}</p>
      <p style={{ color: '#10b981' }}>Vendas: {formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function SalesChart({ data, metaDiaria }: SalesChartProps) {
  return (
    <div className="card p-5">
      <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Vendas Diárias
      </h3>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border-color)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            {metaDiaria > 0 && (
              <ReferenceLine
                y={metaDiaria}
                stroke="#f59e0b"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{
                  value: `Meta: ${formatCurrency(metaDiaria)}`,
                  position: 'insideTopRight',
                  fill: '#f59e0b',
                  fontSize: 11,
                }}
              />
            )}
            <Bar dataKey="vendas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
