'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Users, Search, Plus, Upload, ChevronLeft, ChevronRight,
  Loader2, Trash2, Pencil, X, Phone, Mail, Building2, Tag,
} from 'lucide-react'
import { PIPELINE_STATUSES } from '@/lib/types-sdr'
import type { SdrLead, SdrLeadStatus } from '@/lib/types-sdr'
import CsvImportModal from '@/components/sdr/csv-import-modal'
import LeadTimeline from '@/components/sdr/lead-timeline'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getStatusConfig(status: SdrLeadStatus) {
  return PIPELINE_STATUSES.find((s) => s.value === status) || PIPELINE_STATUSES[0]
}

export default function SdrLeadsPage() {
  const [leads, setLeads] = useState<SdrLead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<SdrLeadStatus | ''>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const limit = 25

  // Modals
  const [showNewLeadModal, setShowNewLeadModal] = useState(false)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [showDetailPanel, setShowDetailPanel] = useState<SdrLead | null>(null)
  const [editingLead, setEditingLead] = useState<SdrLead | null>(null)

  // New lead form
  const [newLead, setNewLead] = useState({
    nome: '', telefone: '', email: '', empresa: '', cargo: '', origem: '', tags: '',
  })
  const [saving, setSaving] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/sdr/leads?${params.toString()}`)
      const data = await res.json()

      if (res.ok) {
        setLeads(data.data || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 0)
      }
    } catch (err) {
      console.error('Error fetching leads:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Debounce search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleCreateLead = async () => {
    if (!newLead.nome || !newLead.telefone) return
    setSaving(true)
    try {
      const body = {
        nome: newLead.nome,
        telefone: newLead.telefone,
        email: newLead.email || undefined,
        empresa: newLead.empresa || undefined,
        cargo: newLead.cargo || undefined,
        origem: newLead.origem || undefined,
        tags: newLead.tags ? newLead.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      }
      const res = await fetch('/api/sdr/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setShowNewLeadModal(false)
        setNewLead({ nome: '', telefone: '', email: '', empresa: '', cargo: '', origem: '', tags: '' })
        fetchLeads()
      }
    } catch (err) {
      console.error('Error creating lead:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateLead = async () => {
    if (!editingLead) return
    setSaving(true)
    try {
      const res = await fetch(`/api/sdr/leads/${editingLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editingLead.nome,
          telefone: editingLead.telefone,
          email: editingLead.email,
          empresa: editingLead.empresa,
          cargo: editingLead.cargo,
          origem: editingLead.origem,
          tags: editingLead.tags,
          notes: editingLead.notes,
        }),
      })
      if (res.ok) {
        setEditingLead(null)
        fetchLeads()
      }
    } catch (err) {
      console.error('Error updating lead:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return
    try {
      const res = await fetch(`/api/sdr/leads/${id}`, { method: 'DELETE' })
      if (res.ok) {
        if (showDetailPanel?.id === id) setShowDetailPanel(null)
        fetchLeads()
      }
    } catch (err) {
      console.error('Error deleting lead:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 lg:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-lime-400/10 border border-lime-400/20">
            <Users size={20} className="text-lime-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Leads</h1>
            <p className="text-xs text-zinc-500">{total} lead{total !== 1 ? 's' : ''} no total</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCsvModal(true)}
            className="flex items-center gap-2 rounded-xl border border-[#333333] px-4 py-2.5 text-sm text-zinc-400 hover:bg-[#1a1a1a] hover:text-white transition-colors"
          >
            <Upload size={16} />
            Importar CSV
          </button>
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="flex items-center gap-2 rounded-xl bg-lime-400 px-4 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 transition-colors"
          >
            <Plus size={16} />
            Novo Lead
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nome, telefone ou email..."
            className="w-full rounded-xl border border-[#222222] bg-[#111111] pl-11 pr-4 py-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-lime-400/50 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setStatusFilter(''); setPage(1) }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === ''
                ? 'bg-white/10 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Todos
          </button>
          {PIPELINE_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatusFilter(s.value); setPage(1) }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s.value
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              style={statusFilter === s.value ? { backgroundColor: s.color + '22', color: s.color } : undefined}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#222222] bg-[#111111] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-zinc-500" />
          </div>
        ) : leads.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-zinc-500">Nenhum lead encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#222222]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Telefone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Empresa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider hidden xl:table-cell">Tags</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Criado em</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const statusCfg = getStatusConfig(lead.status)
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setShowDetailPanel(lead)}
                      className="border-b border-[#1a1a1a] hover:bg-[#0f0f0f] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-white font-medium">{lead.nome}</td>
                      <td className="px-4 py-3 text-sm text-zinc-400">{lead.telefone}</td>
                      <td className="px-4 py-3 text-sm text-zinc-400 hidden md:table-cell">{lead.email || '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-400 hidden lg:table-cell">{lead.empresa || '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: statusCfg.color + '22', color: statusCfg.color }}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(lead.tags || []).slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-md bg-[#1a1a1a] border border-[#333333] px-2 py-0.5 text-xs text-zinc-400">
                              {tag}
                            </span>
                          ))}
                          {(lead.tags || []).length > 3 && (
                            <span className="text-xs text-zinc-600">+{lead.tags.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500 hidden lg:table-cell">{formatDate(lead.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setEditingLead({ ...lead })}
                            className="rounded-lg p-1.5 text-zinc-500 hover:bg-[#1a1a1a] hover:text-white transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#222222] px-4 py-3">
            <p className="text-xs text-zinc-500">
              Mostrando {(page - 1) * limit + 1}-{Math.min(page * limit, total)} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-[#1a1a1a] hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (page <= 4) {
                  pageNum = i + 1
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = page - 3 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-lime-400/20 text-lime-400'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-[#1a1a1a] hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Lead Modal */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-[#222222] bg-[#111111] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222222] px-6 py-4">
              <h2 className="text-lg font-bold text-white">Novo Lead</h2>
              <button
                onClick={() => setShowNewLeadModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-[#1a1a1a] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Nome *</label>
                  <input
                    type="text"
                    value={newLead.nome}
                    onChange={(e) => setNewLead((p) => ({ ...p, nome: e.target.value }))}
                    className="w-full rounded-xl border border-[#222222] bg-[#0a0a0a] px-4 py-2.5 text-sm text-zinc-300 focus:border-lime-400/50 focus:outline-none"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Telefone *</label>
                  <input
                    type="text"
                    value={newLead.telefone}
                    onChange={(e) => setNewLead((p) => ({ ...p, telefone: e.target.value }))}
                    className="w-full rounded-xl border border-[#222222] bg-[#0a0a0a] px-4 py-2.5 text-sm text-zinc-300 focus:border-lime-400/50 focus:outline-none"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead((p) => ({ ...p, email: e.target.value }))}
                    className="w-full rounded-xl border border-[#222222] bg-[#0a0a0a] px-4 py-2.5 text-sm text-zinc-300 focus:border-lime-400/50 focus:outline-none"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Empresa</label>
                  <input
                    type="text"
                    value={newLead.empresa}
                    onChange={(e) => setNewLead((p) => ({ ...p, empresa: e.target.value }))}
                    className="w-full rounded-xl border border-[#222222] bg-[#0a0a0a] px-4 py-2.5 text-sm text-zinc-300 focus:border-lime-400/50 focus:outline-none"
                    placeholder="Nome da empresa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Cargo</label>
                  <input
                    type="text"
                    value={newLead.cargo}
                    onChange={(e) => setNewLead((p) => ({ ...p, cargo: e.target.value }))}
                    className="w-full rounded-xl border border-[#222222] bg-[#0a0a0a] px-4 py-2.5 text-sm text-zinc-300 focus:border-lime-400/50 focus:outline-none"
                    placeholder="Cargo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Origem</label>
                  <input
                    type="text"
                    value={newLead.origem}
                    onChange={(e) => setNewLead((p) => ({ ...p, origem: e.target.value }))}
                    className="w-full rounded-xl border border-[#222222] bg-[#0a0a0a] px-4 py-2.5 text-sm text-zinc-300 focus:border-lime-400/50 focus:outline-none"
                    placeholder="Ex: site, indicacao"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Tags</label>
                  <input
                    type="text"
                    value={newLead.tags}
                    onChange={(e) => setNewLead((p) => ({ ...p, tags: e.target.value }))}
                    className="w-full rounded-xl border border-[#222222] bg-[#0a0a0a] px-4 py-2.5 text-sm text-zinc-300 focus:border-lime-400/50 focus:outline-none"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowNewLeadModal(false)}
                  className="rounded-xl border border-[#333333] px-5 py-2.5 text-sm text-zinc-400 hover:bg-[#1a1a1a] hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateLead}
                  disabled={saving || !newLead.nome || !newLead.telefone}
                  className="flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Criar Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-[#222222] bg-[#111111] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222222] px-6 py-4">
              <h2 className="text-lg font-bold text-white">Editar Lead</h2>
              <button
                onClick={() => setEditingLead(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-[#1a1a1a] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Nome</label>
                  <input
                    type="text"
                    value={editingLead.nome}
                    onChange={(e) => setEditingLead((p) => p ? { ...p, nome: e.target.value } : p)}
                    className="w-full rounded-xl border border-[#222222] bg-[#0a0a0a] px-4 py-2.5 text-sm text-zinc-300 focus:border-lime-400/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Telefone</label>
                  <input
                    type="text"
                    value={editingLead.telefone}
                    onChange={(e) => setEditingLead((p) => p ? { ...p, telefone: e.target.value } : p)}
                    className="w-full rounded-xl border border-[#222222] bg-[#0a0a0a] px-4 py-2.5 text-sm text-zinc-300 focus:border-lime-400/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editingLead.email || ''}
                    onChange={(e) => setEditingLead((p) => p ? { ...p, email: e.target.value || null } : p)}
                    className="w-full rounded-xl border border-[#222222] bg-[#0a0a0a] px-4 py-2.5 text-sm text-zinc-300 focus:border-lime-400/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Empresa</label>
                  <input
                    type="text"
                    value={editingLead.empresa || ''}
                    onChange={(e) => setEditingLead((p) => p ? { ...p, empresa: e.target.value || null } : p)}
                    className="w-full rounded-xl border border-[#222222] bg-[#0a0a0a] px-4 py-2.5 text-sm text-zinc-300 focus:border-lime-400/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Cargo</label>
                  <input
                    type="text"
                    value={editingLead.cargo || ''}
                    onChange={(e) => setEditingLead((p) => p ? { ...p, cargo: e.target.value || null } : p)}
                    className="w-full rounded-xl border border-[#222222] bg-[#0a0a0a] px-4 py-2.5 text-sm text-zinc-300 focus:border-lime-400/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Origem</label>
                  <input
                    type="text"
                    value={editingLead.origem || ''}
                    onChange={(e) => setEditingLead((p) => p ? { ...p, origem: e.target.value || null } : p)}
                    className="w-full rounded-xl border border-[#222222] bg-[#0a0a0a] px-4 py-2.5 text-sm text-zinc-300 focus:border-lime-400/50 focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Notas</label>
                  <textarea
                    value={editingLead.notes || ''}
                    onChange={(e) => setEditingLead((p) => p ? { ...p, notes: e.target.value || null } : p)}
                    rows={3}
                    className="w-full rounded-xl border border-[#222222] bg-[#0a0a0a] px-4 py-2.5 text-sm text-zinc-300 focus:border-lime-400/50 focus:outline-none resize-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditingLead(null)}
                  className="rounded-xl border border-[#333333] px-5 py-2.5 text-sm text-zinc-400 hover:bg-[#1a1a1a] hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateLead}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-lime-300 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Pencil size={16} />}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Side Panel */}
      {showDetailPanel && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDetailPanel(null)} />
          <div className="relative w-full max-w-md bg-[#111111] border-l border-[#222222] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#222222] bg-[#111111] px-6 py-4">
              <h2 className="text-lg font-bold text-white truncate">{showDetailPanel.nome}</h2>
              <button
                onClick={() => setShowDetailPanel(null)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-[#1a1a1a] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Lead Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone size={14} className="text-zinc-500 shrink-0" />
                  <span className="text-sm text-zinc-300">{showDetailPanel.telefone}</span>
                </div>
                {showDetailPanel.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={14} className="text-zinc-500 shrink-0" />
                    <span className="text-sm text-zinc-300">{showDetailPanel.email}</span>
                  </div>
                )}
                {showDetailPanel.empresa && (
                  <div className="flex items-center gap-3">
                    <Building2 size={14} className="text-zinc-500 shrink-0" />
                    <span className="text-sm text-zinc-300">{showDetailPanel.empresa}</span>
                    {showDetailPanel.cargo && (
                      <span className="text-xs text-zinc-500">({showDetailPanel.cargo})</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: getStatusConfig(showDetailPanel.status).color + '22',
                      color: getStatusConfig(showDetailPanel.status).color,
                    }}
                  >
                    {getStatusConfig(showDetailPanel.status).label}
                  </span>
                </div>
                {showDetailPanel.tags && showDetailPanel.tags.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Tag size={14} className="text-zinc-500 shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {showDetailPanel.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-[#1a1a1a] border border-[#333333] px-2 py-0.5 text-xs text-zinc-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {showDetailPanel.notes && (
                  <div className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-3">
                    <p className="text-xs text-zinc-500 mb-1 font-medium">Notas</p>
                    <p className="text-sm text-zinc-400 whitespace-pre-wrap">{showDetailPanel.notes}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-zinc-600">
                  <span>Criado: {formatDate(showDetailPanel.created_at)}</span>
                  <span>Ligacoes: {showDetailPanel.total_calls}</span>
                  <span>Mensagens: {showDetailPanel.total_messages}</span>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Historico</h3>
                <LeadTimeline leadId={showDetailPanel.id} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onImported={() => fetchLeads()}
      />
    </div>
  )
}
