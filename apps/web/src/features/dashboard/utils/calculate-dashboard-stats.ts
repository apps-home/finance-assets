import { type Category, CategoryType } from '@/features/categories/api/types'

import type { Budget } from '../api/types'
import type { MonthData } from '../types/month-data'
import { calculateMonthTotal, hasMonthData, isCategoryKey } from './month-data'

export interface DashboardStats {
  total: number
  growth: number
  totalBonds: number
  totalStocks: number
  totalDividends: number
  referenceMonth: string
}

export const EMPTY_DASHBOARD_STATS: DashboardStats = {
  total: 0,
  growth: 0,
  totalBonds: 0,
  totalStocks: 0,
  totalDividends: 0,
  referenceMonth: ''
}

export function getLatestMonthWithData(data: MonthData[]) {
  if (!data.length) return null

  for (let i = data.length - 1; i >= 0; i--) {
    if (hasMonthData(data[i])) return data[i]
  }

  return data[data.length - 1]
}

export function calculateDashboardStats(
  data: MonthData[],
  categories: Category[],
  budgets: Budget[]
): DashboardStats {
  const latestMonth = getLatestMonthWithData(data)

  if (!data.length || !categories.length || !latestMonth) {
    return EMPTY_DASHBOARD_STATS
  }

  const fixedCategoryNames = categories
    .filter((cat) => cat.type === CategoryType.FIXED)
    .map((cat) => cat.name)

  let totalBonds = 0
  let totalStocks = 0

  Object.keys(latestMonth).forEach((key) => {
    if (!isCategoryKey(key)) return

    const value = latestMonth[key] as number
    if (fixedCategoryNames.includes(key)) {
      totalBonds += value
    } else {
      totalStocks += value
    }
  })

  const totalCurrent = totalBonds + totalStocks

  const firstMonth = data.find(hasMonthData) ?? data[0]
  const totalFirst = calculateMonthTotal(firstMonth)

  const growth =
    totalFirst > 0 ? ((totalCurrent - totalFirst) / totalFirst) * 100 : 0

  const totalDividends = budgets.reduce(
    (acc, budget) =>
      acc + (budget.dividendAmount ? Number(budget.dividendAmount) : 0),
    0
  )

  return {
    total: totalCurrent,
    growth,
    totalBonds,
    totalStocks,
    totalDividends,
    referenceMonth: latestMonth.month as string
  }
}
