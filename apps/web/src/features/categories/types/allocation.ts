import { CategoryType } from '@/features/categories/api/types'

export type AllocationStatus = 'BALANCED' | 'WARNING' | 'CRITICAL' | 'NOT_SET'

export type AllocationDirection =
  | 'UNDER_ALLOCATED'
  | 'OVER_ALLOCATED'
  | 'ON_TARGET'

export interface CategoryAllocation {
  categoryId: string
  categoryName: string
  categoryType: CategoryType
  currency: string
  currentBalance: number
  targetPercentage: number | null
  actualPercentage: number
  gap: number
  status: AllocationStatus
  direction: AllocationDirection
}

export interface PortfolioAllocationSummary {
  totalBalance: number
  totalTargetPercentage: number
  isOverAllocated: boolean
  balancedCount: number
  warningCount: number
  criticalCount: number
  allocations: CategoryAllocation[]
}
