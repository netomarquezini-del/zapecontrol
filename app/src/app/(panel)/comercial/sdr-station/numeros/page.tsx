'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Phone,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  PhoneCall,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────
interface SdrNumberRow {
  id: string
  twilio_sid: string | null
  number: string
  ddd: string
  friendly_name: string | null
  status: 'ativo' | 'pausado' | 'bloqueado'
  call_count: number
  last_used_at: string | null
  created_at: string
}

type ModalMode = 'add' | 'edit' | null

// ── Component ──────────────────────────────────────────────
export default function SdrNumerosPage() {
  const [numbers, setNumbers] = useState<SdrNumberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formNumber, setFormNumber] = useState('')
  const [formDDD, setFormDDD] = useState('')
  const [formName, setFormName] = useState('')
  const [formTwilioSid, setFormTwilioSid] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Validate credentials
  const [validateLoading, setValidateLoading] = useState(false)
  const [validateResult, setValidateResult] = useState<{ valid: boolean; account_name?: string; error?: string } | null>(null)

  // Test call
  const [testModalOpen, setTestModalOpen] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; call_sid?: string; error?: string } | null>(null)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── Fetch numbers ────────────────────────────────────────
  const fetchNumbers = useCallback(async () => {
    try {
      const res = await fetch('/api/sdr/numbers')
      const json = await res.json()
      if (json.numbers) setNumbers(json.numbers)
    } catch {
      console.error('Erro ao carregar numeros')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNumbers()
  }, [fetchNumbers])

  // ── Add / Edit handlers ──────────────────────────────────
  function openAddModal() {
    setModalMode('add')
    setEditingId(null)
    setFormNumber('')
    setFormDDD('')
    setFormName('')
    setFormTwilioSid('')
    setFormError('')
  }

  function openEditModal(n: SdrNumberRow) {
    setModalMode('edit')
    setEditingId(n.id)
    setFormNumber(n.number)
    setFormDDD(n.ddd)
    setFormName(n.friendly_name ?? '')
    setFormTwilioSid(n.twilio_sid ?? '')
    setFormError('')
  }

  function closeModal() {
    setModalMode(null)
    setEditingId(null)
    setFormError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    try {
      if (modalMode === 'add') {
        const res = await fetch('/api/sdr/numbers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: formNumber,
            ddd: formDDD,
            friendly_name: formName || undefined,
            twilio_sid: formTwilioSid || undefined,
          }),
        })
        const json = await res.json()
        if (!res.ok) {
          setFormError(json.error || 'Erro ao adicionar')
          return
        }
      } else if (modalMode === 'edit' && editingId) {
        const res = await fetch(`/api/sdr/numbers/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ddd: formDDD,
            friendly_name: formName || null,
            twilio_sid: formTwilioSid || null,
          }),
        })
        const json = await res.json()
        if (!res.ok) {
          setFormError(json.error || 'Erro ao atualizar')
          return
        }
      }
      closeModal()
      await fetchNumbers()
    } catch {
      setFormError('Erro de rede')
    } finally {
      setFormLoading(false)
    }
  }

  // ── Toggle status ────────────────────────────────────────
  async function toggleStatus(n: SdrNumberRow) {
    const newStatus = n.status === 'ativo' ? 'pausado' : 'ativo'
    try {
      await fetch(`/api/sdr/numbers/${n.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      await fetchNumbers()
    } catch {
      console.error('Erro ao alternar status')
    }
  }

  // ── Delete ───────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await fetch(`/api/sdr/numbers/${deleteId}`, { method: 'DELETE' })
      setDeleteId(null)
      await fetchNumbers()
    } catch {
      console.error('Erro ao deletar')
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Validate credentials ─────────────────────────────────
  async function handleValidate() {
    setValidateLoading(true)
    setValidateResult(null)
    try {
      const res = await fetch('/api/sdr/numbers/validate', { method: 'POST' })
      const json = await res.json()
      setValidateResult(json)
    } catch {
      setValidateResult({ valid: false, error: 'Erro de rede' })
    } finally {
      setValidateLoading(false)
    }
  }

  // ── Test call ────────────────────────────────────────────
  async function handleTestCall(e: React.FormEvent) {
    e.preventDefault()
    setTestLoading(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/sdr/numbers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_number: testPhone }),
      })
      const json = await res.json()
      setTestResult(json)
    } catch {
      setTestResult({ success: false, error: 'Erro de rede' })
    } finally {
      setTestLoading(false)
    }
  }

  // ── Status badge ─────────────────────────────────────────
  function StatusBadge({ status }: { status: SdrNumberRow['status'] }) {
    const config = {
      ativo: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      pausado: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
      bloqueado: 'bg-red-500/15 text-red-400 border-red-500/30',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  // ── Format date ──────────────────────────────────────────
  function formatDate(date: string | null) {
    if (!date) return '-'
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ── Format phone ─────────────────────────────────────────
  function formatPhone(num: string) {
    const d = num.replace(/\D/g, '')
    if (d.length === 11) {
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    }
    if (d.length === 13 && d.startsWith('55')) {
      return `+55 (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`
    }
    return num
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-lime-400/10 border border-lime-400/20">
            <Phone size={20} className="text-lime-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Pool de Numeros</h1>
            <p className="text-sm text-zinc-500">Gerencie numeros Twilio e BINA para chamadas</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleValidate}
            disabled={validateLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#222222] bg-[#111111] text-sm text-zinc-300 hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
          >
            {validateLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            Validar Credenciais
          </button>
          <button
            onClick={() => { setTestModalOpen(true); setTestResult(null); setTestPhone('') }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#222222] bg-[#111111] text-sm text-zinc-300 hover:bg-[#1a1a1a] transition-colors"
          >
            <PhoneCall size={16} />
            Teste de Chamada
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-400 text-black text-sm font-semibold hover:bg-lime-300 transition-colors"
          >
            <Plus size={16} />
            Adicionar Numero
          </button>
        </div>
      </div>

      {/* Validate result banner */}
      {validateResult && (
        <div
          className={`mb-4 flex items-center gap-3 rounded-xl border p-4 ${
            validateResult.valid
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          {validateResult.valid ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span className="text-sm">
            {validateResult.valid
              ? `Credenciais validas! Conta: ${validateResult.account_name}`
              : validateResult.error}
          </span>
          <button
            onClick={() => setValidateResult(null)}
            className="ml-auto text-zinc-500 hover:text-zinc-300"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-[#222222] bg-[#111111] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 size={24} className="animate-spin text-lime-400" />
          </div>
        ) : numbers.length === 0 ? (
          <div className="p-16 text-center">
            <Phone size={40} className="mx-auto mb-4 text-zinc-700" />
            <p className="text-sm text-zinc-500 mb-4">Nenhum numero cadastrado</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-400 text-black text-sm font-semibold hover:bg-lime-300 transition-colors"
            >
              <Plus size={16} />
              Adicionar Primeiro Numero
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#222222]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Numero</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">DDD</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nome Amigavel</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Chamadas</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ultima Uso</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {numbers.map((n) => (
                  <tr key={n.id} className="border-b border-[#1a1a1a] hover:bg-[#151515] transition-colors">
                    <td className="px-4 py-3 text-white font-mono">{formatPhone(n.number)}</td>
                    <td className="px-4 py-3 text-zinc-400">{n.ddd}</td>
                    <td className="px-4 py-3 text-zinc-400">{n.friendly_name || '-'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={n.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">{n.call_count}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{formatDate(n.last_used_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleStatus(n)}
                          title={n.status === 'ativo' ? 'Pausar' : 'Ativar'}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1a1a] transition-colors"
                        >
                          {n.status === 'ativo' ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={() => openEditModal(n)}
                          title="Editar"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1a1a] transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(n.id)}
                          title="Excluir"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeModal}>
          <div className="w-full max-w-md rounded-2xl border border-[#222222] bg-[#111111] p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">
              {modalMode === 'add' ? 'Adicionar Numero' : 'Editar Numero'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Numero *</label>
                <input
                  type="text"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  placeholder="11999999999"
                  required
                  disabled={modalMode === 'edit'}
                  className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-lime-400/50 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">DDD *</label>
                <input
                  type="text"
                  value={formDDD}
                  onChange={(e) => setFormDDD(e.target.value)}
                  placeholder="11"
                  required
                  maxLength={2}
                  className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-lime-400/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome Amigavel</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Linha SP Principal"
                  className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-lime-400/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Twilio SID</label>
                <input
                  type="text"
                  value={formTwilioSid}
                  onChange={(e) => setFormTwilioSid(e.target.value)}
                  placeholder="PN..."
                  className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-lime-400/50"
                />
              </div>

              {formError && (
                <p className="text-sm text-red-400">{formError}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-[#222222] text-sm text-zinc-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-400 text-black text-sm font-semibold hover:bg-lime-300 transition-colors disabled:opacity-50"
                >
                  {formLoading && <Loader2 size={14} className="animate-spin" />}
                  {modalMode === 'add' ? 'Adicionar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-[#222222] bg-[#111111] p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-2">Confirmar Exclusao</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Tem certeza que deseja remover este numero do pool? Esta acao nao pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-[#222222] text-sm text-zinc-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Call Modal */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setTestModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-[#222222] bg-[#111111] p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Teste de Chamada</h2>
            <form onSubmit={handleTestCall} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Numero de Destino</label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="11999999999"
                  required
                  className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-lime-400/50"
                />
                <p className="mt-1 text-xs text-zinc-600">Uma chamada curta sera feita para este numero</p>
              </div>

              {testResult && (
                <div
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    testResult.success
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-red-500/30 bg-red-500/10 text-red-400'
                  }`}
                >
                  {testResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  <span className="text-xs">
                    {testResult.success
                      ? `Chamada iniciada! SID: ${testResult.call_sid}`
                      : testResult.error}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#222222] text-sm text-zinc-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={testLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-400 text-black text-sm font-semibold hover:bg-lime-300 transition-colors disabled:opacity-50"
                >
                  {testLoading && <Loader2 size={14} className="animate-spin" />}
                  <PhoneCall size={14} />
                  Ligar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
