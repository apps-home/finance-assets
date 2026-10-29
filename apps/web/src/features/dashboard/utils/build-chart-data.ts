import type { Category } from '@/features/categories/api/types'
import {
  CATEGORY_TYPE_LABELS,
  getCategoryCurrency
} from '@/features/categories/utils'

import type { MonthData } from '../types/month-data'
import { getLatestMonthWithData } from './calculate-dashboard-stats'
import { calculateMonthTotal, hasMonthData } from './month-data'

const CURRENCY_BREAKDOWN_LABELS: Record<string, string> = {
  BRL: 'Real (BRL)',
  USD: 'Dólar (USD)',
  EUR: 'Euro (EUR)',
  GBP: 'Libra (GBP)'
}

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

export function buildTypeChartData(data: MonthData[], categories: Category[]) {
  const latestMonth = getLatestMonthWithData(data)
  if (!data.length || !latestMonth) return []

  const totalsByType = new Map<string, number>()

  for (const cat of categories) {
    const label = CATEGORY_TYPE_LABELS[cat.type] ?? cat.type
    const value = (latestMonth[cat.name] as number) ?? 0
    totalsByType.set(label, (totalsByType.get(label) ?? 0) + value)
  }

  return Array.from(totalsByType.entries())
    .map(([name, value], index) => ({
      name,
      value,
      color: `var(--chart-${(index % 5) + 1})`
    }))
    .sort((a, b) => b.value - a.value)
}

export function buildCurrencyChartData(
  data: MonthData[],
  categories: Category[]
) {
  const latestMonth = getLatestMonthWithData(data)
  if (!data.length || !latestMonth) return []

  const totalsByCurrency = new Map<string, number>()

  for (const cat of categories) {
    const currency = getCategoryCurrency(cat)
    const label = CURRENCY_BREAKDOWN_LABELS[currency] ?? currency
    const value = (latestMonth[cat.name] as number) ?? 0
    totalsByCurrency.set(label, (totalsByCurrency.get(label) ?? 0) + value)
  }

  return Array.from(totalsByCurrency.entries())
    .map(([name, value], index) => ({
      name,
      value,
      color: `var(--chart-${(index % 5) + 1})`
    }))
    .sort((a, b) => b.value - a.value)
}

export function buildMainChartData(data: MonthData[]) {
  return data.map((row) => ({
    ...row,
    total: hasMonthData(row) ? calculateMonthTotal(row) : null
  }))
}
