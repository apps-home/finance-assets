'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import {
  ArrowUpRightFromSquare,
  Download,
  Loader2,
  Sparkles,
  TrendingUp,
  Wallet
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { listAvailableYears, listCategories } from '@/features/categories/api'
import { CategoryBreakdown } from '@/features/dashboard/components/CategoryBreakdown'
import { FinancialChart } from '@/features/dashboard/components/FinancialChart'
import { FinancialTable } from '@/features/dashboard/components/FinancialTable'
import { InsightsDialog } from '@/features/dashboard/components/InsightsDialog'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { createBudget, listBudgets } from '@/infrastructure/api/budgets'
import { Button } from '@/shared/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { queryClient } from '@/shared/providers/query-client'
import { MONTH_NAMES } from '@/shared/utils/month-names'

import type { MonthData } from './page'

export default function DashboardPageClient() {
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear())
  )
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [insightsMode, setInsightsMode] = useState<'month' | 'year'>('month')
  const hasInitializedYear = useRef(false)

  const { data: availableYears } = useQuery({
    queryKey: ['available-years'],
    queryFn: () => listAvailableYears(),
    placeholderData: (prev) => prev
  })

  useEffect(() => {
    if (availableYears?.length && !hasInitializedYear.current) {
      hasInitializedYear.current = true
      const latestYear = Math.max(...availableYears)
      setSelectedYear(String(latestYear))
    }
  }, [availableYears])

  const { data: budgetsData, isLoading: isLoadingBudgets } = useQuery({
    queryKey: ['budgets', selectedYear],
    queryFn: () => listBudgets({ year: parseInt(selectedYear, 10) }),
    placeholderData: (prev) => prev
  })

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories', selectedYear],
    queryFn: () => listCategories({ year: parseInt(selectedYear, 10) }),
    placeholderData: (prev) => prev
  })

  const { mutateAsync: saveBudget } = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      toast.success('Valor atualizado!')
      queryClient.invalidateQueries({ queryKey: ['budgets', selectedYear] })
    },
    onError: () => {
      toast.error('Erro ao salvar valor.')
    }
  })

  const isLoading = isLoadingCategories || isLoadingBudgets
  const budgets = budgetsData || []
  const categories = categoriesData || []

  const dashboardData: MonthData[] = useMemo(() => {
    if (isLoading) return []

    const processedMonths = MONTH_NAMES.map((month, index) => {
      const row: MonthData = {
        month,
        monthIndex: index + 1
      }

      categories.forEach((cat) => {
        row[cat.name] = 0
      })

      return row
    })

    budgets.forEach((budget) => {
      const monthIndex = budget.month - 1
      if (monthIndex >= 0 && monthIndex < 12) {
        const category = categories.find((c) => c.id === budget.categoryId)
        if (category) {
          processedMonths[monthIndex][category.name] = Number(budget.amount)
          processedMonths[monthIndex][`${category.name}_dividend`] =
            budget.dividendAmount ? Number(budget.dividendAmount) : 0
        }
      }
    })

    return processedMonths
  }, [budgets, categories, isLoading])

  const getLatestMonthWithData = useMemo(() => {
    if (!dashboardData.length) return null

    for (let i = dashboardData.length - 1; i >= 0; i--) {
      const monthData = dashboardData[i]
      const hasData = Object.keys(monthData).some((key) => {
        if (
          key === 'month' ||
          key === 'monthIndex' ||
          key.endsWith('_dividend')
        )
          return false
        return (monthData[key] as number) > 0
      })
      if (hasData) return monthData
    }

    return dashboardData[dashboardData.length - 1]
  }, [dashboardData])

  const stats = useMemo(() => {
    if (!dashboardData.length || !categories.length || !getLatestMonthWithData)
      return {
        total: 0,
        growth: 0,
        totalBonds: 0,
        totalStocks: 0,
        referenceMonth: ''
      }

    const currentMonthData = getLatestMonthWithData

    const reservaCategoryNames = categories
      .filter(
        (cat) =>
          cat.name.toLowerCase().includes('reserva') ||
          cat.name.toLowerCase().includes('renda') ||
          cat.name.toLowerCase().includes('lci') ||
          cat.name.toLowerCase().includes('lca') ||
          cat.name.toLowerCase().includes('cdb') ||
          cat.name.toLowerCase().includes('tesouro')
      )
      .map((cat) => cat.name)

    let totalBonds = 0
    let totalStocks = 0

    Object.keys(currentMonthData).forEach((key) => {
      if (
        key !== 'month' &&
        key !== 'monthIndex' &&
        !key.endsWith('_dividend')
      ) {
        const value = currentMonthData[key] as number
        if (reservaCategoryNames.includes(key)) {
          totalBonds += value
        } else {
          totalStocks += value
        }
      }
    })

    const totalCurrent = totalBonds + totalStocks

    const firstMonthData =
      dashboardData.find((monthData) => {
        return Object.keys(monthData).some((key) => {
          if (
            key === 'month' ||
            key === 'monthIndex' ||
            key.endsWith('_dividend')
          )
            return false
          return (monthData[key] as number) > 0
        })
      }) ?? dashboardData[0]
    const totalFirst = Object.keys(firstMonthData).reduce((acc, key) => {
      if (
        key !== 'month' &&
        key !== 'monthIndex' &&
        !key.endsWith('_dividend')
      ) {
        return acc + (firstMonthData[key] as number)
      }
      return acc
    }, 0)

    const growth =
      totalFirst > 0 ? ((totalCurrent - totalFirst) / totalFirst) * 100 : 0

    return {
      total: totalCurrent,
      growth,
      totalBonds,
      totalStocks,
      referenceMonth: currentMonthData.month as string
    }
  }, [dashboardData, categories, getLatestMonthWithData])

  const categoryChartData = useMemo(() => {
    if (!dashboardData.length || !getLatestMonthWithData) return []

    return categories.map((cat, index) => ({
      name: cat.name,
      value: getLatestMonthWithData[cat.name] as number,
      color: `var(--chart-${(index % 5) + 1})`
    }))
  }, [dashboardData, categories, getLatestMonthWithData])

  const mainChartData = useMemo(() => {
    return dashboardData.map((row) => {
      const total = Object.keys(row).reduce((acc, key) => {
        if (
          key !== 'month' &&
          key !== 'monthIndex' &&
          !key.endsWith('_dividend')
        ) {
          return acc + (row[key] as number)
        }
        return acc
      }, 0)

      return {
        ...row,
        total
      }
    })
  }, [dashboardData])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="bg-background px-6 pt-4 pb-12">
      <div className="mx-auto max-w-screen-2xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <Wallet className="size-8 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-3xl text-foreground">
                Controle Patrimonial
              </h1>
              <p className="text-muted-foreground">
                Gestão Financeira {selectedYear}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Tabs
              value={selectedYear}
              onValueChange={(value) => {
                setSelectedYear(value)
              }}
            >
              <TabsList variant="line">
                {(availableYears || [])
                  .sort((a, b) => b - a)
                  .map((year) => (
                    <TabsTrigger key={year} value={String(year)}>
                      {year}
                    </TabsTrigger>
                  ))}
              </TabsList>
            </Tabs>
            <Button onClick={() => {}} variant="default">
              <Download className="size-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            title="Patrimônio Total"
            subtitle={stats.referenceMonth}
            value={stats.total}
            icon={Wallet}
            trend={`${stats.growth >= 0 ? '+' : ''}${stats.growth.toFixed(1)}%`}
            trendUp={stats.growth > 0}
          />
          <StatCard
            title="Total em Renda Fixa"
            subtitle={stats.referenceMonth}
            value={stats.totalBonds}
            icon={TrendingUp}
          />
          <StatCard
            title="Total em Renda Variável"
            subtitle={stats.referenceMonth}
            value={stats.totalStocks}
            icon={TrendingUp}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FinancialChart data={mainChartData} />
          <CategoryBreakdown
            data={categoryChartData}
            subtitle={stats.referenceMonth}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <div className="mb-8">
              <h2 className="font-semibold text-2xl">Detalhamento Mensal</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                {categories.length > 0
                  ? 'Clique no ícone de edição para alterar valores'
                  : `Nenhuma categoria encontrada para ${selectedYear}`}
              </p>
            </div>
            {categories.length > 0 && (
              <div className="flex items-center gap-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setInsightsMode('year')
                    setInsightsOpen(true)
                  }}
                >
                  <Sparkles className="size-4 text-yellow-600" />
                  Gerar Insights do ano
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setInsightsMode('month')
                    setInsightsOpen(true)
                  }}
                >
                  <Sparkles className="size-4 text-yellow-600" />
                  Gerar Insights do mês
                </Button>
                <Link href="/categories">
                  <Button variant="default">
                    Criar Categoria
                    <ArrowUpRightFromSquare className="size-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
          {categories.length > 0 ? (
            <FinancialTable
              data={dashboardData}
              categories={categories}
              year={parseInt(selectedYear, 10)}
              onSaveCell={async (dto) => {
                await saveBudget(dto)
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-xl bg-muted/50 p-4">
                <Wallet className="size-10 text-muted-foreground/60" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground text-lg">
                Sem dados para {selectedYear}
              </h3>
              <p className="mb-6 max-w-sm text-muted-foreground text-sm">
                Você ainda não possui categorias com competência para este ano.
                Crie ou atualize suas categorias para começar a registrar seus
                ativos.
              </p>
              <Link href="/profile?tab=categories">
                <Button variant="default">
                  <ArrowUpRightFromSquare className="size-4" />
                  Gerenciar Categorias
                </Button>
              </Link>
            </div>
          )}
        </div>

        <InsightsDialog
          open={insightsOpen}
          onOpenChange={setInsightsOpen}
          mode={insightsMode}
          selectedYear={selectedYear}
          yearlyData={dashboardData}
          financialData={{
            total: stats.total,
            totalBonds: stats.totalBonds,
            totalStocks: stats.totalStocks,
            growth: stats.growth,
            referenceMonth: stats.referenceMonth,
            categories: categoryChartData.map((c) => ({
              name: c.name,
              value: c.value
            }))
          }}
        />
      </div>
    </div>
  )
}
