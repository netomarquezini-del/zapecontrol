export type UserRole = 'admin' | 'gerente' | 'operador'

export type ProductType = 'embalado' | 'desembalado'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  sku: string
  name: string
  photo_url: string | null
  type: ProductType
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductionEntry {
  id: string
  product_id: string
  quantity: number
  production_date: string
  created_by: string
  created_at: string
  updated_at: string
  product?: Product
  user?: Pick<User, 'id' | 'name'>
}

export interface ScoringRule {
  id: string
  name: string
  condition_type: 'product_type' | 'specific_sku' | 'category'
  condition_value: string
  points: number
  priority: number
  is_active: boolean
  created_at: string
}

export interface Goal {
  id: string
  product_id: string | null
  daily_target: number | null
  weekly_target: number | null
  monthly_target: number | null
  valid_from: string
  valid_until: string | null
  created_at: string
}

export interface DashboardStats {
  todayQuantity: number
  todayPoints: number
  todayGoal: number | null
  todayPercentage: number | null
  weekQuantity: number
  weekPoints: number
  weekComparison: number | null
}

export interface ProductionChartData {
  date: string
  quantity: number
  points: number
  goal: number | null
}

export interface ProductRanking {
  product_id: string
  product_name: string
  product_sku: string
  product_type: ProductType
  photo_url: string | null
  total_quantity: number
  total_points: number
}
