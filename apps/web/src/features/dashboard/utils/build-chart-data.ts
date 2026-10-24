import type { Category } from '@/features/categories/api/types'

import type { MonthData } from '../types/month-data'
import { getLatestMonthWithData } from './calculate-dashboard-stats'
import { calculateMonthTotal } from './month-data'

export function buildCategoryChartData(
  data: MonthData[],
  categories: Category[]
) {
  const latestMonth = getLatestMonthWithData(data)
  if (!data.length || !latestMonth) return []

  return categories
    .map((cat, index) => ({
      name: cat.name,
      value: (latestMonth[cat.name] as number) ?? 0,
      color: `var(--chart-${(index % 5) + 1})`
    }))
    .sort((a, b) => b.value - a.value)
}

export function buildMainChartData(data: MonthData[]) {
  return data.map((row) => ({
    ...row,
    total: calculateMonthTotal(row)
  }))
}
