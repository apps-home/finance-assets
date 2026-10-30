import type { Budget } from '../api/types'
import type { PatrimonyChartRow } from './build-patrimony-series'

const competenceKey = (year: number, month: number) => year * 12 + (month - 1)

const round = (value: number) => Math.round(value * 100) / 100

export interface DecomposedRow extends PatrimonyChartRow {
  /** Patrimônio inicial + aportes líquidos acumulados (sem rendimento) */
  invested?: number | null
  /** Ganho de mercado acumulado: `total - invested` */
  marketGain?: number | null
}

/**
 * Esforço (aportes) vs. bola de neve (rendimentos).
 *
 * Para cada mês fechado `t` (após o primeiro da janela):
 *   invested[t]   = V1 + Σ contributionAmount
 *   marketGain[t] = V[t] - invested[t]   (= Σ (ΔV - C))
 * Meses sem registro entre dois fechados têm seus aportes somados no próximo
 * mês fechado, para a soma continuar batendo com o patrimônio.
 */
export function withWealthDecomposition<T extends PatrimonyChartRow>(
  rows: T[],
  budgets: Budget[]
): Array<T & DecomposedRow> {
  const contributions = new Map<number, number>()

  for (const budget of budgets) {
    const key = competenceKey(budget.year, budget.month)
    contributions.set(
      key,
      (contributions.get(key) ?? 0) + (Number(budget.contributionAmount) || 0)
    )
  }

  let previousKey: number | null = null
  let invested = 0

  return rows.map((row) => {
    if (row.total == null) return row

    const key = competenceKey(row.year, row.monthIndex)

    if (previousKey === null) {
      invested = row.total
    } else {
      for (let k = previousKey + 1; k <= key; k++) {
        invested += contributions.get(k) ?? 0
      }
    }
    previousKey = key

    return {
      ...row,
      invested: round(invested),
      marketGain: round(row.total - invested)
    }
  })
}

export interface WealthBridge {
  start: number
  contributions: number
  marketGain: number
  end: number
  /** Crescimento total do período em % sobre o início */
  growthPct: number | null
  /** Fatia do crescimento vinda dos aportes (0–100) */
  contributionShare: number | null
  /** Fatia do crescimento vinda de valorização e juros (0–100) */
  marketGainShare: number | null
  startLabel: string
  endLabel: string
}

/** Ponte patrimonial entre o primeiro e o último mês fechado da janela */
export function buildWealthBridge(rows: DecomposedRow[]): WealthBridge | null {
  const closed = rows.filter((row) => row.total != null && row.invested != null)
  if (closed.length < 2) return null

  const first = closed[0]
  const last = closed[closed.length - 1]

  const start = first.total as number
  const end = last.total as number
  const contributions = round((last.invested as number) - start)
  const marketGain = round(end - (last.invested as number))
  const growth = end - start

  return {
    start,
    contributions,
    marketGain,
    end,
    growthPct: start > 0 ? (growth / start) * 100 : null,
    contributionShare: growth > 0 ? (contributions / growth) * 100 : null,
    marketGainShare: growth > 0 ? (marketGain / growth) * 100 : null,
    startLabel: first.month,
    endLabel: last.month
  }
}
