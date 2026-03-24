'use client'

import { useState } from 'react'
import { X, KeyRound, Loader2, Check, AlertCircle } from 'lucide-react'

interface ResetPasswordModalProps {
  userId: string
  userName: string
  onClose: () => void
  onSuccess: () => void
}

export default function ResetPasswordModal({ userId, userName, onClose, onSuccess }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const inputCls = "w-full rounded-xl border border-[#222222] bg-[#111111] px-4 py-3 text-[13px] font-semibold text-white placeholder-zinc-700 outline-none focus:border-lime-400/30 transition-colors"

  const handleSave = async () => {
    if (password.length < 6) {
      setFeedback({ type: 'error', msg: 'Senha deve ter no minimo 6 caracteres' })
      return
    }
    if (password !== confirm) {
      setFeedback({ type: 'error', msg: 'Senhas nao conferem' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setFeedback({ type: 'error', msg: data.error || 'Erro ao resetar senha' })
      } else {
        setFeedback({ type: 'success', msg: 'Senha alterada com sucesso!' })
        setTimeout(() => { onSuccess(); onClose() }, 1200)
      }
    } catch {
      setFeedback({ type: 'error', msg: 'Erro inesperado' })
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#222222] bg-[#0a0a0a] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#222222]">
          <div>
            <h2 className="text-base font-extrabold text-white">Resetar Senha</h2>
            <p className="text-[11px] font-semibold text-zinc-600 mt-0.5">{userName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-zinc-600 hover:text-white hover:bg-white/5 cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {feedback && (
            <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[12px] font-semibold border ${
              feedback.type === 'success' ? 'bg-lime-400/8 border-lime-400/15 text-lime-400' : 'bg-red-400/8 border-red-400/15 text-red-400'
            }`}>
              {feedback.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              {feedback.msg}
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Nova Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimo 6 caracteres" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Confirmar Senha</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a senha"
              onKeyDown={(e) => e.key === 'Enter' && password && confirm && !saving && handleSave()}
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#222222]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12px] font-bold text-zinc-500 hover:text-white cursor-pointer">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || !password || !confirm}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-lime-400/10 border border-lime-400/20 text-[12px] font-bold text-lime-400 hover:bg-lime-400/15 cursor-pointer disabled:opacity-40"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
            Resetar
          </button>
        </div>
      </div>
    </div>
  )
}
