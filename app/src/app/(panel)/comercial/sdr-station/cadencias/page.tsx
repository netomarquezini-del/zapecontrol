'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  ArrowUp,
  ArrowDown,
  Phone,
  MessageSquare,
  Instagram,
  Play,
  Pause,
  SkipForward,
  Save,
  Zap,
  Users,
  CheckCircle,
  LogOut,
  Loader2,
  X,
  Star,
} from 'lucide-react'
import type {
  SdrCadence,
  SdrCadenceStep,
  SdrMessageChannel,
  SdrCadenceExecutionStatus,
} from '@/lib/types-sdr'

// ─── Types ─────────────────────────────────────────────────

interface CadenceWithStats extends SdrCadence {
  execution_stats: {
    active: number
    paused: number
    completed: number
    exited: number
  }
}

interface ExecutionRow {
  id: string
  lead_id: string
  cadence_id: string
  current_step: number
  status: SdrCadenceExecutionStatus
  started_at: string
  next_action_at: string | null
  lead?: { nome: string; telefone: string }
}

interface Template {
  id: string
  name: string
  channel: SdrMessageChannel
}

type ChannelOption = 'phone' | 'whatsapp' | 'instagram'

const CHANNEL_OPTIONS: { value: ChannelOption; label: string; icon: typeof Phone }[] = [
  { value: 'phone', label: 'Telefone', icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
]

// ─── Helper ────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

// ─── Page ──────────────────────────────────────────────────

export default function SdrCadenciasPage() {
  const [cadences, setCadences] = useState<CadenceWithStats[]>([])
  const [executions, setExecutions] = useState<ExecutionRow[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingCadence, setEditingCadence] = useState<CadenceWithStats | null>(null)
  const [executing, setExecuting] = useState(false)
  const [executeResult, setExecuteResult] = useState<string | null>(null)

  // ── Fetch cadences ─────────────────────────────────────

  const fetchCadences = useCallback(async () => {
    try {
      const res = await fetch('/api/sdr/cadences')
      const json = await res.json()
      setCadences(json.data || [])
    } catch (err) {
      console.error('Error fetching cadences:', err)
    }
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/sdr/templates')
      const json = await res.json()
      setTemplates(json.data || [])
    } catch (err) {
      console.error('Error fetching templates:', err)
    }
  }, [])

  const fetchExecutions = useCallback(async () => {
    try {
      // Fetch all active/paused executions across all cadences
      // We'll get this through a custom approach - fetching from the cadences endpoint
      // For now, we use a direct approach via cadence stats
      // We'll populate this from individual cadence data when expanded
    } catch (err) {
      console.error('Error fetching executions:', err)
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchCadences(), fetchTemplates(), fetchExecutions()]).finally(() =>
      setLoading(false)
    )
  }, [fetchCadences, fetchTemplates, fetchExecutions])

  // ── Toggle cadence active status ───────────────────────

  async function toggleActive(cadence: CadenceWithStats) {
    try {
      await fetch(`/api/sdr/cadences/${cadence.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !cadence.is_active }),
      })
      await fetchCadences()
    } catch (err) {
      console.error('Error toggling cadence:', err)
    }
  }

  // ── Delete cadence (soft) ──────────────────────────────

  async function deleteCadence(id: string) {
    if (!confirm('Desativar esta cadencia?')) return
    try {
      await fetch(`/api/sdr/cadences/${id}`, { method: 'DELETE' })
      await fetchCadences()
    } catch (err) {
      console.error('Error deleting cadence:', err)
    }
  }

  // ── Execute batch ──────────────────────────────────────

  async function executeBatch() {
    setExecuting(true)
    setExecuteResult(null)
    try {
      const res = await fetch('/api/sdr/cadences/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-manual-trigger': 'true',
        },
      })
      const json = await res.json()
      setExecuteResult(
        `Processados: ${json.processed}, Pulados: ${json.skipped}, Erros: ${json.errors}`
      )
      await fetchCadences()
    } catch (err) {
      console.error('Error executing batch:', err)
      setExecuteResult('Erro ao executar')
    } finally {
      setExecuting(false)
    }
  }

  // ── Expand cadence to see executions ───────────────────

  async function expandCadence(cadenceId: string) {
    if (expandedId === cadenceId) {
      setExpandedId(null)
      setExecutions([])
      return
    }
    setExpandedId(cadenceId)

    try {
      const res = await fetch(`/api/sdr/cadences/${cadenceId}`)
      const cadence = await res.json()

      // Fetch active executions for this cadence - we need a custom query
      // Since we don't have a dedicated list endpoint, we use the cadence detail
      // to show stats. For the execution table we'll make a lightweight call.
      // In production, you'd add a query param to the cadences route.
      // For now, show the stats from the cadence.
      void cadence
      setExecutions([])
    } catch (err) {
      console.error('Error expanding cadence:', err)
    }
  }

  // ── Execution actions ──────────────────────────────────

  async function executionAction(executionId: string, action: 'pause' | 'resume' | 'skip') {
    try {
      await fetch(`/api/sdr/cadences/executions/${executionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (expandedId) await expandCadence(expandedId)
      await fetchCadences()
    } catch (err) {
      console.error('Error with execution action:', err)
    }
  }

  // ── Totals ─────────────────────────────────────────────

  const totals = cadences.reduce(
    (acc, c) => ({
      active: acc.active + (c.execution_stats?.active || 0),
      paused: acc.paused + (c.execution_stats?.paused || 0),
      completed: acc.completed + (c.execution_stats?.completed || 0),
      exited: acc.exited + (c.execution_stats?.exited || 0),
    }),
    { active: 0, paused: 0, completed: 0, exited: 0 }
  )

  // ─── Render ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 lg:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-lime-400/10 border border-lime-400/20">
            <RefreshCw size={20} className="text-lime-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Cadencias</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={executeBatch}
            disabled={executing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#222222] text-zinc-300 text-sm font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
          >
            {executing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            Executar Agora
          </button>
          <button
            onClick={() => {
              setEditingCadence(null)
              setShowBuilder(true)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-400 text-black text-sm font-bold hover:bg-lime-300 transition-colors"
          >
            <Plus size={16} />
            Nova Cadencia
          </button>
        </div>
      </div>

      {/* Execute result banner */}
      {executeResult && (
        <div className="mb-4 rounded-lg border border-lime-400/20 bg-lime-400/5 px-4 py-3 text-sm text-lime-400 flex items-center justify-between">
          <span>{executeResult}</span>
          <button onClick={() => setExecuteResult(null)} className="text-lime-400/60 hover:text-lime-400">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <DashCard icon={Users} label="Ativos" value={totals.active} color="text-lime-400" />
        <DashCard icon={Pause} label="Pausados" value={totals.paused} color="text-yellow-400" />
        <DashCard icon={CheckCircle} label="Completaram" value={totals.completed} color="text-emerald-400" />
        <DashCard icon={LogOut} label="Sairam" value={totals.exited} color="text-red-400" />
      </div>

      {/* Cadence Builder Modal */}
      {showBuilder && (
        <CadenceBuilder
          cadence={editingCadence}
          templates={templates}
          onClose={() => {
            setShowBuilder(false)
            setEditingCadence(null)
          }}
          onSaved={() => {
            setShowBuilder(false)
            setEditingCadence(null)
            fetchCadences()
          }}
        />
      )}

      {/* Cadences List */}
      {loading ? (
        <div className="rounded-2xl border border-[#222222] bg-[#111111] p-10 text-center">
          <Loader2 size={24} className="animate-spin text-zinc-500 mx-auto" />
        </div>
      ) : cadences.length === 0 ? (
        <div className="rounded-2xl border border-[#222222] bg-[#111111] p-10 text-center">
          <p className="text-sm text-zinc-500">Nenhuma cadencia criada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cadences.map((cadence) => (
            <div
              key={cadence.id}
              className="rounded-2xl border border-[#222222] bg-[#111111] overflow-hidden"
            >
              {/* Cadence Row */}
              <div className="flex items-center gap-4 p-4">
                <button
                  onClick={() => expandCadence(cadence.id)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  {expandedId === cadence.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white truncate">{cadence.name}</h3>
                    {cadence.is_default && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-lime-400/10 text-lime-400 text-[10px] font-bold uppercase">
                        <Star size={10} /> Padrao
                      </span>
                    )}
                  </div>
                  {cadence.description && (
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{cadence.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span>{(cadence.steps || []).length} steps</span>
                  <span className="text-lime-400">{cadence.execution_stats?.active || 0} ativos</span>
                </div>

                {/* Active toggle */}
                <button
                  onClick={() => toggleActive(cadence)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    cadence.is_active ? 'bg-lime-400' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                      cadence.is_active ? 'left-5.5' : 'left-0.5'
                    }`}
                  />
                </button>

                {/* Actions */}
                <button
                  onClick={() => {
                    setEditingCadence(cadence)
                    setShowBuilder(true)
                  }}
                  className="text-zinc-500 hover:text-white text-xs transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteCadence(cadence.id)}
                  className="text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Expanded: Steps Preview + Executions */}
              {expandedId === cadence.id && (
                <div className="border-t border-[#222222] p-4 bg-[#0d0d0d]">
                  {/* Steps preview */}
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase mb-2">Steps da Cadencia</h4>
                    <div className="flex flex-wrap gap-2">
                      {(cadence.steps || []).map((step, idx) => (
                        <StepBadge key={idx} step={step} />
                      ))}
                    </div>
                  </div>

                  {/* Execution stats */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <MiniStat label="Ativos" value={cadence.execution_stats?.active || 0} color="text-lime-400" />
                    <MiniStat label="Pausados" value={cadence.execution_stats?.paused || 0} color="text-yellow-400" />
                    <MiniStat label="Completaram" value={cadence.execution_stats?.completed || 0} color="text-emerald-400" />
                    <MiniStat label="Sairam" value={cadence.execution_stats?.exited || 0} color="text-red-400" />
                  </div>

                  {/* Executions table */}
                  {executions.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-zinc-500 text-left">
                            <th className="pb-2 font-medium">Lead</th>
                            <th className="pb-2 font-medium">Step Atual</th>
                            <th className="pb-2 font-medium">Proxima Acao</th>
                            <th className="pb-2 font-medium">Status</th>
                            <th className="pb-2 font-medium text-right">Acoes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222222]">
                          {executions.map((exec) => (
                            <tr key={exec.id}>
                              <td className="py-2 text-white">{exec.lead?.nome || exec.lead_id}</td>
                              <td className="py-2 text-zinc-400">Step {exec.current_step}</td>
                              <td className="py-2 text-zinc-400">{formatDate(exec.next_action_at)}</td>
                              <td className="py-2">
                                <StatusBadge status={exec.status} />
                              </td>
                              <td className="py-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {exec.status === 'active' && (
                                    <button
                                      onClick={() => executionAction(exec.id, 'pause')}
                                      className="p-1 rounded hover:bg-[#222222] text-yellow-400"
                                      title="Pausar"
                                    >
                                      <Pause size={12} />
                                    </button>
                                  )}
                                  {exec.status === 'paused' && (
                                    <button
                                      onClick={() => executionAction(exec.id, 'resume')}
                                      className="p-1 rounded hover:bg-[#222222] text-lime-400"
                                      title="Retomar"
                                    >
                                      <Play size={12} />
                                    </button>
                                  )}
                                  {(exec.status === 'active' || exec.status === 'paused') && (
                                    <button
                                      onClick={() => executionAction(exec.id, 'skip')}
                                      className="p-1 rounded hover:bg-[#222222] text-zinc-400"
                                      title="Pular step"
                                    >
                                      <SkipForward size={12} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Dashboard Card ────────────────────────────────────────

function DashCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={color} />
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
    </div>
  )
}

// ─── Mini Stat ─────────────────────────────────────────────

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2 text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-zinc-500">{label}</p>
    </div>
  )
}

// ─── Step Badge ────────────────────────────────────────────

function StepBadge({ step }: { step: SdrCadenceStep }) {
  const channelConfig = CHANNEL_OPTIONS.find((c) => c.value === step.channel)
  const Icon = channelConfig?.icon || Phone

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-[#222222] bg-[#161616] px-2.5 py-1.5">
      <span className="text-[10px] font-bold text-zinc-500">#{step.step}</span>
      <Icon size={12} className="text-lime-400" />
      <span className="text-[11px] text-zinc-300">{channelConfig?.label || step.channel}</span>
      {step.delay_days > 0 && (
        <span className="text-[10px] text-zinc-600 ml-1">+{step.delay_days}d</span>
      )}
    </div>
  )
}

// ─── Status Badge ──────────────────────────────────────────

function StatusBadge({ status }: { status: SdrCadenceExecutionStatus }) {
  const config: Record<string, { label: string; cls: string }> = {
    active: { label: 'Ativo', cls: 'bg-lime-400/10 text-lime-400' },
    paused: { label: 'Pausado', cls: 'bg-yellow-400/10 text-yellow-400' },
    completed: { label: 'Completo', cls: 'bg-emerald-400/10 text-emerald-400' },
    exited: { label: 'Saiu', cls: 'bg-red-400/10 text-red-400' },
  }
  const c = config[status] || config.active

  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${c.cls}`}>
      {c.label}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════
//  Cadence Builder (Modal)
// ═══════════════════════════════════════════════════════════

function CadenceBuilder({
  cadence,
  templates,
  onClose,
  onSaved,
}: {
  cadence: CadenceWithStats | null
  templates: Template[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(cadence?.name || '')
  const [description, setDescription] = useState(cadence?.description || '')
  const [isDefault, setIsDefault] = useState(cadence?.is_default || false)
  const [steps, setSteps] = useState<SdrCadenceStep[]>(
    cadence?.steps?.length
      ? [...cadence.steps]
      : [{ step: 1, channel: 'phone', delay_days: 0, template_id: null }]
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addStep() {
    const nextNum = steps.length > 0 ? Math.max(...steps.map((s) => s.step)) + 1 : 1
    setSteps([...steps, { step: nextNum, channel: 'phone', delay_days: 1, template_id: null }])
  }

  function removeStep(index: number) {
    const newSteps = steps.filter((_, i) => i !== index)
    // Renumber
    setSteps(newSteps.map((s, i) => ({ ...s, step: i + 1 })))
  }

  function updateStep(index: number, field: keyof SdrCadenceStep, value: unknown) {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  function moveStep(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === steps.length - 1) return

    const newSteps = [...steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]
    // Renumber
    setSteps(newSteps.map((s, i) => ({ ...s, step: i + 1 })))
  }

  async function save() {
    if (!name.trim()) {
      setError('Nome e obrigatorio')
      return
    }
    if (steps.length === 0) {
      setError('Adicione pelo menos um step')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        steps,
        is_default: isDefault,
      }

      if (cadence) {
        // Update
        const res = await fetch(`/api/sdr/cadences/${cadence.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const json = await res.json()
          throw new Error(json.error || 'Erro ao atualizar')
        }
      } else {
        // Create
        const res = await fetch('/api/sdr/cadences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const json = await res.json()
          throw new Error(json.error || 'Erro ao criar')
        }
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#222222] bg-[#111111] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#222222]">
          <h2 className="text-lg font-extrabold text-white">
            {cadence ? 'Editar Cadencia' : 'Nova Cadencia'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Name & Description */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cadencia Padrao 5 Steps"
                className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-lime-400/30 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">Descricao (opcional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descricao da cadencia..."
                className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-lime-400/30 focus:outline-none transition-colors"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-[#222222] bg-[#0a0a0a] text-lime-400 focus:ring-lime-400/30 accent-lime-400"
              />
              <span className="text-xs text-zinc-400">Cadencia padrao (usada ao inscrever leads sem especificar cadencia)</span>
            </label>
          </div>

          {/* Steps Builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase">Steps</h3>
              <button
                onClick={addStep}
                className="flex items-center gap-1 text-xs text-lime-400 hover:text-lime-300 font-medium transition-colors"
              >
                <Plus size={14} /> Adicionar Step
              </button>
            </div>

            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-xl border border-[#222222] bg-[#0d0d0d] p-3"
                >
                  {/* Step number */}
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-lime-400/10 text-lime-400 text-xs font-bold shrink-0">
                    {step.step}
                  </div>

                  {/* Channel selector */}
                  <select
                    value={step.channel}
                    onChange={(e) => updateStep(index, 'channel', e.target.value)}
                    className="rounded-lg border border-[#222222] bg-[#0a0a0a] px-2 py-1.5 text-xs text-white focus:border-lime-400/30 focus:outline-none appearance-none cursor-pointer"
                  >
                    {CHANNEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Delay */}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={step.delay_days}
                      onChange={(e) => updateStep(index, 'delay_days', parseInt(e.target.value) || 0)}
                      className="w-14 rounded-lg border border-[#222222] bg-[#0a0a0a] px-2 py-1.5 text-xs text-white text-center focus:border-lime-400/30 focus:outline-none"
                    />
                    <span className="text-[10px] text-zinc-500">dias</span>
                  </div>

                  {/* Template selector (for message channels) */}
                  {(step.channel === 'whatsapp' || step.channel === 'instagram') && (
                    <select
                      value={step.template_id || ''}
                      onChange={(e) => updateStep(index, 'template_id', e.target.value || null)}
                      className="flex-1 rounded-lg border border-[#222222] bg-[#0a0a0a] px-2 py-1.5 text-xs text-white focus:border-lime-400/30 focus:outline-none appearance-none cursor-pointer min-w-0"
                    >
                      <option value="">Sem template</option>
                      {templates
                        .filter((t) => t.channel === step.channel)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                  )}

                  {/* Spacer for phone steps */}
                  {step.channel === 'phone' && <div className="flex-1" />}

                  {/* Move buttons */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => moveStep(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded text-zinc-500 hover:text-white disabled:opacity-20 transition-colors"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={() => moveStep(index, 'down')}
                      disabled={index === steps.length - 1}
                      className="p-1 rounded text-zinc-500 hover:text-white disabled:opacity-20 transition-colors"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeStep(index)}
                    className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            {steps.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#222222] p-6 text-center">
                <p className="text-xs text-zinc-500">Nenhum step adicionado</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-[#222222]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-lime-400 text-black text-sm font-bold hover:bg-lime-300 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {cadence ? 'Salvar Alteracoes' : 'Criar Cadencia'}
          </button>
        </div>
      </div>
    </div>
  )
}
