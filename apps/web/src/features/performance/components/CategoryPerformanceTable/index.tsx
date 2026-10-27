import { CATEGORY_TYPE_COLORS } from '@/features/categories/utils'
import { Badge } from '@/shared/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/shared/components/ui/table'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatPercentage } from '@/shared/utils/format-percentage'

import type { CategoryPerformance, PerformancePeriodKey } from '../../api/types'
import { BENCHMARK_LABELS } from '../../utils'

interface CategoryPerformanceTableProps {
  categories: CategoryPerformance[]
  period: PerformancePeriodKey
}

function AlphaBadge({ alpha }: { alpha: number | null }) {
  if (alpha === null) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 font-semibold tabular-nums',
        alpha >= 0
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'bg-red-500/10 text-red-600 dark:text-red-400'
      )}
    >
      {alpha >= 0 ? '+' : ''}
      {alpha.toFixed(2)} p.p.
    </span>
  )
}

export function CategoryPerformanceTable({
  categories,
  period
}: CategoryPerformanceTableProps) {
  if (categories.length === 0) return null

  return (
    <div
      data-slot="category-performance-table"
      className="rounded-xl border border-border bg-card text-card-foreground shadow-sm"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-4 sm:px-6 sm:pt-6">
        <h2 className="font-semibold text-sm">Por categoria</h2>
        <p className="text-muted-foreground text-xs">
          Cada categoria contra o benchmark do seu tipo
        </p>
      </div>

      <div className="overflow-x-auto px-2 pb-2 sm:px-4 sm:pb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold text-xs">Categoria</TableHead>
              <TableHead className="text-right font-semibold text-xs">
                Saldo
              </TableHead>
              <TableHead className="text-right font-semibold text-xs">
                Retorno
              </TableHead>
              <TableHead className="font-semibold text-xs">Benchmark</TableHead>
              <TableHead className="text-right font-semibold text-xs">
                Diferença
              </TableHead>
              <TableHead className="text-right font-semibold text-xs">
                Meses
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => {
              const summary = category.periods.find(
                (item) => item.period === period
              )

              return (
                <TableRow key={category.categoryId}>
                  <TableCell className="py-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'border-0 px-2 py-0.5 font-medium text-xs',
                        CATEGORY_TYPE_COLORS[category.type]
                      )}
                    >
                      {category.name}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3 text-right text-xs tabular-nums">
                    {formatCurrency(category.latestAmount)}
                  </TableCell>

                  <TableCell className="py-3 text-right font-semibold text-xs tabular-nums">
                    {summary?.portfolio != null
                      ? formatPercentage(summary.portfolio)
                      : '—'}
                  </TableCell>

                  <TableCell className="py-3 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-muted-foreground">
                        {BENCHMARK_LABELS[category.benchmark]}
                      </span>
                      <span className="tabular-nums">
                        {summary?.benchmark != null
                          ? formatPercentage(summary.benchmark)
                          : '—'}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-right text-xs">
                    <AlphaBadge alpha={summary?.alpha ?? null} />
                  </TableCell>

                  <TableCell className="py-3 text-right text-muted-foreground text-xs tabular-nums">
                    {summary?.months ?? 0}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
