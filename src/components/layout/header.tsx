'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut } from 'lucide-react'

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  gerente: 'bg-blue-100 text-blue-700',
  operador: 'bg-green-100 text-green-700',
}

export function Header() {
  const { data: session } = useSession()
  const user = session?.user as any

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-muted-foreground">
        Painel de Controle
      </h1>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm text-muted-foreground">{user.name}</span>
            <Badge className={roleBadgeColors[user.role] || ''} variant="secondary">
              {user.role}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
