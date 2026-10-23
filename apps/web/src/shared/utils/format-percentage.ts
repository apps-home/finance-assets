export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function calcPercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export function calcMonthChange(
  current: number | null | undefined,
  lastMonth: number | null | undefined
): number | null {
  if (current == null || lastMonth == null || lastMonth === 0) return null
  return calcPercentageChange(current, lastMonth)
}
