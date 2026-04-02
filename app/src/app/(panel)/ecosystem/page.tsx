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
  filePath?: string
  commands?: { name: string; description: string }[]
  templates?: { name: string; description: string }[]
  tasks?: { name: string; description: string }[]
  workflows?: { name: string; description: string }[]
  checklists?: { name: string; description: string }[]
  crons?: { name: string; file: string; description?: string }[]
  kbs?: { name: string; description: string }[]
  dna?: { name: string; description: string }[]
}

interface EcosystemSquad {
  id: string
  name: string
  icon: string
  description: string
  path: string
  agents: EcosystemAgent[]
  templates?: { name: string; description: string }[]
  tasks?: { name: string; description: string }[]
  workflows?: { name: string; description: string }[]
  checklists?: { name: string; description: string }[]
  crons?: { name: string; file: string; description?: string }[]
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

// Color palette for squad/agent avatars (no emojis)
const AVATAR_COLORS = [
  'bg-lime-400/15 text-lime-400 border-lime-400/20',
  'bg-purple-400/15 text-purple-400 border-purple-400/20',
  'bg-cyan-400/15 text-cyan-400 border-cyan-400/20',
  'bg-orange-400/15 text-orange-400 border-orange-400/20',
  'bg-pink-400/15 text-pink-400 border-pink-400/20',
  'bg-blue-400/15 text-blue-400 border-blue-400/20',
  'bg-yellow-400/15 text-yellow-400 border-yellow-400/20',
  'bg-red-400/15 text-red-400 border-red-400/20',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  return name.split(/[\s-]+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const color = getAvatarColor(name)
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-14 h-14 text-lg' }
  return (
    <div className={`${sizes[size]} ${color} rounded-xl border flex items-center justify-center font-bold shrink-0`}>
      {getInitials(name)}
    </div>
  )
}

type TabKey = 'agents' | 'templates' | 'tasks' | 'workflows' | 'checklists' | 'crons'

const TAB_CONFIG: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'agents', label: 'Agentes', icon: <Bot className="w-3.5 h-3.5" /> },
  { key: 'templates', label: 'Modelos', icon: <FileText className="w-3.5 h-3.5" /> },
  { key: 'tasks', label: 'Tarefas', icon: <CheckSquare className="w-3.5 h-3.5" /> },
  { key: 'workflows', label: 'Fluxos', icon: <Workflow className="w-3.5 h-3.5" /> },
  { key: 'checklists', label: 'Checklists', icon: <CheckSquare className="w-3.5 h-3.5" /> },
  { key: 'crons', label: 'Automacoes', icon: <Clock className="w-3.5 h-3.5" /> },
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
  const [selectedResource, setSelectedResource] = useState<{ name: string; path: string; type: string; description?: string } | null>(null)
  const [resourceContent, setResourceContent] = useState<string | null>(null)
  const [resourceLoading, setResourceLoading] = useState(false)

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
        if (selectedResource) {
          closeResource()
          return
        }
        if (selectedAgent) {
          closeAgentModal()
          return
        }
        if (selectedSquad) {
          setSelectedSquad(null)
          return
        }
        if (query) {
          setQuery('')
          searchRef.current?.blur()
          return
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedResource, selectedAgent, selectedSquad, query]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
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

  const openResource = async (name: string, filePath: string, type: string, description?: string) => {
    setSelectedResource({ name, path: filePath, type, description })
    setResourceContent(null)
    setResourceLoading(true)
    try {
      const res = await fetch(`/api/ecosystem/file?path=${encodeURIComponent(filePath)}`)
      if (res.ok) {
        const d = await res.json()
        setResourceContent(d.content)
      } else {
        setResourceContent('// Arquivo nao encontrado ou indisponivel')
      }
    } catch {
      setResourceContent('// Erro ao carregar arquivo')
    } finally {
      setResourceLoading(false)
    }
  }

  const closeResource = () => {
    setSelectedResource(null)
    setResourceContent(null)
  }

  // Search logic
  const searchResults = query.trim().length > 1 ? getSearchResults(data, query) : null

  // Stats
  const stats = data?.stats ?? { squads: 0, agents: 0, templates: 0, tasks: 0, workflows: 0, checklists: 0, crons: 0 }

  const statItems = [
    { label: 'Squads', value: stats.squads },
    { label: 'Agentes', value: stats.agents },
    { label: 'Modelos', value: stats.templates },
    { label: 'Tarefas', value: stats.tasks },
    { label: 'Fluxos', value: stats.workflows },
    { label: 'Checklists', value: stats.checklists },
    { label: 'Automacoes', value: stats.crons },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display text-2xl md:text-3xl text-white flex items-center gap-3">
            <Dna className="w-7 h-7 text-lime-400" /> Ecosystem
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
              onResourceClick={openResource}
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
                      <Avatar name={squad.name} size="lg" />
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
          onResourceClick={openResource}
        />
      )}

      {selectedResource && (
        <ResourceDetailModal
          resource={selectedResource}
          content={resourceContent}
          loading={resourceLoading}
          onClose={closeResource}
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
  onResourceClick,
}: {
  squad: EcosystemSquad
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  onBack: () => void
  onAgentClick: (agent: EcosystemAgent) => void
  onResourceClick: (name: string, filePath: string, type: string, description?: string) => void
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
          <Avatar name={squad.name} size="xl" />
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
                <Avatar name={agent.name} size="md" />
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
            <button
              key={i}
              onClick={() => {
                const filePath = activeTab === 'crons' && item.file
                  ? item.file
                  : `${squad.path}${activeTab}/${item.name}`
                onResourceClick(item.name, filePath, activeTab, item.description)
              }}
              className="card p-4 flex items-start gap-3 text-left hover:border-lime-400/20 transition-all cursor-pointer w-full"
            >
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
            </button>
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
  onResourceClick,
}: {
  agent: EcosystemAgent
  visible: boolean
  onClose: () => void
  onResourceClick: (name: string, filePath: string, type: string, description?: string) => void
}) {
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [activeView, setActiveView] = useState<'resumo' | 'arquivo'>('resumo')

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Fetch agent file content
  useEffect(() => {
    if (!agent.filePath) return
    setFileLoading(true)
    fetch(`/api/ecosystem/file?path=${encodeURIComponent(agent.filePath)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setFileContent(data?.content ?? null))
      .catch(() => setFileContent(null))
      .finally(() => setFileLoading(false))
  }, [agent.filePath])

  const sections: {
    key: string
    label: string
    icon: React.ReactNode
    items: { name: string; description?: string; file?: string }[]
  }[] = [
    { key: 'commands', label: 'Comandos', icon: <Terminal className="w-4 h-4" />, items: agent.commands ?? [] },
    { key: 'templates', label: 'Templates', icon: <FileText className="w-4 h-4" />, items: agent.templates ?? [] },
    { key: 'tasks', label: 'Tarefas', icon: <CheckSquare className="w-4 h-4" />, items: agent.tasks ?? [] },
    { key: 'workflows', label: 'Fluxos de Trabalho', icon: <Workflow className="w-4 h-4" />, items: agent.workflows ?? [] },
    { key: 'checklists', label: 'Checklists', icon: <CheckSquare className="w-4 h-4" />, items: agent.checklists ?? [] },
    { key: 'crons', label: 'Automacoes (Crons)', icon: <Clock className="w-4 h-4" />, items: agent.crons ?? [] },
    { key: 'kbs', label: 'Base de Conhecimento', icon: <BookOpen className="w-4 h-4" />, items: agent.kbs ?? [] },
    { key: 'dna', label: 'DNA', icon: <Dna className="w-4 h-4" />, items: agent.dna ?? [] },
  ]

  const totalResources = sections.reduce((sum, s) => sum + s.items.length, 0)

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
        className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-[#0a0a0a] border-l border-[#222] overflow-y-auto z-50 transform transition-transform duration-300 ${
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
          <div className="flex items-start gap-4 mb-4">
            <Avatar name={agent.name} size="xl" />
            <div>
              <h2 className="text-xl font-bold text-white">{agent.name}</h2>
              {agent.title && <p className="text-zinc-400 text-sm mt-0.5">{agent.title}</p>}
              <div className="flex items-center gap-2 mt-2">
                {agent.squad && (
                  <span className="text-[10px] text-lime-400 bg-lime-400/10 font-bold px-2 py-0.5 rounded-full">
                    {agent.squad}
                  </span>
                )}
                {agent.filePath && (
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {agent.filePath}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Funcao / Role */}
          {agent.role && (
            <div className="mb-5">
              <h3 className="text-label mb-2">Funcao</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{agent.role}</p>
            </div>
          )}

          {/* Stats rápidos */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { label: 'Comandos', value: (agent.commands ?? []).length },
              { label: 'Templates', value: (agent.templates ?? []).length },
              { label: 'Tarefas', value: (agent.tasks ?? []).length },
              { label: 'Recursos', value: totalResources },
            ].map((s) => (
              <div key={s.label} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-lime-400">{s.value}</div>
                <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* View toggle: Resumo / Arquivo Completo */}
          <div className="flex gap-1 mb-5 border-b border-[var(--border-color)]">
            <button
              onClick={() => setActiveView('resumo')}
              className={`px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                activeView === 'resumo'
                  ? 'text-lime-400 border-b-2 border-lime-400'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Resumo
            </button>
            <button
              onClick={() => setActiveView('arquivo')}
              className={`px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                activeView === 'arquivo'
                  ? 'text-lime-400 border-b-2 border-lime-400'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Arquivo Completo
            </button>
          </div>

          {activeView === 'resumo' ? (
            <>
              {/* Sections */}
              {sections.map((section) => {
                if (section.items.length === 0) return null
                return (
                  <div key={section.key} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[var(--text-muted)]">{section.icon}</span>
                      <h3 className="text-label">{section.label}</h3>
                      <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded-full">
                        {section.items.length}
                      </span>
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
                          <button
                            key={i}
                            onClick={() => {
                              const filePath = section.key === 'crons' && item.file
                                ? item.file
                                : `squads/${agent.squad}/${section.key}/${item.name}`
                              onResourceClick(item.name, filePath, section.key, item.description)
                            }}
                            className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-left hover:border-lime-400/20 transition-all cursor-pointer w-full"
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
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {totalResources === 0 && (
                <p className="text-[var(--text-muted)] text-sm text-center py-8">
                  Nenhum recurso vinculado a este agente
                </p>
              )}
            </>
          ) : (
            /* Arquivo Completo */
            <div>
              {fileLoading ? (
                <div className="flex items-center gap-2 text-[var(--text-muted)] py-8">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Carregando definicao do agente...</span>
                </div>
              ) : fileContent ? (
                <div className="bg-[#080808] rounded-xl p-4 border border-[#1a1a1a]">
                  <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
                    {fileContent}
                  </pre>
                </div>
              ) : (
                <p className="text-[var(--text-muted)] text-sm text-center py-8">
                  Arquivo do agente nao disponivel
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ─── Resource Detail Modal ─── */

function ResourceDetailModal({
  resource,
  content,
  loading,
  onClose,
}: {
  resource: { name: string; path: string; type: string; description?: string }
  content: string | null
  loading: boolean
  onClose: () => void
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[#0a0a0a] border-l border-[#222] z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#222] shrink-0">
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-bold text-base truncate">{resource.name}</h3>
            <p className="text-[var(--text-muted)] text-xs font-mono mt-0.5 truncate">{resource.path}</p>
            {resource.description && (
              <div className="mt-3 p-3 bg-lime-400/5 border border-lime-400/10 rounded-xl">
                <p className="text-label mb-1">O que faz</p>
                <p className="text-zinc-300 text-sm leading-relaxed">{resource.description}</p>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer ml-4 mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : content ? (
            <div className="bg-[#080808] rounded-xl p-4 border border-[#1a1a1a]">
              <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap break-words leading-relaxed">
                {content}
              </pre>
            </div>
          ) : (
            <p className="text-[var(--text-muted)] text-sm">Conteudo indisponivel</p>
          )}
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
      results.push({ type: 'squad', name: squad.name, icon: squad.icon || '--', squad })
    }
    for (const agent of squad.agents ?? []) {
      if (
        agent.name.toLowerCase().includes(q) ||
        agent.title?.toLowerCase().includes(q) ||
        agent.role?.toLowerCase().includes(q)
      ) {
        results.push({ type: 'agent', name: agent.name, icon: agent.icon || '--', squadName: squad.name, agent })
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
          results.push({ type: rt.type, name: item.name, icon: squad.icon || '--', squadName: squad.name, squad })
        }
      }
      for (const agent of squad.agents ?? []) {
        const agentItems = ((agent as unknown as Record<string, unknown>)[rt.key] as { name: string }[]) ?? []
        for (const item of agentItems) {
          if (item.name.toLowerCase().includes(q)) {
            results.push({ type: rt.type, name: item.name, icon: agent.icon || '--', squadName: squad.name, squad, agent })
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
  template: 'Modelo',
  task: 'Tarefa',
  workflow: 'Fluxo',
  checklist: 'Checklist',
  cron: 'Automacao',
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
                <Avatar name={item.name} size="sm" />
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
