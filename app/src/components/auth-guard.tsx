'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2, ShieldX } from 'lucide-react'

// Map route paths to permission IDs
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/acompanhamento': 'acompanhamento',
  '/lancamentos': 'lancamentos',
  '/lancamentos-ext': 'lancamentos',
  '/metas': 'metas',
  '/cadastros': 'cadastros',
  '/usuarios': 'usuarios',
  '/diario': 'diario',
  '/diario-registro': 'diario',
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    async function check() {
      try {
        const supabase = getSupabase()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.replace('/login')
          setChecking(false)
          return
        }

        setAuthenticated(true)

        // Get user permissions
        const { data: appUser } = await supabase
          .from('app_users')
          .select('role, permissions')
          .eq('auth_id', session.user.id)
          .single()

        // Admin has access to everything
        if (appUser?.role === 'admin') {
          setAuthorized(true)
          setChecking(false)
          return
        }

        // Check permission for current route
        const requiredPerm = ROUTE_PERMISSIONS[pathname] || null
        const userPerms: string[] = appUser?.permissions || []

        if (!requiredPerm || userPerms.includes(requiredPerm)) {
          setAuthorized(true)
        } else {
          setAuthorized(false)
        }
      } catch {
        router.replace('/login')
      }
      setChecking(false)
    }
    check()
  }, [router, pathname])

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-lime-400" />
      </div>
    )
  }

  if (!authenticated) return null

  if (!authorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <ShieldX size={40} className="text-red-400" />
        <p className="text-[15px] font-extrabold text-white">Acesso Negado</p>
        <p className="text-[12px] font-semibold text-zinc-600">Voce nao tem permissao para acessar esta pagina</p>
        <button
          onClick={() => router.back()}
          className="mt-2 rounded-xl border border-[#222222] bg-[#111111] px-5 py-2.5 text-[12px] font-bold text-zinc-400 hover:text-white hover:border-lime-400/20 transition-all cursor-pointer"
        >
          Voltar
        </button>
      </div>
    )
  }

  return <>{children}</>
}
