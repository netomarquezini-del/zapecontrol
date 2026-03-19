export type UserRole = 'admin' | 'gerente' | 'operador' | 'fabrica'

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

// === Module M7: Pedidos vs Produção ===

export type OrderStatus = 'aberto' | 'parcial' | 'concluido' | 'cancelado'
export type Priority = 'normal' | 'urgente' | 'critico'

export interface Order {
  id: string
  code: string
  status: OrderStatus
  created_by: string
  created_at: string
  updated_at: string
  items?: OrderItem[]
  creator?: Pick<User, 'id' | 'name'>
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  priority: Priority
  created_at: string
  product?: Product
}

export interface OrderItemProgress {
  order_item_id: string
  order_id: string
  product_id: string
  quantity_ordered: number
  quantity_delivered: number
  quantity_remaining: number
  progress_percent: number
  priority: Priority
  product_name: string
  product_sku: string
  product_photo: string | null
  order_code: string
  order_status: OrderStatus
  order_date: string
}

export interface Delivery {
  id: string
  order_item_id: string
  quantity: number
  delivery_date: string
  created_by: string
  notes: string | null
  created_at: string
  updated_at: string
  creator?: Pick<User, 'id' | 'name'>
}

export interface OrderDashboardStats {
  openOrders: number
  pendingItems: number
  overallProgress: number
  urgentItems: number
}
