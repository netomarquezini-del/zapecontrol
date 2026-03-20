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
      className="rounded-xl px-4 py-3 text-sm border backdrop-blur-sm"
      style={{
        background: 'rgba(10, 10, 10, 0.95)',
        borderColor: 'var(--border-color-light)',
        color: 'var(--text-primary)',
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Dia {label}</p>
      <p className="text-base font-extrabold" style={{ color: '#A3E635' }}>{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function SalesChart({ data, metaDiaria }: SalesChartProps) {
  return (
    <div className="card p-6">
      <h3 className="text-sm font-bold uppercase tracking-wider mb-6" style={{ color: 'var(--text-secondary)' }}>
        Vendas Diarias
      </h3>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(163, 230, 53, 0.03)' }} />
            {metaDiaria > 0 && (
              <ReferenceLine
                y={metaDiaria}
                stroke="rgba(245, 158, 11, 0.6)"
                strokeDasharray="6 4"
                strokeWidth={1}
                label={{
                  value: `Meta: ${formatCurrency(metaDiaria)}`,
                  position: 'insideTopRight',
                  fill: '#f59e0b',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
            )}
            <Bar dataKey="vendas" fill="#A3E635" radius={[6, 6, 0, 0]} maxBarSize={28} fillOpacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
