'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Routes that require specific permissions
// If a route is NOT listed here, it's accessible to ALL logged-in users
const RESTRICTED_ROUTES: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/acompanhamento': 'acompanhamento',
  '/lancamentos-ext': 'lancamentos',
  '/metas': 'metas',
  '/cadastros': 'cadastros',
  '/usuarios': 'usuarios',
  '/diario': 'diario',
  '/diario-registro': 'diario',
  '/cs-monitor': 'cs-monitor',
  '/cs-healthscore': 'cs-monitor',
  '/cs-relatorios': 'cs-monitor',
  '/cs-analytics': 'cs-monitor',
}

// /inicio is always accessible to any logged-in user

const PERM_TO_ROUTE: Record<string, string> = {
  dashboard: '/dashboard',
  acompanhamento: '/acompanhamento',
  lancamentos: '/lancamentos-ext',
  metas: '/metas',
  cadastros: '/cadastros',
  usuarios: '/usuarios',
  diario: '/diario',
  'cs-monitor': '/cs-monitor',
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

        // Check if this route is restricted
        const requiredPerm = RESTRICTED_ROUTES[pathname]

        if (!requiredPerm) {
          // Route is not restricted — everyone can access (dashboard, home, etc)
          setAuthorized(true)
        } else if (userPerms.includes(requiredPerm)) {
          // User has the required permission
          setAuthorized(true)
        } else {
          // No permission — redirect to inicio (always accessible)
          router.replace('/inicio')
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
