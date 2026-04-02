'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search,
  RefreshCw,
  ChevronLeft,
  X,
  Bot,
  FileText,
  Workflow,
  CheckSquare,
  Clock,
  BookOpen,
  Dna,
  Terminal,
  Loader2,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface EcosystemAgent {
  id: string
  name: string
  icon: string
  title: string
  role: string
  squad: string
  commands?: { name: string; description: string }[]
  templates?: { name: string; description: string }[]
  tasks?: { name: string; description: string }[]
  workflows?: { name: string; description: string }[]
  checklists?: { name: string; description: string }[]
  crons?: { name: string; file: string }[]
  kbs?: { name: string; description: string }[]
  dna?: { name: string; description: string }[]
}

interface EcosystemSquad {
  id: string
  name: string
  icon: string
  description: string
  agents: EcosystemAgent[]
  templates?: { name: string; description: string }[]
  tasks?: { name: string; description: string }[]
  workflows?: { name: string; description: string }[]
  checklists?: { name: string; description: string }[]
  crons?: { name: string; file: string }[]
}

interface EcosystemData {
  squads: EcosystemSquad[]
  generated_at: string
  stats: {
    squads: number
    agents: number
    templates: number
    tasks: number
    workflows: number
    checklists: number
    crons: number
  }
}

type TabKey = 'agents' | 'templates' | 'tasks' | 'workflows' | 'checklists' | 'crons'

const TAB_CONFIG: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'agents', label: 'Agentes', icon: <Bot className="w-3.5 h-3.5" /> },
  { key: 'templates', label: 'Templates', icon: <FileText className="w-3.5 h-3.5" /> },
  { key: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-3.5 h-3.5" /> },
  { key: 'workflows', label: 'Workflows', icon: <Workflow className="w-3.5 h-3.5" /> },
  { key: 'checklists', label: 'Checklists', icon: <CheckSquare className="w-3.5 h-3.5" /> },
  { key: 'crons', label: 'Crons', icon: <Clock className="w-3.5 h-3.5" /> },
]

function getSquadResourceCount(squad: EcosystemSquad, key: TabKey): number {
  if (key === 'agents') return squad.agents?.length ?? 0
  const squadLevel = (squad[key] as unknown[])?.length ?? 0
  const agentLevel = squad.agents?.reduce((sum, a) => sum + ((a[key] as unknown[])?.length ?? 0), 0) ?? 0
  return squadLevel + agentLevel
}

export default function EcosystemPage() {
  const [data, setData] = useState<EcosystemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedSquad, setSelectedSquad] = useState<EcosystemSquad | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('agents')
  const [selectedAgent, setSelectedAgent] = useState<EcosystemAgent | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(false)
      const res = await fetch('/api/ecosystem')
      if (!res.ok) throw new Error('Failed to fetch')
      const d = await res.json()
      setData(d)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setQuery('')
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetch('/api/ecosystem', { method: 'POST' })
      await fetchData()
    } catch {
      // silently fail
    } finally {
      setRefreshing(false)
    }
  }

  const openAgentModal = (agent: EcosystemAgent) => {
    setSelectedAgent(agent)
    setTimeout(() => setModalVisible(true), 10)
  }

  const closeAgentModal = () => {
    setModalVisible(false)
    setTimeout(() => setSelectedAgent(null), 300)
  }

  // Search logic
  const searchResults = query.trim().length > 1 ? getSearchResults(data, query) : null

  // Stats
  const stats = data?.stats ?? { squads: 0, agents: 0, templates: 0, tasks: 0, workflows: 0, checklists: 0, crons: 0 }

  const statItems = [
    { label: 'Squads', value: stats.squads },
    { label: 'Agentes', value: stats.agents },
    { label: 'Templates', value: stats.templates },
    { label: 'Tasks', value: stats.tasks },
    { label: 'Workflows', value: stats.workflows },
    { label: 'Checklists', value: stats.checklists },
    { label: 'Crons', value: stats.crons },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display text-2xl md:text-3xl text-white flex items-center gap-3">
            <span className="text-3xl">🧬</span> Ecosystem
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Visao completa de todos os agentes, squads e recursos
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data?.generated_at && (
            <span className="text-label text-[var(--text-muted)]">
              Gerado em: {new Date(data.generated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="card flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent-border)] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
          {statItems.map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <div className="text-2xl font-bold text-lime-400">{s.value}</div>
              <div className="text-label mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar agentes, squads, templates..."
          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl pl-11 pr-10 py-3 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-border)] transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {!query && (
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] border border-[var(--border-color)] rounded px-1.5 py-0.5 font-mono">
            /
          </kbd>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-[#111] rounded-2xl h-48" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-[var(--text-muted)] text-sm">Erro ao carregar dados</p>
          <button
            onClick={fetchData}
            className="card px-4 py-2 text-sm text-lime-400 hover:border-lime-400/20 transition-colors cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Search Results */}
      {!loading && !error && searchResults && (
        <SearchResultsView
          results={searchResults}
          query={query}
          onSquadClick={(squad) => {
            setQuery('')
            setSelectedSquad(squad)
            setActiveTab('agents')
          }}
          onAgentClick={(agent) => openAgentModal(agent)}
        />
      )}

      {/* Main Content */}
      {!loading && !error && !searchResults && (
        <>
          {/* Squad Detail View */}
          {selectedSquad ? (
            <SquadDetailView
              squad={selectedSquad}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onBack={() => setSelectedSquad(null)}
              onAgentClick={openAgentModal}
            />
          ) : (
            /* Squad Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data?.squads?.map((squad) => (
                <button
                  key={squad.id}
                  onClick={() => {
                    setSelectedSquad(squad)
                    setActiveTab('agents')
                  }}
                  className="card p-5 text-left hover:border-lime-400/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{squad.icon || '📦'}</span>
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-lime-400 transition-colors">
                          {squad.name}
                        </h3>
                      </div>
                    </div>
                    <span className="bg-lime-400/10 text-lime-400 text-xs font-bold px-2 py-0.5 rounded-full">
                      {squad.agents?.length ?? 0} agentes
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm line-clamp-2 mb-4">
                    {squad.description || 'Sem descricao'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(['templates', 'tasks', 'workflows', 'checklists', 'crons'] as TabKey[]).map((key) => {
                      const count = getSquadResourceCount(squad, key)
                      if (count === 0) return null
                      return (
                        <span
                          key={key}
                          className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full px-2 py-0.5"
                        >
                          {count} {key}
                        </span>
                      )
                    })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          visible={modalVisible}
          onClose={closeAgentModal}
        />
      )}
    </div>
  )
}

/* ─── Squad Detail View ─── */

function SquadDetailView({
  squad,
  activeTab,
  onTabChange,
  onBack,
  onAgentClick,
}: {
  squad: EcosystemSquad
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  onBack: () => void
  onAgentClick: (agent: EcosystemAgent) => void
}) {
  const availableTabs = TAB_CONFIG.filter((t) => getSquadResourceCount(squad, t.key) > 0)

  // Reset to first available tab if current is empty
  useEffect(() => {
    if (!availableTabs.find((t) => t.key === activeTab) && availableTabs.length > 0) {
      onTabChange(availableTabs[0].key)
    }
  }, [squad.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Merge squad-level and agent-level resources for a tab
  type ResourceItem = { name: string; description?: string; file?: string; _agent?: string }
  const getResources = (key: TabKey): EcosystemAgent[] | ResourceItem[] => {
    if (key === 'agents') return squad.agents ?? []
    const squadItems = (squad[key] as ResourceItem[]) ?? []
    const agentItems = squad.agents?.flatMap(
      (a) => ((a[key] as ResourceItem[]) ?? []).map((item) => ({ ...item, _agent: a.name }))
    ) ?? []
    return [...squadItems, ...agentItems]
  }

  const resources = getResources(activeTab)
  const isAgentTab = activeTab === 'agents'
  const resourceItems = isAgentTab ? [] : (resources as ResourceItem[])

  return (
    <div className="flex flex-col gap-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer w-fit"
      >
        <ChevronLeft className="w-4 h-4" />
        Squads
      </button>

      {/* Squad Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-4xl">{squad.icon || '📦'}</span>
          <div>
            <h2 className="text-headline text-xl text-white">{squad.name}</h2>
            <p className="text-zinc-400 text-sm mt-1">{squad.description || 'Sem descricao'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          {TAB_CONFIG.map((t) => {
            const count = getSquadResourceCount(squad, t.key)
            if (count === 0) return null
            return (
              <span key={t.key} className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full px-2.5 py-1">
                {count} {t.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-[var(--border-color)] overflow-x-auto">
        {availableTabs.map((t) => {
          const count = getSquadResourceCount(squad, t.key)
          const isActive = activeTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'text-lime-400 border-b-2 border-lime-400'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {t.icon}
              {t.label}
              <span className={`text-[10px] font-bold ml-1 ${isActive ? 'text-lime-400' : 'text-[var(--text-muted)]'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'agents' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {squad.agents?.map((agent) => (
            <button
              key={agent.id}
              onClick={() => onAgentClick(agent)}
              className="card p-4 text-left hover:border-lime-400/20 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{agent.icon || '🤖'}</span>
                <div className="min-w-0">
                  <h4 className="font-bold text-white group-hover:text-lime-400 transition-colors truncate">
                    {agent.name}
                  </h4>
                  <p className="text-zinc-400 text-sm truncate">{agent.title || ''}</p>
                  <p className="text-zinc-500 text-xs line-clamp-2 mt-1">{agent.role || ''}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {resourceItems.map((item, i) => (
            <div key={i} className="card p-4 flex items-start gap-3">
              <span className="text-[var(--text-muted)] mt-0.5">
                {activeTab === 'templates' && <FileText className="w-4 h-4" />}
                {activeTab === 'tasks' && <CheckSquare className="w-4 h-4" />}
                {activeTab === 'workflows' && <Workflow className="w-4 h-4" />}
                {activeTab === 'checklists' && <CheckSquare className="w-4 h-4" />}
                {activeTab === 'crons' && <Clock className="w-4 h-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{item.name}</span>
                  {item._agent && (
                    <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full px-1.5 py-0.5">
                      {item._agent}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-zinc-500 text-xs mt-0.5">{item.description}</p>
                )}
                {item.file && (
                  <p className="text-zinc-600 text-xs font-mono mt-0.5">{item.file}</p>
                )}
              </div>
            </div>
          ))}
          {resourceItems.length === 0 && !isAgentTab && (
            <p className="text-[var(--text-muted)] text-sm py-8 text-center">Nenhum item nesta aba</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Agent Detail Modal ─── */

function AgentDetailModal({
  agent,
  visible,
  onClose,
}: {
  agent: EcosystemAgent
  visible: boolean
  onClose: () => void
}) {
  // Close on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const sections: {
    key: string
    label: string
    icon: React.ReactNode
    items: { name: string; description?: string; file?: string }[]
    isMono?: boolean
  }[] = [
    { key: 'commands', label: 'Commands', icon: <Terminal className="w-4 h-4" />, items: agent.commands ?? [], isMono: true },
    { key: 'templates', label: 'Templates', icon: <FileText className="w-4 h-4" />, items: agent.templates ?? [] },
    { key: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" />, items: agent.tasks ?? [] },
    { key: 'workflows', label: 'Workflows', icon: <Workflow className="w-4 h-4" />, items: agent.workflows ?? [] },
    { key: 'checklists', label: 'Checklists', icon: <CheckSquare className="w-4 h-4" />, items: agent.checklists ?? [] },
    { key: 'crons', label: 'Crons', icon: <Clock className="w-4 h-4" />, items: agent.crons ?? [] },
    { key: 'kbs', label: 'KBs', icon: <BookOpen className="w-4 h-4" />, items: agent.kbs ?? [] },
    { key: 'dna', label: 'DNA', icon: <Dna className="w-4 h-4" />, items: agent.dna ?? [] },
  ]

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-lg bg-[#0a0a0a] border-l border-[#222] overflow-y-auto z-50 transform transition-transform duration-300 ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pt-8">
          {/* Agent Header */}
          <div className="flex items-start gap-4 mb-6">
            <span className="text-4xl">{agent.icon || '🤖'}</span>
            <div>
              <h2 className="text-xl font-bold text-white">{agent.name}</h2>
              {agent.title && <p className="text-zinc-400 text-sm mt-0.5">{agent.title}</p>}
              {agent.squad && (
                <span className="inline-block mt-2 text-[10px] text-lime-400 bg-lime-400/10 font-bold px-2 py-0.5 rounded-full">
                  {agent.squad}
                </span>
              )}
            </div>
          </div>

          {/* Role */}
          {agent.role && (
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">{agent.role}</p>
          )}

          {/* Sections */}
          {sections.map((section) => {
            if (section.items.length === 0) return null
            return (
              <div key={section.key} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[var(--text-muted)]">{section.icon}</span>
                  <h3 className="text-label">{section.label}</h3>
                </div>

                {section.key === 'commands' ? (
                  <div className="border border-[var(--border-color)] rounded-xl overflow-hidden">
                    {section.items.map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-4 px-4 py-3 ${
                          i > 0 ? 'border-t border-[var(--border-color)]' : ''
                        }`}
                      >
                        <span className="text-lime-400 font-mono text-sm whitespace-nowrap">
                          {item.name}
                        </span>
                        <span className="text-zinc-500 text-sm">
                          {item.description || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {section.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]"
                      >
                        <span className="text-[var(--text-muted)] mt-0.5">{section.icon}</span>
                        <div className="min-w-0">
                          <span className="text-sm text-white">{item.name}</span>
                          {item.description && (
                            <p className="text-zinc-500 text-xs mt-0.5">{item.description}</p>
                          )}
                          {item.file && (
                            <p className="text-zinc-600 text-xs font-mono mt-0.5">{item.file}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

/* ─── Search Results ─── */

interface SearchResult {
  type: 'squad' | 'agent' | 'template' | 'task' | 'workflow' | 'checklist' | 'cron'
  name: string
  icon: string
  squadName?: string
  squad?: EcosystemSquad
  agent?: EcosystemAgent
}

function getSearchResults(data: EcosystemData | null, query: string): SearchResult[] {
  if (!data) return []
  const q = query.toLowerCase().trim()
  const results: SearchResult[] = []

  for (const squad of data.squads) {
    if (squad.name.toLowerCase().includes(q) || squad.description?.toLowerCase().includes(q)) {
      results.push({ type: 'squad', name: squad.name, icon: squad.icon || '📦', squad })
    }
    for (const agent of squad.agents ?? []) {
      if (
        agent.name.toLowerCase().includes(q) ||
        agent.title?.toLowerCase().includes(q) ||
        agent.role?.toLowerCase().includes(q)
      ) {
        results.push({ type: 'agent', name: agent.name, icon: agent.icon || '🤖', squadName: squad.name, agent })
      }
    }
    const resourceTypes: { key: TabKey; type: SearchResult['type'] }[] = [
      { key: 'templates', type: 'template' },
      { key: 'tasks', type: 'task' },
      { key: 'workflows', type: 'workflow' },
      { key: 'checklists', type: 'checklist' },
      { key: 'crons', type: 'cron' },
    ]
    for (const rt of resourceTypes) {
      const items = (squad[rt.key] as { name: string }[]) ?? []
      for (const item of items) {
        if (item.name.toLowerCase().includes(q)) {
          results.push({ type: rt.type, name: item.name, icon: squad.icon || '📦', squadName: squad.name, squad })
        }
      }
      for (const agent of squad.agents ?? []) {
        const agentItems = ((agent as unknown as Record<string, unknown>)[rt.key] as { name: string }[]) ?? []
        for (const item of agentItems) {
          if (item.name.toLowerCase().includes(q)) {
            results.push({ type: rt.type, name: item.name, icon: agent.icon || '🤖', squadName: squad.name, squad, agent })
          }
        }
      }
    }
  }

  return results.slice(0, 50)
}

const TYPE_LABELS: Record<string, string> = {
  squad: 'Squad',
  agent: 'Agente',
  template: 'Template',
  task: 'Task',
  workflow: 'Workflow',
  checklist: 'Checklist',
  cron: 'Cron',
}

const TYPE_COLORS: Record<string, string> = {
  squad: 'bg-purple-400/10 text-purple-400',
  agent: 'bg-lime-400/10 text-lime-400',
  template: 'bg-blue-400/10 text-blue-400',
  task: 'bg-amber-400/10 text-amber-400',
  workflow: 'bg-cyan-400/10 text-cyan-400',
  checklist: 'bg-emerald-400/10 text-emerald-400',
  cron: 'bg-orange-400/10 text-orange-400',
}

function SearchResultsView({
  results,
  query,
  onSquadClick,
  onAgentClick,
}: {
  results: SearchResult[]
  query: string
  onSquadClick: (squad: EcosystemSquad) => void
  onAgentClick: (agent: EcosystemAgent) => void
}) {
  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-500 text-sm">
          Nenhum resultado para &apos;{query}&apos;
        </p>
      </div>
    )
  }

  // Group by type
  const grouped: Record<string, SearchResult[]> = {}
  for (const r of results) {
    if (!grouped[r.type]) grouped[r.type] = []
    grouped[r.type].push(r)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[var(--text-muted)] text-xs">{results.length} resultados</p>
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type}>
          <h3 className="text-label mb-2">{TYPE_LABELS[type] ?? type}s</h3>
          <div className="flex flex-col gap-1.5">
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  if (item.type === 'agent' && item.agent) onAgentClick(item.agent)
                  else if (item.squad) onSquadClick(item.squad)
                }}
                className="card p-3 flex items-center gap-3 text-left hover:border-lime-400/20 transition-all cursor-pointer"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm text-white flex-1 truncate">{item.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[item.type] ?? ''}`}>
                  {TYPE_LABELS[item.type] ?? item.type}
                </span>
                {item.squadName && (
                  <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full px-1.5 py-0.5">
                    {item.squadName}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
