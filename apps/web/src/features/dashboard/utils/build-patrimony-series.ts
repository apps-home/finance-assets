import type { AssetWithCategory } from '@/features/assets/api/types'
import type { Category } from '@/features/categories/api/types'
import { MONTH_NAMES } from '@/shared/utils/month-names'

import type { Budget } from '../api/types'

export type ChartPeriod = 'year' | '12M' | '24M' | 'all'

export interface PatrimonyChartRow {
  month: string
  monthIndex: number
  year: number
  /** Patrimônio fechado; `null` quando o mês não tem registro */
  total: number | null
  /** Série pontilhada: último mês fechado → prévia do mês corrente */
  estimate?: number | null
  /** Marca o ponto de prévia em tempo real (mês ainda não fechado) */
  isEstimate?: boolean
  [key: string]: string | number | boolean | null | undefined
}

const round = (value: number) => Math.round(value * 100) / 100

const competenceKey = (year: number, month: number) => year * 12 + (month - 1)

const PERIOD_MONTHS: Record<Exclude<ChartPeriod, 'year' | 'all'>, number> = {
  '12M': 12,
  '24M': 24
}

/**
 * Série contínua (cronológica) cruzando a virada de ano, a partir de todos os
 * registros do usuário. Meses sem registro ficam `null` (linha não despenca).
 */
export function buildMultiYearChartData(
  budgets: Budget[],
  period: Exclude<ChartPeriod, 'year'>,
  now: Date = new Date()
): PatrimonyChartRow[] {
  if (budgets.length === 0) return []

  const totals = new Map<number, number>()

  for (const budget of budgets) {
    const key = competenceKey(budget.year, budget.month)
    totals.set(key, (totals.get(key) ?? 0) + Number(budget.amount))
  }

  const nowKey = competenceKey(now.getFullYear(), now.getMonth() + 1)
  const keys = Array.from(totals.keys())
  const endKey = Math.max(nowKey, ...keys)
  const startKey =
    period === 'all'
      ? Math.min(...keys)
      : endKey - (PERIOD_MONTHS[period] - 1)

  const rows: PatrimonyChartRow[] = []

  for (let key = startKey; key <= endKey; key++) {
    const year = Math.floor(key / 12)
    const monthIndex = (key % 12) + 1
    const total = totals.get(key) ?? 0

    rows.push({
      month: `${MONTH_NAMES[monthIndex - 1].slice(0, 3)}/${String(year).slice(2)}`,
      monthIndex,
      year,
      total: total > 0 ? total : null
    })
  }

  return rows
}

interface CurrentMonthEstimateInput {
  /** Todas as categorias do usuário (qualquer ano) */
  categories: Category[]
  /** Todos os registros do usuário (qualquer ano) */
  budgets: Budget[]
  assets: AssetWithCategory[]
  /** Cotação atual por moeda estrangeira (ex.: `{ USD: 5.4 }`) */
  rates: Record<string, number | undefined>
  now?: Date
}

/**
 * Patrimônio estimado hoje (BRL) para o mês corrente ainda não fechado.
 * Mesma regra do fechamento: posições ativas pela cotação atual; categorias
 * sem posição repetem o último saldo registrado. `null` se o mês já foi
 * fechado ou não há base para estimar.
 */
export function calculateCurrentMonthEstimate({
  categories,
  budgets,
  assets,
  rates,
  now = new Date()
}: CurrentMonthEstimateInput): number | null {
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const currentKey = competenceKey(year, month)

  const isClosed = budgets.some(
    (budget) =>
      competenceKey(budget.year, budget.month) === currentKey &&
      Number(budget.amount) > 0
  )
  if (isClosed) return null

  let total = 0

  for (const category of categories) {
    if (category.years.length > 0 && !category.years.includes(year)) continue

    const previous = budgets
      .filter(
        (budget) =>
          budget.categoryId === category.id &&
          competenceKey(budget.year, budget.month) < currentKey &&
          Number(budget.amount) > 0
      )
      .sort(
        (a, b) =>
          competenceKey(b.year, b.month) - competenceKey(a.year, a.month)
      )[0]

    const balances = assets
      .filter((asset) => asset.categoryId === category.id)
      .map((asset) => asset.currentBalance)
      .filter((balance): balance is number => balance != null)

    if (balances.length > 0) {
      const rate =
        category.currency === 'BRL'
          ? 1
          : (rates[category.currency] ??
            (Number(previous?.exchangeRate) || 1))

      total += balances.reduce((sum, value) => sum + value, 0) * rate
    } else if (previous) {
      total += Number(previous.amount)
    }
  }

  return total > 0 ? round(total) : null
}

/**
 * Liga o último mês fechado ao mês corrente (ainda sem registro) por uma série
 * `estimate`, desenhada pontilhada no gráfico.
 */
export function withCurrentMonthEstimate<T extends PatrimonyChartRow>(
  rows: T[],
  estimate: number | null,
  now: Date = new Date()
): T[] {
  if (estimate == null) return rows

  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const currentIndex = rows.findIndex(
    (row) => row.year === year && row.monthIndex === month && row.total == null
  )
  if (currentIndex < 0) return rows

  let anchorIndex = -1
  for (let index = currentIndex - 1; index >= 0; index--) {
    if (rows[index].total != null) {
      anchorIndex = index
      break
    }
  }

  return rows.map((row, index) => {
    if (index === currentIndex) {
      return { ...row, estimate, isEstimate: true }
    }
    if (index === anchorIndex) {
      return { ...row, estimate: row.total }
    }
    return row
  })
}
