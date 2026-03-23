'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import {
  Activity,
  Loader2,
  Search,
  AlertTriangle,
  CheckCircle,
  Users,
} from 'lucide-react'

interface CsGroup {
  id: string
  name: string
  last_activity: string | null
  is_active: boolean
}

interface HealthScore {
  group_id: string
  score: number
  calculated_at: string
}

interface GroupWithScore extends CsGroup {
  score: number | null
  calculated_at: string | null
}

export default function CsHealthScorePage() {
  const [groups, setGroups] = useState<GroupWithScore[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabase()

    const [groupsRes, scoresRes] = await Promise.all([
      supabase.from('cs_groups').select('*').eq('is_active', true).order('name', { ascending: true }),
      supabase.from('cs_health_scores').select('group_id, score, calculated_at').order('calculated_at', { ascending: false }),
    ])

    const groupsList: CsGroup[] = groupsRes.data ?? []
    const scoresList: HealthScore[] = scoresRes.data ?? []

    // Build a map of latest score per group
    const latestScores = new Map<string, HealthScore>()
    for (const s of scoresList) {
      if (!latestScores.has(s.group_id)) {
        latestScores.set(s.group_id, s)
      }
    }

    // Merge groups with scores
    const merged: GroupWithScore[] = groupsList.map((g) => {
      const s = latestScores.get(g.id)
      return {
        ...g,
        score: s?.score ?? null,
        calculated_at: s?.calculated_at ?? null,
      }
    })

    setGroups(merged)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  const avgScore = groups.filter(g => g.score !== null).length > 0
    ? Math.round(groups.filter(g => g.score !== null).reduce((acc, g) => acc + (g.score ?? 0), 0) / groups.filter(g => g.score !== null).length)
    : null

  const atRisk = groups.filter(g => g.score !== null && g.score < 50).length
  const healthy = groups.filter(g => g.score !== null && g.score > 70).length

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'sem atividade'
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'agora'
    if (hours < 24) return `${hours}h atras`
    const days = Math.floor(hours / 24)
    return `${days}d atras`
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-zinc-600'
    if (score > 70) return 'text-lime-400'
    if (score > 50) return 'text-yellow-400'
    if (score > 30) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreBarColor = (score: number | null) => {
    if (score === null) return 'bg-zinc-800'
    if (score > 70) return 'bg-lime-400'
    if (score > 50) return 'bg-yellow-400'
    if (score > 30) return 'bg-orange-400'
    return 'bg-red-400'
  }

  const getScoreBadge = (score: number | null) => {
    if (score === null) return { label: 'Sem score', cls: 'text-zinc-600 bg-zinc-800/50 border-zinc-700/30' }
    if (score > 70) return { label: 'Saudavel', cls: 'text-lime-400 bg-lime-400/8 border-lime-400/15' }
    if (score > 50) return { label: 'Atencao', cls: 'text-yellow-400 bg-yellow-400/8 border-yellow-400/15' }
    if (score > 30) return { label: 'Risco', cls: 'text-orange-400 bg-orange-400/8 border-orange-400/15' }
    return { label: 'Critico', cls: 'text-red-400 bg-red-400/8 border-red-400/15' }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/8 border border-lime-400/15">
            <Activity size={18} className="text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Health Score</h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Joana — Saude dos Clientes</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-lime-400" />
        </div>
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Score Medio</span>
              </div>
              <p className={`text-2xl font-extrabold ${avgScore !== null ? getScoreColor(avgScore) : 'text-zinc-600'}`}>
                {avgScore !== null ? avgScore : '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Em Risco (&lt;50)</span>
              </div>
              <p className={`text-2xl font-extrabold ${atRisk > 0 ? 'text-red-400' : 'text-zinc-600'}`}>{atRisk}</p>
            </div>
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={14} className="text-lime-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Saudaveis (&gt;70)</span>
              </div>
              <p className="text-2xl font-extrabold text-lime-400">{healthy}</p>
            </div>
          </div>

          {/* Groups List */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-extrabold text-white">Grupos</h2>
              <span className="text-[11px] font-bold text-zinc-600">{filteredGroups.length} grupos</span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar grupo..."
                className="w-full rounded-xl border border-[#222222] bg-[#111111] pl-11 pr-4 py-3 text-[13px] font-semibold text-white placeholder-zinc-700 outline-none focus:border-lime-400/30 transition-colors"
              />
            </div>

            {/* Groups Table */}
            <div className="rounded-2xl border border-[#222222] bg-[#111111] overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_140px_100px_100px] gap-4 px-5 py-3 border-b border-[#222222]">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Grupo</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">Score</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Barra</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">Atividade</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">Status</span>
              </div>
              {filteredGroups.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-[13px] font-semibold text-zinc-600">
                    {groups.length === 0 ? 'Nenhum grupo encontrado.' : 'Nenhum grupo encontrado para esta busca.'}
                  </p>
                </div>
              ) : (
                filteredGroups.map((group) => {
                  const badge = getScoreBadge(group.score)
                  return (
                    <div
                      key={group.id}
                      className="grid grid-cols-[1fr_80px_140px_100px_100px] gap-4 px-5 py-3.5 border-b border-[#1a1a1a] hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${group.score !== null && group.score > 70 ? 'bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,0.5)]' : group.score !== null && group.score > 50 ? 'bg-yellow-400' : group.score !== null && group.score > 30 ? 'bg-orange-400' : group.score !== null ? 'bg-red-400' : 'bg-zinc-700'}`} />
                        <span className="text-[13px] font-semibold text-white truncate">{group.name}</span>
                      </div>
                      <div className="flex items-center justify-end">
                        {group.score !== null ? (
                          <span className={`text-[14px] font-extrabold ${getScoreColor(group.score)}`}>{group.score}</span>
                        ) : (
                          <span className="text-[11px] font-semibold text-zinc-600">N/A</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                          {group.score !== null && (
                            <div
                              className={`h-full rounded-full ${getScoreBarColor(group.score)} transition-all`}
                              style={{ width: `${group.score}%` }}
                            />
                          )}
                        </div>
                      </div>
                      <span className="text-[12px] font-semibold text-zinc-500 text-right self-center">{timeAgo(group.last_activity)}</span>
                      <div className="flex justify-end self-center">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
