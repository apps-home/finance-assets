import { Category } from '@/features/categories/api/types'
import {
  AllocationDirection,
  AllocationStatus,
  CategoryAllocation,
  PortfolioAllocationSummary
} from '@/features/categories/types/allocation'

export const ALLOCATION_THRESHOLDS = {
  BALANCED: 2.0,
  WARNING: 5.0
} as const

/**
 * `categoryBalances` vem na moeda de cada categoria; `exchangeRates` (moeda ->
 * cotação em R$) converte para comparar categorias BRL e USD na mesma base.
 */
export function calculateAllocations(
  categories: Category[],
  categoryBalances: Map<string, number>,
  exchangeRates: Record<string, number> = {}
): PortfolioAllocationSummary {
  const toBRL = (category: Category) =>
    (categoryBalances.get(category.id) ?? 0) *
    (category.currency === 'BRL' ? 1 : (exchangeRates[category.currency] ?? 1))

  const totalBalance = categories.reduce(
    (sum, category) => sum + toBRL(category),
    0
  )

  let totalTargetPercentage = 0
  let balancedCount = 0
  let warningCount = 0
  let criticalCount = 0

  const allocations: CategoryAllocation[] = categories.map((category) => {
    const currentBalance = categoryBalances.get(category.id) ?? 0
    const balanceInBRL = toBRL(category)
    const targetPercentage = category.targetPercentage ?? null

    if (targetPercentage != null && targetPercentage > 0) {
      totalTargetPercentage += targetPercentage
    }

    const actualPercentage =
      totalBalance > 0 ? (balanceInBRL / totalBalance) * 100 : 0

    let gap = 0
    let status: AllocationStatus = 'NOT_SET'
    let direction: AllocationDirection = 'ON_TARGET'

    if (targetPercentage != null && targetPercentage > 0) {
      gap = actualPercentage - targetPercentage
      const absGap = Math.abs(gap)

      if (absGap <= ALLOCATION_THRESHOLDS.BALANCED) {
        status = 'BALANCED'
        direction = 'ON_TARGET'
        balancedCount++
      } else if (absGap <= ALLOCATION_THRESHOLDS.WARNING) {
        status = 'WARNING'
        direction = gap > 0 ? 'OVER_ALLOCATED' : 'UNDER_ALLOCATED'
        warningCount++
      } else {
        status = 'CRITICAL'
        direction = gap > 0 ? 'OVER_ALLOCATED' : 'UNDER_ALLOCATED'
        criticalCount++
      }
    }

    return {
      categoryId: category.id,
      categoryName: category.name,
      categoryType: category.type,
      currency: category.currency,
      currentBalance,
      balanceInBRL,
      targetPercentage,
      actualPercentage,
      gap,
      status,
      direction
    }
  })

  return {
    totalBalance,
    totalTargetPercentage,
    isOverAllocated: totalTargetPercentage > 100,
    balancedCount,
    warningCount,
    criticalCount,
    allocations
  }
}
