import { CategoryType } from '@/features/categories/api/types'
import { MONTH_NAMES } from '@/shared/utils/month-names'

import {
  DividendSource,
  type DividendsMonthSummary,
  type DividendsYearSummary,
  DividendType
} from '../api/types'

export const DIVIDEND_TYPE_LABELS: Record<DividendType, string> = {
  [DividendType.DIVIDEND]: 'Dividendo',
  [DividendType.JCP]: 'JCP',
  [DividendType.INCOME]: 'Rendimento',
  [DividendType.OTHER]: 'Outros'
}

export const DIVIDEND_TYPE_OPTIONS = Object.values(DividendType).map(
  (type) => ({ value: type, label: DIVIDEND_TYPE_LABELS[type] })
)

export const DIVIDEND_SOURCE_LABELS: Record<DividendSource, string> = {
  [DividendSource.MANUAL]: 'Manual',
  [DividendSource.SYNC]: 'Automático'
}

// Cores do gráfico por classe de ativo (tokens --chart-*)
export const CATEGORY_TYPE_CHART_COLORS: Record<CategoryType, string> = {
  [CategoryType.VARIABLE_BR]: 'var(--chart-2)',
  [CategoryType.FII]: 'var(--chart-6)',
  [CategoryType.VARIABLE_US]: 'var(--chart-3)',
  [CategoryType.CRYPTO]: 'var(--chart-4)',
  [CategoryType.FIXED]: 'var(--chart-1)'
}

// Ordem de empilhamento: BR, FII, US e depois as demais classes
export const CATEGORY_TYPE_CHART_ORDER: CategoryType[] = [
  CategoryType.VARIABLE_BR,
  CategoryType.FII,
  CategoryType.VARIABLE_US,
  CategoryType.CRYPTO,
  CategoryType.FIXED
]

export function formatMonthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1].slice(0, 3)}/${String(year).slice(2)}`
}

export interface DividendsChartPoint {
  label: string
  total: number
  [categoryType: string]: number | string
}

interface ChartSource {
  label: string
  total: number
  byCategoryType: DividendsMonthSummary['byCategoryType']
}

/** Série achatada para o BarChart empilhado, e as classes com valor */
function buildStackedData(sources: ChartSource[]) {
  const presentTypes = CATEGORY_TYPE_CHART_ORDER.filter((type) =>
    sources.some((source) => (source.byCategoryType[type] ?? 0) > 0)
  )

  const data: DividendsChartPoint[] = sources.map((source) => ({
    label: source.label,
    total: source.total,
    ...Object.fromEntries(
      presentTypes.map((type) => [type, source.byCategoryType[type] ?? 0])
    )
  }))

  return { data, presentTypes }
}

export function buildChartData(months: DividendsMonthSummary[]) {
  return buildStackedData(
    months.map((month) => ({
      ...month,
      label: formatMonthLabel(month.year, month.month)
    }))
  )
}

export function buildYearChartData(years: DividendsYearSummary[]) {
  return buildStackedData(
    years.map((item) => ({ ...item, label: String(item.year) }))
  )
}
