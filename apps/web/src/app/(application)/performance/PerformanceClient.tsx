'use client'

import { Skeleton } from '@lib/ui/components/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@lib/ui/components/tabs'
import { Activity } from 'lucide-react'
import { useMemo, useState } from 'react'

import type {
  PerformancePeriodKey,
  PerformanceScope
} from '@/features/performance/api/types'
import { CategoryPerformanceTable } from '@/features/performance/components/CategoryPerformanceTable'
import { PerformanceChart } from '@/features/performance/components/PerformanceChart'
import { PerformanceSummary } from '@/features/performance/components/PerformanceSummary'
import { WealthProjection } from '@/features/performance/components/WealthProjection'
import { usePortfolioPerformance } from '@/features/performance/hooks/use-performance'
import {
  PERIOD_LABELS,
  SCOPE_DESCRIPTIONS,
  SCOPE_LABELS,
  sliceSeries
} from '@/features/performance/utils'

const PERIODS: PerformancePeriodKey[] = ['ytd', '12m', 'all']
const SCOPES: PerformanceScope[] = ['all', 'variable', 'fixed']

export default function PerformanceClient() {
  const [period, setPeriod] = useState<PerformancePeriodKey>('12m')

  const [scope, setScope] = useState<PerformanceScope>('all')

  const { data, isLoading } = usePortfolioPerformance({ scope })

  const points = useMemo(
    () => sliceSeries(data?.series ?? [], period),
    [data, period]
  )
  const summary = data?.periods.find((item) => item.period === period)

  return (
    <div
      data-slot="performance-page"
      className="bg-background px-4 pt-4 pb-12 sm:px-6"
    >
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <Activity className="size-8 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-foreground sm:text-3xl">
                Rentabilidade
              </h1>
              <p className="text-muted-foreground text-xs">
                {SCOPE_DESCRIPTIONS[scope]} contra CDI, Ibovespa e S&P 500 em
                reais
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-4 self-start md:self-auto">
            <Tabs
              value={scope}
              onValueChange={(value) => setScope(value as PerformanceScope)}
            >
              <TabsList>
                {SCOPES.map((item) => (
                  <TabsTrigger
                    key={item}
                    value={item}
                    className="cursor-pointer font-semibold text-xs"
                  >
                    {SCOPE_LABELS[item]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Tabs
              value={period}
              onValueChange={(value) =>
                setPeriod(value as PerformancePeriodKey)
              }
            >
              <TabsList variant="line" className="gap-5">
                {PERIODS.map((item) => (
                  <TabsTrigger
                    key={item}
                    value={item}
                    className="cursor-pointer font-semibold text-sm"
                  >
                    {PERIOD_LABELS[item]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {isLoading && !data ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </>
        ) : (
          <>
            {summary && (
              <PerformanceSummary
                summary={summary}
                betaIbov={data?.betaIbov ?? null}
              />
            )}
            <PerformanceChart points={points} />

            <CategoryPerformanceTable
              categories={data?.byCategory ?? []}
              period={period}
            />

            <p className="text-muted-foreground text-xs leading-relaxed">
              Retorno mensal pelo método de Modified Dietz: aportes entram na
              metade do mês e proventos somam ao ganho. Para um resultado fiel,
              informe o aporte líquido de cada mês na tabela da página inicial.
              Os benchmarks incluem dividendos reinvestidos (Ibovespa, IFIX pelo
              ETF XFIX11 e S&P 500 Total Return). Na carteira consolidada, meses
              sem registro de todas as categorias são ignorados; na tabela por
              categoria, cada uma usa os próprios registros.
            </p>

            <WealthProjection />
          </>
        )}
      </div>
    </div>
  )
}
