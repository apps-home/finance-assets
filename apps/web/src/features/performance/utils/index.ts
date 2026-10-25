import type { PerformancePeriodKey, PerformancePoint } from '../api/types'

export type SeriesKey = 'portfolio' | 'cdi' | 'ibov' | 'sp500'

export const SERIES_LABELS: Record<SeriesKey, string> = {
  portfolio: 'Sua carteira',
  cdi: '100% do CDI',
  ibov: 'Ibovespa',
  sp500: 'S&P 500 (em R$)'
}

// Tokens --chart-*: verde (carteira), âmbar, azul e violeta
export const SERIES_COLORS: Record<SeriesKey, string> = {
  portfolio: 'var(--chart-1)',
  cdi: 'var(--chart-4)',
  ibov: 'var(--chart-2)',
  sp500: 'var(--chart-3)'
}

export const SERIES_KEYS: SeriesKey[] = ['portfolio', 'cdi', 'ibov', 'sp500']

export const PERIOD_LABELS: Record<PerformancePeriodKey, string> = {
  ytd: 'No ano',
  '12m': '12 meses',
  all: 'Desde o início'
}

const SHORT_MONTHS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez'
]

export function formatMonthLabel(point: { year: number; month: number }) {
  return `${SHORT_MONTHS[point.month - 1]}/${String(point.year).slice(2)}`
}

/** Pontos do período escolhido, rebaseados para começar em 0% */
export function sliceSeries(
  series: PerformancePoint[],
  period: PerformancePeriodKey
): PerformancePoint[] {
  if (series.length === 0 || period === 'all') return series

  const last = series[series.length - 1]
  const lastIndex = last.year * 12 + last.month

  const startIndex = period === 'ytd' ? last.year * 12 : lastIndex - 12

  // O ponto imediatamente anterior ao período é a base (0%)
  const firstInside = series.findIndex(
    (point) => point.year * 12 + point.month > startIndex
  )

  if (firstInside <= 0) return series

  const baseIndex = firstInside - 1
  const base = series[baseIndex]
  const rebase = (value: number | null, baseValue: number | null) =>
    value === null || baseValue === null
      ? null
      : ((1 + value / 100) / (1 + baseValue / 100) - 1) * 100

  return series.slice(baseIndex).map((point) => ({
    year: point.year,
    month: point.month,
    portfolio: rebase(point.portfolio, base.portfolio) ?? 0,
    cdi: rebase(point.cdi, base.cdi),
    ibov: rebase(point.ibov, base.ibov),
    sp500: rebase(point.sp500, base.sp500)
  }))
}
