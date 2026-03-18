import { Product, ScoringRule } from '@/types'

export function calculatePoints(
  product: Product,
  quantity: number,
  rules: ScoringRule[]
): number {
  // Sort by priority DESC — first match wins
  const sorted = [...rules]
    .filter((r) => r.is_active)
    .sort((a, b) => b.priority - a.priority)

  for (const rule of sorted) {
    let matches = false

    switch (rule.condition_type) {
      case 'specific_sku':
        matches = product.sku === rule.condition_value
        break
      case 'product_type':
        matches = product.type === rule.condition_value
        break
      case 'category':
        // Future: category matching
        break
    }

    if (matches) {
      return quantity * rule.points
    }
  }

  // Fallback: 1.0 point per unit
  return quantity * 1.0
}

export function getGoalIndicator(percentage: number | null): {
  color: string
  emoji: string
  label: string
} {
  if (percentage === null) return { color: 'text-gray-400', emoji: '⚪', label: 'Sem meta' }
  if (percentage >= 100) return { color: 'text-green-600', emoji: '🟢', label: 'Atingida' }
  if (percentage >= 70) return { color: 'text-yellow-600', emoji: '🟡', label: 'Em progresso' }
  return { color: 'text-red-600', emoji: '🔴', label: 'Abaixo' }
}
