'use client'

import { Badge } from '@lib/ui/components/badge'
import { Button, buttonVariants } from '@lib/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@lib/ui/components/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@lib/ui/components/tabs'
import { cn } from '@lib/ui/lib/utils'
import {
  ArrowUpRightFromSquare,
  CalendarCheck,
  ChevronDown,
  Coins,
  Landmark,
  Loader2,
  Sparkles,
  TrendingUp,
  Wallet
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { useAvailableYears } from '@/features/categories/hooks/use-competence'
import { CategoryBreakdown } from '@/features/dashboard/components/CategoryBreakdown'
import { FinancialChart } from '@/features/dashboard/components/FinancialChart'
import { FinancialTable } from '@/features/dashboard/components/FinancialTable'
import { InsightsDialog } from '@/features/dashboard/components/InsightsDialog'
import { MonthClosingDialog } from '@/features/dashboard/components/MonthClosingDialog'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { useSaveBudget } from '@/features/dashboard/hooks/use-budget'
import { useDashboard } from '@/features/dashboard/hooks/use-dashboard'

export default function DashboardPageClient() {
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear())
  )
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [insightsMode, setInsightsMode] = useState<'month' | 'year'>('month')
  const [closingOpen, setClosingOpen] = useState(false)
  const hasInitializedYear = useRef(false)

  const { data: availableYears } = useAvailableYears()

  useEffect(() => {
    if (availableYears?.length && !hasInitializedYear.current) {
      hasInitializedYear.current = true
      const latestYear = Math.max(...availableYears)
      setSelectedYear(String(latestYear))
    }
  }, [availableYears])

  const {
    isLoading,
    categories,
    dashboardData,
    stats,
    categoryChartData,
    typeChartData,
    currencyChartData,
    mainChartData
  } = useDashboard(parseInt(selectedYear, 10))

  const { mutateAsync: saveBudget } = useSaveBudget()

  if (isLoading) {
    return (
      <div className="flex h-svh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="bg-background px-4 pt-4 pb-12 sm:px-6">
      <div className="mx-auto max-w-screen-2xl space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="rounded-xl bg-primary/10 p-2.5 sm:p-3">
              <Wallet className="size-6 text-primary sm:size-8" />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-foreground sm:text-3xl">
                Controle Patrimonial
              </h1>
              <p className="text-muted-foreground">
                Gestão Financeira {selectedYear}
              </p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-6 overflow-x-auto pb-1.5">
            <Tabs
              value={selectedYear}
              onValueChange={(value) => {
                setSelectedYear(value)
              }}
            >
              <TabsList variant="line" className="gap-5">
                {(availableYears || [])
                  .sort((a, b) => b - a)
                  .map((year) => (
                    <TabsTrigger
                      key={year}
                      value={String(year)}
                      className="cursor-pointer font-semibold text-sm"
                    >
                      {year}
                    </TabsTrigger>
                  ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            icon={Landmark}
          />
          <StatCard
            title="Total em Renda Variável"
            subtitle={stats.referenceMonth}
            value={stats.totalStocks}
            icon={TrendingUp}
          />
          <StatCard
            title="Dividendos Recebidos"
            subtitle={selectedYear}
            value={stats.totalDividends}
            icon={Coins}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FinancialChart data={mainChartData} />
          <CategoryBreakdown
            data={categoryChartData}
            typeData={typeChartData}
            currencyData={currencyChartData}
            subtitle={stats.referenceMonth}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h2 className="font-semibold text-2xl tracking-tight">
                  Detalhamento Mensal
                </h2>
                <Badge
                  variant="outline"
                  className="font-medium text-muted-foreground text-xs"
                >
                  {selectedYear}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                {categories.length > 0
                  ? 'Toque ou clique em qualquer célula para editar aportes e dividendos'
                  : `Nenhuma categoria encontrada para ${selectedYear}`}
              </p>
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClosingOpen(true)}
                  className="h-9 gap-2 text-xs"
                >
                  <CalendarCheck className="size-3.5 text-primary" />
                  Fechar mês
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      'h-9 gap-2 text-xs'
                    )}
                  >
                    <Sparkles className="size-3.5 text-amber-500" />
                    Gerar Insights
                    <ChevronDown className="size-3 opacity-60" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem
                      onClick={() => {
                        setInsightsMode('month')
                        setInsightsOpen(true)
                      }}
                      className="gap-2 text-xs"
                    >
                      <Sparkles className="size-3.5 text-amber-500" />
                      Insights do mês ({stats.referenceMonth || 'Atual'})
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setInsightsMode('year')
                        setInsightsOpen(true)
                      }}
                      className="gap-2 text-xs"
                    >
                      <Sparkles className="size-3.5 text-amber-500" />
                      Insights do ano ({selectedYear})
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

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

        {closingOpen && (
          <MonthClosingDialog
            key={selectedYear}
            open={closingOpen}
            onOpenChange={setClosingOpen}
            year={parseInt(selectedYear, 10)}
            categories={categories}
            data={dashboardData}
          />
        )}

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
