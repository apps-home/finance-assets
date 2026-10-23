import type { Category } from '@/features/categories/api/types'
import { MONTH_NAMES } from '@/shared/utils/month-names'

import type { Budget } from '../api/types'
import type { MonthData } from '../types/month-data'

export function buildDashboardData(
  categories: Category[],
  budgets: Budget[]
): MonthData[] {
  const months = MONTH_NAMES.map((month, index) => {
    const row: MonthData = {
      month,
      monthIndex: index + 1
    }

    categories.forEach((cat) => {
      row[cat.name] = 0
    })

    return row
  })

  budgets.forEach((budget) => {
    const monthIndex = budget.month - 1
    if (monthIndex < 0 || monthIndex >= 12) return

    const category = categories.find((c) => c.id === budget.categoryId)
    if (!category) return

    months[monthIndex][category.name] = Number(budget.amount)
    months[monthIndex][`${category.name}_dividend`] = budget.dividendAmount
      ? Number(budget.dividendAmount)
      : 0
  })

  return months
}
