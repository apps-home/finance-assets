import { useMemo } from 'react'

import { useCategories } from '@/features/categories/hooks/use-category'

import {
  buildCategoryChartData,
  buildCurrencyChartData,
  buildMainChartData,
  buildTypeChartData
} from '../utils/build-chart-data'
import { buildDashboardData } from '../utils/build-dashboard-data'
import { calculateDashboardStats } from '../utils/calculate-dashboard-stats'
import { useBudgets } from './use-budget'

export function useDashboard(year: number) {
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

  const mainChartData = useMemo(
    () => buildMainChartData(dashboardData),
    [dashboardData]
  )

  return {
    isLoading,
    categories,
    dashboardData,
    stats,
    categoryChartData,
    typeChartData,
    currencyChartData,
    mainChartData
  }
}
