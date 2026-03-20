'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Users, UserPlus, Loader2, Pencil, Trash2, Save, X, Check, AlertCircle, Shield } from 'lucide-react'

interface AppUser {
  id: string
  auth_id: string
  email: string
  name: string
  role: string
  permissions: string[]
  active: boolean
}

const PAGES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'acompanhamento', label: 'Acompanhamento' },
  { id: 'lancamentos', label: 'Lancamentos' },
  { id: 'metas', label: 'Metas' },
  { id: 'cadastros', label: 'Cadastros' },
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'diario', label: 'Meta Diaria' },
]

const ROLES = [
  { id: 'admin', label: 'Admin', desc: 'Acesso total' },
  { id: 'manager', label: 'Gerente', desc: 'Acesso ao painel' },
  { id: 'closer', label: 'Closer', desc: 'Acesso limitado' },
  { id: 'sdr', label: 'SDR', desc: 'Acesso limitado' },
  { id: 'viewer', label: 'Visualizador', desc: 'Apenas visualizar' },
]

export default function UsuariosPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // New user form
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState('viewer')
  const [formPerms, setFormPerms] = useState<string[]>(['dashboard'])
  const [saving, setSaving] = useState(false)

  // Edit
  const [editId, setEditId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editPerms, setEditPerms] = useState<string[]>([])

  const [deleting, setDeleting] = useState<string | null>(null)

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

  const handleCreate = async () => {
    if (!formName || !formEmail || !formPassword) return
    setSaving(true)

    try {
      // Create auth user via Supabase (using service role indirectly — we call signUp)
      const supabase = getSupabase()
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: formEmail,
        password: formPassword,
        options: { data: { name: formName, role: formRole } },
      })

      if (authErr) { showFb('error', 'Erro auth: ' + authErr.message); setSaving(false); return }

      const authId = authData.user?.id
      if (!authId) { showFb('error', 'Erro: user ID nao retornado'); setSaving(false); return }

      // Create app_users row
      const { error: dbErr } = await supabase.from('app_users').insert({
        auth_id: authId,
        email: formEmail,
        name: formName,
        role: formRole,
        permissions: formPerms,
        active: true,
      })

      if (dbErr) { showFb('error', 'Erro db: ' + dbErr.message); setSaving(false); return }

      showFb('success', `Usuario ${formName} criado!`)
      setShowForm(false)
      setFormName(''); setFormEmail(''); setFormPassword(''); setFormRole('viewer'); setFormPerms(['dashboard'])
      fetchUsers()
    } catch {
      showFb('error', 'Erro inesperado')
    }
    setSaving(false)
  }

  const handleSaveEdit = async (id: string) => {
    const supabase = getSupabase()
    const { error } = await supabase.from('app_users').update({ role: editRole, permissions: editPerms }).eq('id', id)
    if (error) showFb('error', 'Erro: ' + error.message)
    else { showFb('success', 'Permissoes atualizadas!'); setEditId(null); fetchUsers() }
  }

  const handleDelete = async (id: string) => {
    if (deleting !== id) { setDeleting(id); setTimeout(() => setDeleting(null), 3000); return }
    const supabase = getSupabase()
    const { error } = await supabase.from('app_users').delete().eq('id', id)
    if (error) showFb('error', 'Erro: ' + error.message)
    else { showFb('success', 'Usuario removido'); fetchUsers() }
    setDeleting(null)
  }

  const togglePerm = (perms: string[], perm: string) =>
    perms.includes(perm) ? perms.filter((p) => p !== perm) : [...perms, perm]

  const selectCls = "rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-2.5 text-[13px] font-bold text-white outline-none focus:border-lime-400/30 transition-colors cursor-pointer"
  const inputCls = "w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-2.5 text-[13px] font-semibold text-white placeholder-zinc-700 outline-none focus:border-lime-400/30 transition-colors"

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
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-lime-400/10 border border-lime-400/20 px-5 py-2.5 text-[13px] font-bold text-lime-400 hover:bg-lime-400/15 transition-all cursor-pointer">
          <UserPlus size={15} /> Novo Usuario
        </button>
      </div>

      {feedback && (
        <div className={`rounded-xl px-4 py-3 text-[13px] font-semibold border flex items-center gap-2 ${feedback.type === 'success' ? 'bg-lime-400/8 border-lime-400/15 text-lime-400' : 'bg-red-400/8 border-red-400/15 text-red-400'}`}>
          {feedback.type === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
          {feedback.msg}
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[#1a1a1a] bg-[#050505] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#1a1a1a]">
              <h2 className="text-lg font-extrabold text-white">Novo Usuario</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-2 text-zinc-600 hover:text-white hover:bg-white/5 cursor-pointer"><X size={18} /></button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Nome</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome completo" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Email</label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@exemplo.com" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Senha</label>
                <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Minimo 6 caracteres" className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Funcao</label>
                <select value={formRole} onChange={(e) => setFormRole(e.target.value)} className={`w-full ${selectCls}`}>
                  {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label} — {r.desc}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-2">Permissoes de Acesso</label>
                <div className="flex flex-wrap gap-2">
                  {PAGES.map((p) => (
                    <button key={p.id} type="button" onClick={() => setFormPerms(togglePerm(formPerms, p.id))}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${formPerms.includes(p.id) ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20' : 'bg-[#0a0a0a] text-zinc-600 border border-[#1a1a1a]'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-5 border-t border-[#1a1a1a]">
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-zinc-500 hover:text-white cursor-pointer">Cancelar</button>
              <button onClick={handleCreate} disabled={saving || !formName || !formEmail || !formPassword}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lime-400/10 border border-lime-400/20 text-[13px] font-bold text-lime-400 hover:bg-lime-400/15 cursor-pointer disabled:opacity-40">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Criar Usuario
              </button>
            </div>
          </div>
        </div>
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
            return (
              <div key={u.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-lime-400/8 border border-lime-400/15 flex items-center justify-center text-[14px] font-black text-lime-400">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[14px] font-extrabold text-white">{u.name}</p>
                      <p className="text-[11px] font-semibold text-zinc-600">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <>
                        <span className="rounded-lg bg-lime-400/8 border border-lime-400/15 px-3 py-1 text-[10px] font-bold text-lime-400 uppercase tracking-[0.08em]">
                          {ROLES.find((r) => r.id === u.role)?.label || u.role}
                        </span>
                        <button onClick={() => { setEditId(u.id); setEditRole(u.role); setEditPerms(u.permissions || []) }}
                          className="rounded-lg p-2 text-zinc-500 hover:text-white hover:bg-white/5 cursor-pointer"><Pencil size={14} /></button>
                        {u.role !== 'admin' && (
                          <button onClick={() => handleDelete(u.id)}
                            className={`rounded-lg p-2 cursor-pointer ${deleting === u.id ? 'text-red-400 bg-red-400/10' : 'text-zinc-500 hover:text-red-400 hover:bg-red-400/5'}`}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    )}
                    {isEditing && (
                      <>
                        <button onClick={() => handleSaveEdit(u.id)} className="rounded-lg p-2 text-lime-400 hover:bg-lime-400/10 cursor-pointer"><Save size={14} /></button>
                        <button onClick={() => setEditId(null)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 cursor-pointer"><X size={14} /></button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3 mt-4 pt-4 border-t border-[#1a1a1a]">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Funcao</label>
                      <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className={selectCls}>
                        {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-2">Permissoes</label>
                      <div className="flex flex-wrap gap-2">
                        {PAGES.map((p) => (
                          <button key={p.id} type="button" onClick={() => setEditPerms(togglePerm(editPerms, p.id))}
                            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${editPerms.includes(p.id) ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20' : 'bg-[#0a0a0a] text-zinc-600 border border-[#1a1a1a]'}`}>
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(u.permissions || []).map((p) => (
                      <span key={p} className="rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] px-2.5 py-1 text-[10px] font-bold text-zinc-500">
                        {PAGES.find((pg) => pg.id === p)?.label || p}
                      </span>
                    ))}
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
