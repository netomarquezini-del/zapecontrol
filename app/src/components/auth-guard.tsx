'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function check() {
      try {
        const supabase = getSupabase()
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          setAuthenticated(true)
        } else {
          router.replace('/login')
        }
      } catch {
        router.replace('/login')
      }
      setChecking(false)
    }
    check()
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-lime-400" />
      </div>
    )
  }

  if (!authenticated) return null

  return <>{children}</>
}
