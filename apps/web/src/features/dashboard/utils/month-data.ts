import type { MonthData } from '../types/month-data'

export function isCategoryKey(key: string) {
  return (
    key !== 'month' &&
    key !== 'monthIndex' &&
    key !== 'id' &&
    !key.endsWith('_dividend') &&
    !key.endsWith('_contribution') &&
    !key.endsWith('_exchangeRate')
  )
}

export function calculateMonthTotal(row: MonthData) {
  return Object.keys(row).reduce((acc, key) => {
    if (!isCategoryKey(key)) return acc
    const value = row[key]
    return acc + (typeof value === 'number' ? value : 0)
  }, 0)
}

export function hasMonthData(row: MonthData) {
  return Object.keys(row).some(
    (key) => isCategoryKey(key) && (row[key] as number) > 0
  )
}
