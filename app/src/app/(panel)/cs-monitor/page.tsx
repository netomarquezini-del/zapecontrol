'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import {
  HeartHandshake,
  MessageSquare,
  Users,
  TrendingUp,
  RefreshCw,
  Loader2,
  Search,
  ChevronRight,
} from 'lucide-react'

interface CsGroup {
  id: string
  name: string
  member_count: number
  last_activity: string | null
  is_active: boolean
}

interface CsMetrics {
  total_groups: number
  messages_today: number
  messages_week: number
  team_messages_today: number
  client_messages_today: number
}

export default function CsMonitorPage() {
  const [metrics, setMetrics] = useState<CsMetrics | null>(null)
  const [groups, setGroups] = useState<CsGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [syncing, setSyncing] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabase()

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - 7)

    const [groupsRes, todayRes, weekRes, teamTodayRes] = await Promise.all([
      supabase.from('cs_groups').select('*').eq('is_active', true).order('last_activity', { ascending: false }),
      supabase.from('cs_messages').select('id', { count: 'exact', head: true }).gte('timestamp', todayStart.toISOString()),
      supabase.from('cs_messages').select('id', { count: 'exact', head: true }).gte('timestamp', weekStart.toISOString()),
      supabase.from('cs_messages').select('id', { count: 'exact', head: true }).eq('is_team_member', true).gte('timestamp', todayStart.toISOString()),
    ])

    setGroups(groupsRes.data ?? [])
    setMetrics({
      total_groups: groupsRes.data?.length ?? 0,
      messages_today: todayRes.count ?? 0,
      messages_week: weekRes.count ?? 0,
      team_messages_today: teamTodayRes.count ?? 0,
      client_messages_today: (todayRes.count ?? 0) - (teamTodayRes.count ?? 0),
    })
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/joana/sync-groups', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        await fetchData()
      }
    } catch (e) {
      console.error('Sync failed:', e)
    }
    setSyncing(false)
  }

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'sem atividade'
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'agora'
    if (hours < 24) return `${hours}h atras`
    const days = Math.floor(hours / 24)
    return `${days}d atras`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/8 border border-lime-400/15">
            <HeartHandshake size={18} className="text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">CS Monitor</h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Joana — Monitoramento de Grupos</p>
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 rounded-xl bg-lime-400/10 border border-lime-400/20 px-5 py-2.5 text-[13px] font-bold text-lime-400 hover:bg-lime-400/15 cursor-pointer disabled:opacity-40 transition-all"
        >
          {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          Sincronizar Grupos
        </button>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-lime-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Grupos Ativos</span>
              </div>
              <p className="text-2xl font-extrabold text-white">{metrics?.total_groups ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Msgs Hoje</span>
              </div>
              <p className="text-2xl font-extrabold text-white">{metrics?.messages_today ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-lime-400" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Equipe Hoje</span>
              </div>
              <p className="text-2xl font-extrabold text-lime-400">{metrics?.team_messages_today ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-5 hover:border-lime-400/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} className="text-zinc-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Msgs Semana</span>
              </div>
              <p className="text-2xl font-extrabold text-white">{metrics?.messages_week ?? 0}</p>
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
              <div className="grid grid-cols-[1fr_120px_120px] gap-4 px-5 py-3 border-b border-[#222222]">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Grupo</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">Ultima Atividade</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 text-right">Status</span>
              </div>
              {filteredGroups.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-[13px] font-semibold text-zinc-600">
                    {groups.length === 0 ? 'Nenhum grupo sincronizado. Clique em "Sincronizar Grupos".' : 'Nenhum grupo encontrado.'}
                  </p>
                </div>
              ) : (
                filteredGroups.map((group) => {
                  const ago = timeAgo(group.last_activity)
                  const isRecent = group.last_activity && (Date.now() - new Date(group.last_activity).getTime()) < 86400000
                  return (
                    <div
                      key={group.id}
                      className="grid grid-cols-[1fr_120px_120px] gap-4 px-5 py-3.5 border-b border-[#1a1a1a] hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${isRecent ? 'bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,0.5)]' : 'bg-zinc-700'}`} />
                        <span className="text-[13px] font-semibold text-white truncate">{group.name}</span>
                      </div>
                      <span className="text-[12px] font-semibold text-zinc-500 text-right self-center">{ago}</span>
                      <div className="flex justify-end self-center">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                          isRecent
                            ? 'text-lime-400 bg-lime-400/8 border-lime-400/15'
                            : 'text-zinc-600 bg-zinc-800/50 border-zinc-700/30'
                        }`}>
                          {isRecent ? 'Ativo' : 'Inativo'}
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
