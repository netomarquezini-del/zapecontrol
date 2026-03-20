'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Zap, Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = getSupabase()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Email ou senha incorretos')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="w-full max-w-sm px-6">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400/10 border border-lime-400/20 mb-5">
          <Zap size={24} className="text-lime-400" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-white tracking-tight">ZAPE</span>
          <span className="text-lg font-thin text-zinc-600">control</span>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-700 mt-2">Painel de Controle</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-400/8 border border-red-400/15 px-4 py-3 text-[13px] font-semibold text-red-400">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-2">Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            placeholder="seu@email.com" autoComplete="email"
            className="w-full rounded-xl border border-[#222222] bg-[#111111] px-4 py-3.5 text-[14px] font-semibold text-white placeholder-zinc-700 outline-none focus:border-lime-400/30 transition-colors"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-2">Senha</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            placeholder="••••••••" autoComplete="current-password"
            className="w-full rounded-xl border border-[#222222] bg-[#111111] px-4 py-3.5 text-[14px] font-semibold text-white placeholder-zinc-700 outline-none focus:border-lime-400/30 transition-colors"
          />
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-lime-400 py-3.5 text-[14px] font-extrabold text-black hover:bg-lime-300 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
