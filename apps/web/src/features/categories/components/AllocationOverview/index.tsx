'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@lib/ui/components/accordion'
import { Badge } from '@lib/ui/components/badge'
import { Card, CardContent, CardHeader } from '@lib/ui/components/card'
import { cn } from '@lib/ui/lib/utils'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Scale,
  TrendingDown
} from 'lucide-react'

import {
  CategoryAllocation,
  PortfolioAllocationSummary
} from '@/features/categories/types/allocation'
import {
  CATEGORY_TYPE_BG,
  CATEGORY_TYPE_COLORS,
  CATEGORY_TYPE_LABELS
} from '@/features/categories/utils'
import { formatCurrency } from '@/shared/utils/format-currency'

import { AllocationStatusBadge } from '../AllocationStatusBadge'

interface AllocationOverviewProps {
  summary: PortfolioAllocationSummary
}

export function AllocationOverview({ summary }: AllocationOverviewProps) {
  const {
    totalBalance,
    totalTargetPercentage,
    isOverAllocated,
    balancedCount,
    warningCount,
    criticalCount,
    allocations
  } = summary

  const configuredAllocations = allocations.filter(
    (a) => a.targetPercentage != null && a.targetPercentage > 0
  )

  if (configuredAllocations.length === 0) {
    return null
  }

  const underAllocatedCategories = configuredAllocations.filter(
    (a) => a.status === 'CRITICAL' && a.direction === 'UNDER_ALLOCATED'
  )

  return (
    <Card
      data-slot="allocation-overview"
      className="gap-0 border-border bg-card/60 py-0 shadow-xs backdrop-blur-xs"
    >
      <Accordion className="w-full">
        <AccordionItem value="overview" className="border-none">
          <CardHeader className="p-0">
            <AccordionTrigger className="cursor-pointer px-4 py-3.5 hover:no-underline">
              <div className="flex flex-1 flex-col gap-3 pr-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Scale className="size-4.5" />
                  </div>
                  <div className="text-left">
                    <span className="block font-semibold text-foreground text-sm">
                      Equilíbrio & Metas de Alocação
                    </span>
                    <span className="block text-muted-foreground text-xs">
                      Comparativo entre sua carteira real e a estratégia alvo
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="border-emerald-500/25 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle2 className="mr-1 size-3" />
                    {balancedCount} em equilíbrio
                  </Badge>
                  {warningCount > 0 && (
                    <Badge
                      variant="outline"
                      className="border-amber-500/25 bg-amber-500/10 text-[11px] text-amber-600 dark:text-amber-400"
                    >
                      <AlertTriangle className="mr-1 size-3" />
                      {warningCount} atenção
                    </Badge>
                  )}
                  {criticalCount > 0 && (
                    <Badge
                      variant="outline"
                      className="border-rose-500/25 bg-rose-500/10 text-[11px] text-rose-600 dark:text-rose-400"
                    >
                      <TrendingDown className="mr-1 size-3" />
                      {criticalCount} desbalanceada
                      {criticalCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            </AccordionTrigger>
          </CardHeader>

          <AccordionContent className="pb-4">
            <CardContent className="space-y-4 pt-0">
              {isOverAllocated && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="font-medium text-amber-700 text-xs dark:text-amber-300">
                    A soma das metas ({totalTargetPercentage.toFixed(1)}%)
                    excede 100%. Reajuste os percentuais de cada categoria para
                    garantir um planejamento balanceado.
                  </p>
                </div>
              )}

              {underAllocatedCategories.length > 0 && (
                <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/25 bg-rose-500/5 px-3 py-2.5">
                  <TrendingDown className="mt-0.5 size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-rose-700 text-xs dark:text-rose-300">
                      Prioridade para Novos Aportes
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      As categorias{' '}
                      <strong className="text-foreground">
                        {underAllocatedCategories
                          .map(
                            (c) => `${c.categoryName} (${c.gap.toFixed(1)}%)`
                          )
                          .join(', ')}
                      </strong>{' '}
                      estão significativamente abaixo da meta. Aporte nelas para
                      reequilibrar o portfólio.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/50 bg-muted/25 p-3 sm:grid-cols-3">
                <div>
                  <span className="text-[11px] text-muted-foreground/80">
                    Patrimônio Consolidado
                  </span>
                  <p className="font-semibold text-foreground text-xs tabular-nums">
                    {formatCurrency(totalBalance)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground/80">
                    Meta Total Alocada
                  </span>
                  <p
                    className={cn(
                      'font-semibold text-xs tabular-nums',
                      isOverAllocated
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-primary'
                    )}
                  >
                    {totalTargetPercentage.toFixed(1)}%
                    {!isOverAllocated && totalTargetPercentage < 100 && (
                      <span className="ml-1 font-normal text-[10px] text-muted-foreground">
                        ({(100 - totalTargetPercentage).toFixed(1)}% livre)
                      </span>
                    )}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-muted-foreground/80">
                    Saúde da Alocação
                  </span>
                  <p className="font-medium text-foreground text-xs">
                    {criticalCount === 0 && warningCount === 0 ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Carteira em Equilíbrio
                      </span>
                    ) : criticalCount > 0 ? (
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        Demanda Rebalanceamento
                      </span>
                    ) : (
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        Pequenas Divergências
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                {configuredAllocations.map((item) => (
                  <AllocationItemRow key={item.categoryId} allocation={item} />
                ))}
              </div>

              <div className="flex items-center justify-between border-border/50 border-t pt-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Info className="size-3.5 text-muted-foreground/70" />
                  <span>
                    Equilíbrio: desvio até ±2% • Atenção: ±2% a ±5% •
                    Desbalanceada: &gt; ±5%
                  </span>
                </div>
              </div>
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}

function AllocationItemRow({ allocation }: { allocation: CategoryAllocation }) {
  const target = allocation.targetPercentage ?? 0
  const actual = allocation.actualPercentage
  const gap = allocation.gap
  const type = allocation.categoryType

  const formattedGap = `${gap > 0 ? '+' : ''}${gap.toFixed(1)}%`

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'size-2.5 shrink-0 rounded-full',
              CATEGORY_TYPE_BG[type] || 'bg-muted'
            )}
          />
          <span className="font-semibold text-foreground text-xs">
            {allocation.categoryName}
          </span>
          <Badge
            variant="secondary"
            className={cn(
              'h-4 border-0 px-1.5 py-0 font-normal text-[10px]',
              CATEGORY_TYPE_COLORS[type]
            )}
          >
            {CATEGORY_TYPE_LABELS[type] || type}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs tabular-nums">
            <span className="text-[11px] text-muted-foreground">Real:</span>
            <span className="font-semibold text-foreground">
              {actual.toFixed(1)}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              ({formatCurrency(allocation.currentBalance, allocation.currency)})
            </span>
            <span className="text-[11px] text-muted-foreground/50">|</span>
            <span className="text-[11px] text-muted-foreground">Meta:</span>
            <span className="font-semibold text-primary">
              {target.toFixed(1)}%
            </span>
          </div>

          <AllocationStatusBadge
            allocation={allocation}
            formattedGap={formattedGap}
          />
        </div>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/60">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            CATEGORY_TYPE_BG[type] || 'bg-primary'
          )}
          style={{ width: `${Math.min(actual, 100)}%` }}
        />

        {target > 0 && target <= 100 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-foreground shadow-xs"
            style={{ left: `${target}%` }}
          />
        )}
      </div>
    </div>
  )
}
