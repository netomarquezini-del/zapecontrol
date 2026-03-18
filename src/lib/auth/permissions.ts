import { getServerSession } from 'next-auth'
import { authOptions } from './options'
import { UserRole } from '@/types'
import { NextResponse } from 'next/server'

interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
}

const PERMISSIONS: Record<string, UserRole[]> = {
  'manage_users': ['admin'],
  'manage_products': ['admin', 'gerente'],
  'manage_production': ['admin', 'gerente', 'operador'],
  'manage_goals': ['admin', 'gerente'],
  'manage_scoring_rules': ['admin'],
  'view_dashboard': ['admin', 'gerente', 'operador'],
  'export_reports': ['admin', 'gerente'],
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return session.user as SessionUser
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const allowedRoles = PERMISSIONS[permission]
  if (!allowedRoles) return false
  return allowedRoles.includes(role)
}

export async function requirePermission(permission: string) {
  const user = await getSessionUser()
  if (!user) {
    return { error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }), user: null }
  }
  if (!hasPermission(user.role, permission)) {
    return { error: NextResponse.json({ error: 'Sem permissão' }, { status: 403 }), user: null }
  }
  return { error: null, user }
}

export const MENU_PERMISSIONS: Record<string, UserRole[]> = {
  '/': ['admin', 'gerente', 'operador'],
  '/products': ['admin', 'gerente', 'operador'],
  '/production': ['admin', 'gerente', 'operador'],
  '/goals': ['admin', 'gerente'],
  '/reports': ['admin', 'gerente'],
  '/settings/users': ['admin'],
}
