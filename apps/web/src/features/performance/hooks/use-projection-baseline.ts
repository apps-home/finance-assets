import { useMemo } from 'react'

import { useBudgets } from '@/features/dashboard/hooks/use-budget'
import { useDividendsSummary } from '@/features/dividends/hooks/use-dividends'

import { annualizeReturn } from '../utils/projection'
import { usePortfolioPerformance } from './use-performance'

export interface ProjectionBaseline {
  /** Patrimônio do mês mais recente registrado, em R$ */
  currentWealth: number
  /** Rentabilidade histórica ao ano, em %; null com menos de 12 meses */
  historicalReturnPct: number | null
  /** Média dos aportes registrados nos últimos 12 meses, em R$ */
  averageContribution: number
  /** Proventos líquidos dos últimos 12 meses, em R$ */
  dividends12m: number
  isLoading: boolean
}

/**
 * Ponto de partida da projeção a partir do que já está registrado: saldo
 * consolidado (fechamentos mensais), rentabilidade da carteira, aportes do
 * fechamento e proventos recebidos.
 */
export function useProjectionBaseline(): ProjectionBaseline {
  const now = new Date()
  const year = now.getFullYear()

  const { data: performance, isLoading: isLoadingPerformance } =
    usePortfolioPerformance({ scope: 'all' })
  const { data: currentBudgets = [], isLoading: isLoadingCurrent } = useBudgets(
    { year }
  )
  const { data: previousBudgets = [], isLoading: isLoadingPrevious } =
    useBudgets({ year: year - 1 })
  const { data: dividends, isLoading: isLoadingDividends } =
    useDividendsSummary()

  return useMemo(() => {
    const currentWealth = (performance?.byCategory ?? []).reduce(
      (sum, item) => sum + item.latestAmount,
      0
    )

    const period = (key: string) =>
      performance?.periods.find((item) => item.period === key)
    const all = period('all')
    const last12 = period('12m')
    const historicalReturnPct =
      (all && annualizeReturn(all.portfolio, all.months)) ??
      (last12 && annualizeReturn(last12.portfolio, last12.months)) ??
      null

    // Janela de 12 meses que termina no último mês com registro
    const budgets = [...previousBudgets, ...currentBudgets]
    const monthIndex = (budget: { year: number; month: number }) =>
      budget.year * 12 + budget.month - 1
    const latest = budgets.reduce(
      (max, budget) => Math.max(max, monthIndex(budget)),
      -1
    )
    const window = budgets.filter((budget) => latest - monthIndex(budget) < 12)
    const monthsWithRecords = new Set(window.map(monthIndex)).size
    const averageContribution =
      monthsWithRecords > 0
        ? window.reduce(
            (sum, budget) => sum + Number(budget.contributionAmount ?? 0),
            0
          ) / monthsWithRecords
        : 0

    const dividends12m = (dividends?.last12Months ?? []).reduce(
      (sum, item) => sum + item.total,
      0
    )

    return {
      currentWealth,
      historicalReturnPct,
      averageContribution,
      dividends12m,
      isLoading:
        isLoadingPerformance ||
        isLoadingCurrent ||
        isLoadingPrevious ||
        isLoadingDividends
    }
  }, [
    performance,
    currentBudgets,
    previousBudgets,
    dividends,
    isLoadingPerformance,
    isLoadingCurrent,
    isLoadingPrevious,
    isLoadingDividends
  ])
}
