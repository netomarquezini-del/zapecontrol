'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Save, Trash2, Loader2, Check, AlertCircle, Lock } from 'lucide-react'
import type { RoleTemplate } from '@/lib/permissions'
import PermissionGrid from './permission-grid'

interface ManageTemplatesModalProps {
  onClose: () => void
}

export default function ManageTemplatesModal({ onClose }: ManageTemplatesModalProps) {
  const [templates, setTemplates] = useState<RoleTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPerms, setNewPerms] = useState<string[]>([])
  const [createSaving, setCreateSaving] = useState(false)

  // Edit
  const [editId, setEditId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPerms, setEditPerms] = useState<string[]>([])
  const [editSaving, setEditSaving] = useState(false)

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const showFb = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 3000)
  }

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/role-templates')
      const data = await res.json()
      if (Array.isArray(data)) setTemplates(data)
    } catch {
      showFb('error', 'Erro ao carregar perfis')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const handleCreate = async () => {
    if (!newLabel) return
    setCreateSaving(true)
    const slug = newSlug || newLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    try {
      const res = await fetch('/api/role-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, label: newLabel, description: newDesc, permissions: newPerms }),
      })
      const data = await res.json()
      if (data.error) { showFb('error', data.error) }
      else {
        showFb('success', `Perfil "${newLabel}" criado!`)
        setShowCreate(false)
        setNewLabel(''); setNewSlug(''); setNewDesc(''); setNewPerms([])
        fetchTemplates()
      }
    } catch { showFb('error', 'Erro inesperado') }
    setCreateSaving(false)
  }

  const handleEdit = async (id: string) => {
    setEditSaving(true)
    try {
      const res = await fetch(`/api/role-templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: editLabel, description: editDesc, permissions: editPerms }),
      })
      const data = await res.json()
      if (data.error) { showFb('error', data.error) }
      else {
        showFb('success', 'Perfil atualizado!')
        setEditId(null)
        fetchTemplates()
      }
    } catch { showFb('error', 'Erro inesperado') }
    setEditSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (deletingId !== id) { setDeletingId(id); setTimeout(() => setDeletingId(null), 3000); return }
    try {
      const res = await fetch(`/api/role-templates/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) { showFb('error', data.error) }
      else { showFb('success', 'Perfil removido'); fetchTemplates() }
    } catch { showFb('error', 'Erro inesperado') }
    setDeletingId(null)
  }

  const inputCls = "w-full rounded-xl border border-[#222222] bg-[#111111] px-4 py-2.5 text-[13px] font-semibold text-white placeholder-zinc-700 outline-none focus:border-lime-400/30 transition-colors"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#222222] bg-[#0a0a0a] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#222222] sticky top-0 bg-[#0a0a0a] z-10">
          <div>
            <h2 className="text-lg font-extrabold text-white">Perfis Padrao</h2>
            <p className="text-[11px] font-semibold text-zinc-600 mt-0.5">Gerencie os templates de permissoes</p>
          </div>
          <div className="flex items-center gap-2">
            {!showCreate && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 rounded-xl bg-lime-400/10 border border-lime-400/20 px-4 py-2 text-[12px] font-bold text-lime-400 hover:bg-lime-400/15 transition-all cursor-pointer"
              >
                <Plus size={14} /> Novo Perfil
              </button>
            )}
            <button onClick={onClose} className="rounded-lg p-2 text-zinc-600 hover:text-white hover:bg-white/5 cursor-pointer"><X size={18} /></button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Feedback */}
          {feedback && (
            <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[12px] font-semibold border ${
              feedback.type === 'success' ? 'bg-lime-400/8 border-lime-400/15 text-lime-400' : 'bg-red-400/8 border-red-400/15 text-red-400'
            }`}>
              {feedback.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              {feedback.msg}
            </div>
          )}

          {/* Create form */}
          {showCreate && (
            <div className="rounded-xl border border-lime-400/20 bg-lime-400/[0.02] p-5 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-lime-400">Novo Perfil</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Nome do Perfil</label>
                  <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Ex: Analista" className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Descricao</label>
                  <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Breve descricao" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-2">Permissoes</label>
                <PermissionGrid selected={newPerms} onChange={setNewPerms} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setShowCreate(false); setNewLabel(''); setNewDesc(''); setNewPerms([]) }}
                  className="px-4 py-2 rounded-xl text-[12px] font-bold text-zinc-500 hover:text-white cursor-pointer">Cancelar</button>
                <button onClick={handleCreate} disabled={createSaving || !newLabel}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-lime-400/10 border border-lime-400/20 text-[12px] font-bold text-lime-400 hover:bg-lime-400/15 cursor-pointer disabled:opacity-40">
                  {createSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Criar
                </button>
              </div>
            </div>
          )}

          {/* Templates list */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-lime-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((t) => {
                const isEditing = editId === t.id
                return (
                  <div key={t.id} className="rounded-xl border border-[#222222] bg-[#0d0d0d] p-4">
                    {/* Template header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] font-extrabold text-white">{t.label}</span>
                        {t.is_system && (
                          <span className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-0.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                            <Lock size={9} /> Sistema
                          </span>
                        )}
                        {t.description && !isEditing && (
                          <span className="text-[11px] font-semibold text-zinc-600">{t.description}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-[#111111] border border-[#222222] px-2.5 py-1 text-[10px] font-bold text-zinc-500">
                          {(t.permissions || []).length} perms
                        </span>
                        {!t.is_system && !isEditing && (
                          <>
                            <button
                              onClick={() => { setEditId(t.id); setEditLabel(t.label); setEditDesc(t.description || ''); setEditPerms(t.permissions || []) }}
                              className="rounded-lg p-2 text-zinc-500 hover:text-white hover:bg-white/5 cursor-pointer"
                            >
                              <Save size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              className={`rounded-lg p-2 cursor-pointer ${deletingId === t.id ? 'text-red-400 bg-red-400/10' : 'text-zinc-500 hover:text-red-400 hover:bg-red-400/5'}`}
                              title={deletingId === t.id ? 'Clique novamente para confirmar' : 'Deletar perfil'}
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                        {isEditing && (
                          <>
                            <button onClick={() => handleEdit(t.id)} disabled={editSaving}
                              className="rounded-lg p-2 text-lime-400 hover:bg-lime-400/10 cursor-pointer disabled:opacity-40">
                              {editSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            </button>
                            <button onClick={() => setEditId(null)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 cursor-pointer"><X size={13} /></button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Edit mode */}
                    {isEditing && (
                      <div className="mt-4 pt-4 border-t border-[#222222] space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Nome</label>
                            <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className={inputCls} />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Descricao</label>
                            <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className={inputCls} />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-2">Permissoes</label>
                          <PermissionGrid selected={editPerms} onChange={setEditPerms} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
