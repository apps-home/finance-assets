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

export function calculateAllocations(
	categories: Category[],
	categoryBalances: Map<string, number>
): PortfolioAllocationSummary {
	const totalBalance = categories.reduce((sum, category) => {
		return sum + (categoryBalances.get(category.id) ?? 0)
	}, 0)

	let totalTargetPercentage = 0
	let balancedCount = 0
	let warningCount = 0
	let criticalCount = 0

	const allocations: CategoryAllocation[] = categories.map((category) => {
		const currentBalance = categoryBalances.get(category.id) ?? 0
		const targetPercentage = category.targetPercentage ?? null

		if (targetPercentage != null && targetPercentage > 0) {
			totalTargetPercentage += targetPercentage
		}

		const actualPercentage =
			totalBalance > 0 ? (currentBalance / totalBalance) * 100 : 0

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
