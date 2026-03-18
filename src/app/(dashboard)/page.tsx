'use client'

import { useState } from 'react'
import { useFetch } from '@/hooks/use-fetch'
import { DashboardStats, ProductionChartData, ProductRanking } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getGoalIndicator } from '@/lib/scoring'
import { Factory, TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'

export default function DashboardPage() {
  const [days, setDays] = useState('7')

  const { data: stats, loading: statsLoading } = useFetch<DashboardStats>('/api/dashboard/stats')
  const { data: chartData } = useFetch<ProductionChartData[]>(`/api/dashboard/production-chart?days=${days}`)
  const { data: ranking } = useFetch<ProductRanking[]>(`/api/dashboard/ranking?days=${days}`)

  const goalIndicator = stats ? getGoalIndicator(stats.todayPercentage) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="14">Últimos 14 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Produção Hoje</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayQuantity || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.todayPoints || 0} pontos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Meta Hoje</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {stats?.todayPercentage !== null ? `${stats?.todayPercentage}%` : '—'}
              </span>
              {goalIndicator && <span>{goalIndicator.emoji}</span>}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.todayGoal ? `Meta: ${stats.todayGoal} pontos` : 'Sem meta definida'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Semana</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.weekQuantity || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.weekPoints || 0} pontos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">vs Semana Anterior</CardTitle>
            {(stats?.weekComparison || 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.weekComparison || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats?.weekComparison != null ? `${stats.weekComparison > 0 ? '+' : ''}${stats.weekComparison}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground">Comparativo em pontos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Produção Diária (Quantidade)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(d) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')}
                />
                <Bar dataKey="quantity" fill="hsl(221, 83%, 53%)" name="Quantidade" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pontos vs Meta</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(d) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')}
                />
                <Legend />
                <Line type="monotone" dataKey="points" stroke="hsl(221, 83%, 53%)" name="Pontos" strokeWidth={2} />
                {chartData?.[0]?.goal && (
                  <ReferenceLine y={chartData[0].goal} stroke="red" strokeDasharray="5 5" label="Meta" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Product Ranking */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          {ranking?.length ? (
            <div className="space-y-3">
              {ranking.map((item, index) => (
                <div key={item.product_id} className="flex items-center gap-4">
                  <span className="text-lg font-bold text-muted-foreground w-8">#{index + 1}</span>
                  {item.photo_url ? (
                    <img src={item.photo_url} alt="" className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {item.product_sku}</p>
                  </div>
                  <Badge variant="secondary">
                    {item.product_type === 'embalado' ? '📦' : '📋'} {item.product_type}
                  </Badge>
                  <div className="text-right">
                    <p className="font-bold">{item.total_points} pts</p>
                    <p className="text-xs text-muted-foreground">{item.total_quantity} un.</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum dado de produção no período</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
