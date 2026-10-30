import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useAssets } from '@/features/assets/hooks/use-assets'
import { useCategories } from '@/features/categories/hooks/use-category'
import { getCurrencyQuote } from '@/infrastructure/services/external/get-currency'

import {
  buildCategoryChartData,
  buildCurrencyChartData,
  buildMainChartData,
  buildTypeChartData
} from '../utils/build-chart-data'
import { buildDashboardData } from '../utils/build-dashboard-data'
import {
  buildMultiYearChartData,
  type ChartPeriod,
  calculateCurrentMonthEstimate,
  withCurrentMonthEstimate
} from '../utils/build-patrimony-series'
import {
  buildWealthBridge,
  withWealthDecomposition
} from '../utils/build-wealth-decomposition'
import { calculateDashboardStats } from '../utils/calculate-dashboard-stats'
import { calculateNetWorthBreakdown } from '../utils/patrimony-items'
import { useBudgets } from './use-budget'
import { usePatrimonyItems } from './use-patrimony-items'

const EMPTY_PATRIMONY_SUMMARY = {
  totalPhysicalAssets: 0,
  totalLiabilities: 0,
  netPhysicalBalance: 0
}

export function useDashboard(year: number, period: ChartPeriod = 'year') {
  const { data: budgets = [], isLoading: isLoadingBudgets } = useBudgets({
    year
  })
  const { data: categories = [], isLoading: isLoadingCategories } =
    useCategories({ year })

  const isLoading = isLoadingCategories || isLoadingBudgets

  const dashboardData = useMemo(
    () => (isLoading ? [] : buildDashboardData(categories, budgets)),
    [categories, budgets, isLoading]
  )

  const stats = useMemo(
    () => calculateDashboardStats(dashboardData, categories, budgets),
    [dashboardData, categories, budgets]
  )

  const categoryChartData = useMemo(
    () => buildCategoryChartData(dashboardData, categories),
    [dashboardData, categories]
  )

  const typeChartData = useMemo(
    () => buildTypeChartData(dashboardData, categories),
    [dashboardData, categories]
  )

  const currencyChartData = useMemo(
    () => buildCurrencyChartData(dashboardData, categories),
    [dashboardData, categories]
  )

  // Histórico completo: série multi-anual e base da prévia do mês corrente
  const { data: allBudgets = [] } = useBudgets()
  const { data: allCategories = [] } = useCategories()
  const { data: activeAssets = [] } = useAssets({ status: 'ACTIVE' })

  const foreignCurrencies = useMemo(
    () =>
      Array.from(
        new Set(
          allCategories
            .map((category) => category.currency)
            .filter((currency) => currency !== 'BRL')
        )
      ).sort(),
    [allCategories]
  )

  const quoteResults = useQueries({
    queries: foreignCurrencies.map((currency) => ({
      queryKey: ['currency-quote', currency],
      queryFn: () => getCurrencyQuote(currency),
      staleTime: 5 * 60 * 1000
    }))
  })

  const quotesKey = quoteResults
    .map((result) => result.data?.bid ?? '')
    .join('|')

  // biome-ignore lint/correctness/useExhaustiveDependencies: quotesKey resume as cotações
  const rates = useMemo(() => {
    const result: Record<string, number | undefined> = {}
    foreignCurrencies.forEach((currency, index) => {
      const bid = Number.parseFloat(quoteResults[index]?.data?.bid ?? '')
      if (Number.isFinite(bid) && bid > 0) result[currency] = bid
    })
    return result
  }, [foreignCurrencies, quotesKey])

  const decomposedRows = useMemo(() => {
    const rows =
      period === 'year'
        ? buildMainChartData(dashboardData, year)
        : buildMultiYearChartData(allBudgets, period)

    return withWealthDecomposition(rows, allBudgets)
  }, [period, dashboardData, year, allBudgets])

  const mainChartData = useMemo(() => {
    const estimate = calculateCurrentMonthEstimate({
      categories: allCategories,
      budgets: allBudgets,
      assets: activeAssets,
      rates
    })

    return withCurrentMonthEstimate(decomposedRows, estimate)
  }, [decomposedRows, allBudgets, allCategories, activeAssets, rates])

  const wealthBridge = useMemo(
    () => buildWealthBridge(decomposedRows),
    [decomposedRows]
  )

  const { data: patrimonyData } = usePatrimonyItems()
  const patrimonyItems = patrimonyData?.items ?? []
  const patrimonySummary = patrimonyData?.summary ?? EMPTY_PATRIMONY_SUMMARY

  const netWorthBreakdown = useMemo(
    () => calculateNetWorthBreakdown(stats.total, patrimonySummary),
    [stats.total, patrimonySummary]
  )

  return {
    isLoading,
    categories,
    dashboardData,
    stats,
    categoryChartData,
    typeChartData,
    currencyChartData,
    mainChartData,
    wealthBridge,
    patrimonyItems,
    patrimonySummary,
    netWorthBreakdown
  }
}
