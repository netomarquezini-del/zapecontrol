'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { MENU_PERMISSIONS } from '@/lib/auth/permissions'
import { UserRole } from '@/types'
import {
  LayoutDashboard,
  Package,
  Factory,
  Target,
  FileSpreadsheet,
  Settings,
  Users,
} from 'lucide-react'

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Produtos', icon: Package },
  { href: '/production', label: 'Produção', icon: Factory },
  { href: '/goals', label: 'Metas', icon: Target },
  { href: '/reports', label: 'Relatórios', icon: FileSpreadsheet },
  { href: '/settings/users', label: 'Usuários', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role as UserRole | undefined

  const visibleItems = menuItems.filter((item) => {
    const allowed = MENU_PERMISSIONS[item.href]
    if (!allowed || !userRole) return false
    return allowed.includes(userRole)
  })

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎉</span>
          <span className="font-bold text-lg">FesteJá Control</span>
        </Link>
      </div>
      <nav className="space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
