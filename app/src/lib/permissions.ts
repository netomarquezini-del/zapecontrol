// ---------------------------------------------------------------------------
// Permission Registry — single source of truth
// ---------------------------------------------------------------------------

export interface PermissionItem {
  id: string
  label: string
  group: string
}

export interface PermissionGroup {
  id: string
  label: string
  items: PermissionItem[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'comercial',
    label: 'Comercial',
    items: [
      { id: 'comercial.dashboard', label: 'Dashboard', group: 'comercial' },
      { id: 'comercial.acompanhamento', label: 'Acompanhamento', group: 'comercial' },
      { id: 'comercial.lancamentos', label: 'Lancamentos', group: 'comercial' },
      { id: 'comercial.metas', label: 'Metas', group: 'comercial' },
      { id: 'comercial.cadastros', label: 'Cadastros', group: 'comercial' },
      { id: 'comercial.sales-copilot', label: 'Sales Copilot', group: 'comercial' },
      { id: 'comercial.relatorios', label: 'Relatorios', group: 'comercial' },
    ],
  },
  {
    id: 'cs',
    label: 'Customer Success',
    items: [
      { id: 'cs.monitor', label: 'CS Monitor', group: 'cs' },
      { id: 'cs.analytics', label: 'Analytics Geral', group: 'cs' },
      { id: 'cs.consultores', label: 'Consultores', group: 'cs' },
      { id: 'cs.clientes', label: 'Clientes', group: 'cs' },
      { id: 'cs.comunidade', label: 'Prog. Aceleracao', group: 'cs' },
      { id: 'cs.shopee-ads', label: 'Shopee ADS', group: 'cs' },
      { id: 'cs.healthscore', label: 'Health Score', group: 'cs' },
      { id: 'cs.relatorios', label: 'Relatorios', group: 'cs' },
    ],
  },
  {
    id: 'trafego',
    label: 'Trafego Pago',
    items: [
      { id: 'trafego.meta-ads', label: 'Meta Ads', group: 'trafego' },
      { id: 'trafego.roas-real', label: 'ROAS Real', group: 'trafego' },
      { id: 'trafego.vendas-ticto', label: 'Vendas Ticto', group: 'trafego' },
      { id: 'trafego.transacoes', label: 'Transacoes', group: 'trafego' },
    ],
  },
  {
    id: 'configuracoes',
    label: 'Configuracoes',
    items: [
      { id: 'configuracoes.usuarios', label: 'Usuarios', group: 'configuracoes' },
    ],
  },
]

// Flat lookup: permission ID -> route path
export const PERM_TO_ROUTE: Record<string, string> = {
  'comercial.dashboard': '/dashboard',
  'comercial.acompanhamento': '/acompanhamento',
  'comercial.lancamentos': '/lancamentos-ext',
  'comercial.metas': '/metas',
  'comercial.cadastros': '/cadastros',
  'comercial.sales-copilot': '/comercial/sales-copilot',
  'comercial.relatorios': '/relatorios',
  'cs.monitor': '/cs-monitor',
  'cs.analytics': '/cs-analytics',
  'cs.consultores': '/cs-consultores',
  'cs.clientes': '/cs-clientes',
  'cs.comunidade': '/cs-comunidade',
  'cs.shopee-ads': '/cs-shopee-ads',
  'cs.healthscore': '/cs-healthscore',
  'cs.relatorios': '/cs-relatorios',
  'trafego.meta-ads': '/meta-ads',
  'trafego.roas-real': '/meta-ads/roas-real',
  'trafego.vendas-ticto': '/infoprodutos',
  'trafego.transacoes': '/infoprodutos/transacoes',
  'configuracoes.usuarios': '/usuarios',
}

// Reverse lookup: route path -> permission ID
export const ROUTE_TO_PERM: Record<string, string> = Object.fromEntries(
  Object.entries(PERM_TO_ROUTE).map(([perm, route]) => [route, perm])
)

// Helper: get all permission IDs as flat array
export function getAllPermissionIds(): string[] {
  return PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.id))
}

// Role template type (matches DB)
export interface RoleTemplate {
  id: string
  slug: string
  label: string
  description: string | null
  permissions: string[]
  is_system: boolean
}
