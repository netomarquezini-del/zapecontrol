'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import { PERMISSION_GROUPS, getAllPermissionIds } from '@/lib/permissions'
import type { RoleTemplate } from '@/lib/permissions'
import PermissionGrid from '@/components/usuarios/permission-grid'
import RoleTemplateSelector from '@/components/usuarios/role-template-selector'
import ResetPasswordModal from '@/components/usuarios/reset-password-modal'
import {
  Users, UserPlus, Loader2, Pencil, Trash2, Save, X, Check, AlertCircle, Shield, KeyRound, ChevronDown, ChevronUp,
} from 'lucide-react'

interface AppUser {
  id: string
  auth_id: string
  email: string
  name: string
  role: string
  role_template_id: string | null
  permissions: string[]
  active: boolean
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Create form
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formTemplateId, setFormTemplateId] = useState<string | null>(null)
  const [formPerms, setFormPerms] = useState<string[]>(['comercial.dashboard'])
  const [saving, setSaving] = useState(false)

  // Edit
  const [editId, setEditId] = useState<string | null>(null)
  const [editTemplateId, setEditTemplateId] = useState<string | null>(null)
  const [editPerms, setEditPerms] = useState<string[]>([])
  const [editSaving, setEditSaving] = useState(false)

  // Delete
  const [deleting, setDeleting] = useState<string | null>(null)

  // Password reset
  const [resetUser, setResetUser] = useState<{ id: string; name: string } | null>(null)

  // Expand/collapse user cards
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const showFb = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 3000)
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabase()
    const { data, error } = await supabase.from('app_users').select('*').order('name')
    if (error) showFb('error', 'Erro: ' + error.message)
    else setUsers((data ?? []) as AppUser[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Derive role label from template or permissions
  const getRoleLabel = (user: AppUser) => {
    if (user.role === 'admin') return 'Admin'
    const permCount = (user.permissions || []).length
    const totalPerms = getAllPermissionIds().length
    if (permCount === totalPerms) return 'Acesso Total'
    if (permCount === 0) return 'Sem Acesso'
    return user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'Custom'
  }

  // Permission summary
  const getPermSummary = (perms: string[]) => {
    const groups = PERMISSION_GROUPS.map((g) => {
      const count = g.items.filter((i) => perms.includes(i.id)).length
      return { label: g.label, count, total: g.items.length }
    }).filter((g) => g.count > 0)
    return groups
  }

  // Create user
  const handleCreate = async () => {
    if (!formName || !formEmail || !formPassword) return
    setSaving(true)

    // Derive role from template
    let role = 'viewer'
    if (formPerms.length === getAllPermissionIds().length) role = 'admin'
    else if (formPerms.length > 10) role = 'gerente'

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          role,
          permissions: formPerms,
          role_template_id: formTemplateId,
        }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        showFb('error', 'Erro: ' + (data.error || 'Falha ao criar'))
        setSaving(false)
        return
      }

      showFb('success', `Usuario ${formName} criado!`)
      setShowForm(false)
      setFormName(''); setFormEmail(''); setFormPassword(''); setFormTemplateId(null); setFormPerms(['comercial.dashboard'])
      fetchUsers()
    } catch {
      showFb('error', 'Erro inesperado')
    }
    setSaving(false)
  }

  // Save edit
  const handleSaveEdit = async (id: string) => {
    setEditSaving(true)
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: editPerms,
          role_template_id: editTemplateId,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        showFb('error', 'Erro: ' + (data.error || 'Falha ao salvar'))
      } else {
        showFb('success', 'Permissoes atualizadas!')
        setEditId(null)
        fetchUsers()
      }
    } catch {
      showFb('error', 'Erro inesperado')
    }
    setEditSaving(false)
  }

  // Delete user
  const handleDelete = async (id: string) => {
    if (deleting !== id) { setDeleting(id); setTimeout(() => setDeleting(null), 3000); return }
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || data.error) {
        showFb('error', 'Erro: ' + (data.error || 'Falha ao deletar'))
      } else {
        showFb('success', 'Usuario removido')
        fetchUsers()
      }
    } catch {
      showFb('error', 'Erro inesperado')
    }
    setDeleting(null)
  }

  const inputCls = "w-full rounded-xl border border-[#222222] bg-[#111111] px-4 py-2.5 text-[13px] font-semibold text-white placeholder-zinc-700 outline-none focus:border-lime-400/30 transition-colors"

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400/8 border border-lime-400/15">
            <Shield size={18} className="text-lime-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Usuarios</h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Gerenciar acessos e permissoes</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-lime-400/10 border border-lime-400/20 px-5 py-2.5 text-[13px] font-bold text-lime-400 hover:bg-lime-400/15 transition-all cursor-pointer"
        >
          <UserPlus size={15} /> Novo Usuario
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-xl px-4 py-3 text-[13px] font-semibold border flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-lime-400/8 border-lime-400/15 text-lime-400' : 'bg-red-400/8 border-red-400/15 text-red-400'
        }`}>
          {feedback.type === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
          {feedback.msg}
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#222222] bg-[#0a0a0a] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#222222] sticky top-0 bg-[#0a0a0a] z-10">
              <h2 className="text-lg font-extrabold text-white">Novo Usuario</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-2 text-zinc-600 hover:text-white hover:bg-white/5 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="px-6 py-6 space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Nome</label>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome completo" className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Email</label>
                  <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@exemplo.com" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Senha</label>
                <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Minimo 6 caracteres" className={inputCls} />
              </div>

              {/* Role template */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Perfil Padrao</label>
                <RoleTemplateSelector
                  value={formTemplateId}
                  onChange={(templateId, permissions) => {
                    setFormTemplateId(templateId)
                    if (permissions.length > 0) setFormPerms(permissions)
                  }}
                />
                <p className="text-[10px] text-zinc-700 mt-1.5">Selecione um perfil para carregar permissoes automaticamente, ou personalize abaixo.</p>
              </div>

              {/* Permission grid */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-2">Permissoes de Acesso</label>
                <PermissionGrid selected={formPerms} onChange={setFormPerms} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-5 border-t border-[#222222] sticky bottom-0 bg-[#0a0a0a]">
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-zinc-500 hover:text-white cursor-pointer">Cancelar</button>
              <button
                onClick={handleCreate}
                disabled={saving || !formName || !formEmail || !formPassword}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lime-400/10 border border-lime-400/20 text-[13px] font-bold text-lime-400 hover:bg-lime-400/15 cursor-pointer disabled:opacity-40"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Criar Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password reset modal */}
      {resetUser && (
        <ResetPasswordModal
          userId={resetUser.id}
          userName={resetUser.name}
          onClose={() => setResetUser(null)}
          onSuccess={() => showFb('success', 'Senha resetada!')}
        />
      )}

      {/* Users list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={28} className="animate-spin text-lime-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600">Carregando</span>
        </div>
      ) : users.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-[13px] font-semibold text-zinc-600">Nenhum usuario cadastrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((u) => {
            const isEditing = editId === u.id
            const isExpanded = expandedId === u.id || isEditing
            const permSummary = getPermSummary(u.permissions || [])
            const totalPerms = (u.permissions || []).length

            return (
              <div key={u.id} className="card p-5">
                {/* User header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-lime-400/8 border border-lime-400/15 flex items-center justify-center text-[14px] font-black text-lime-400 shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-extrabold text-white truncate">{u.name}</p>
                      <p className="text-[11px] font-semibold text-zinc-600 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!isEditing && (
                      <>
                        <span className="rounded-lg bg-lime-400/8 border border-lime-400/15 px-3 py-1 text-[10px] font-bold text-lime-400 uppercase tracking-[0.08em]">
                          {getRoleLabel(u)}
                        </span>
                        <span className="rounded-lg bg-[#111111] border border-[#222222] px-2.5 py-1 text-[10px] font-bold text-zinc-500">
                          {totalPerms} perm{totalPerms !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : u.id)}
                          className="rounded-lg p-2 text-zinc-500 hover:text-white hover:bg-white/5 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <button
                          onClick={() => { setEditId(u.id); setEditTemplateId(u.role_template_id); setEditPerms(u.permissions || []) }}
                          className="rounded-lg p-2 text-zinc-500 hover:text-white hover:bg-white/5 cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setResetUser({ id: u.id, name: u.name })}
                          className="rounded-lg p-2 text-zinc-500 hover:text-amber-400 hover:bg-amber-400/5 cursor-pointer"
                          title="Resetar senha"
                        >
                          <KeyRound size={14} />
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            className={`rounded-lg p-2 cursor-pointer ${deleting === u.id ? 'text-red-400 bg-red-400/10' : 'text-zinc-500 hover:text-red-400 hover:bg-red-400/5'}`}
                            title={deleting === u.id ? 'Clique novamente para confirmar' : 'Deletar usuario'}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    )}
                    {isEditing && (
                      <>
                        <button
                          onClick={() => handleSaveEdit(u.id)}
                          disabled={editSaving}
                          className="rounded-lg p-2 text-lime-400 hover:bg-lime-400/10 cursor-pointer disabled:opacity-40"
                        >
                          {editSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        </button>
                        <button onClick={() => setEditId(null)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 cursor-pointer"><X size={14} /></button>
                      </>
                    )}
                  </div>
                </div>

                {/* Permission summary (collapsed view) */}
                {!isExpanded && !isEditing && permSummary.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {permSummary.map((g) => (
                      <span key={g.label} className="rounded-lg bg-[#111111] border border-[#222222] px-2.5 py-1 text-[10px] font-bold text-zinc-500">
                        {g.label} ({g.count}/{g.total})
                      </span>
                    ))}
                  </div>
                )}

                {/* Expanded view (read-only) */}
                {isExpanded && !isEditing && (
                  <div className="mt-4 pt-4 border-t border-[#222222]">
                    <PermissionGrid selected={u.permissions || []} onChange={() => {}} disabled />
                  </div>
                )}

                {/* Edit mode */}
                {isEditing && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-[#222222]">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Perfil Padrao</label>
                      <RoleTemplateSelector
                        value={editTemplateId}
                        onChange={(templateId, permissions) => {
                          setEditTemplateId(templateId)
                          if (permissions.length > 0) setEditPerms(permissions)
                        }}
                      />
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
  )
}
