'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

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

// Permission-to-first-route mapping (for redirect)
const PERM_TO_ROUTE: Record<string, string> = {
  dashboard: '/dashboard',
  acompanhamento: '/acompanhamento',
  lancamentos: '/lancamentos-ext',
  metas: '/metas',
  cadastros: '/cadastros',
  usuarios: '/usuarios',
  diario: '/diario',
}

interface AuthContextType {
  permissions: string[]
  role: string
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({ permissions: [], role: '', isAdmin: false })

export function useAuth() { return useContext(AuthContext) }

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [permissions, setPermissions] = useState<string[]>([])
  const [role, setRole] = useState('')
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

        const { data: appUser } = await supabase
          .from('app_users')
          .select('role, permissions')
          .eq('auth_id', session.user.id)
          .single()

        const userRole = appUser?.role || 'viewer'
        const userPerms: string[] = appUser?.permissions || []
        setRole(userRole)
        setPermissions(userPerms)

        // Admin has access to everything
        if (userRole === 'admin') {
          setAuthorized(true)
          setChecking(false)
          return
        }

        // Check permission for current route
        const requiredPerm = ROUTE_PERMISSIONS[pathname] || null

        if (!requiredPerm || userPerms.includes(requiredPerm)) {
          setAuthorized(true)
        } else {
          // Redirect to first allowed page
          const firstAllowed = userPerms.find((p) => PERM_TO_ROUTE[p])
          if (firstAllowed) {
            router.replace(PERM_TO_ROUTE[firstAllowed])
          } else {
            // No permissions at all — just show denied
            setAuthorized(false)
          }
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

  if (!authenticated || !authorized) return null

  return (
    <AuthContext.Provider value={{ permissions, role, isAdmin: role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}
