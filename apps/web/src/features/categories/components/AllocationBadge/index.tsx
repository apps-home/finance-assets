import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp
} from 'lucide-react'

import { CategoryAllocation } from '@/features/categories/types/allocation'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/utils'

export function AllocationBadge({
  allocation
}: {
  allocation: CategoryAllocation
}) {
  const { status, direction, gap } = allocation
  const formattedGap = `${gap > 0 ? '+' : ''}${gap.toFixed(1)}%`

  if (status === 'BALANCED') {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="inline-flex cursor-default items-center rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 font-medium text-[10px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="mr-1 size-2.5" />
              Em dia
            </span>
          }
        />
        <TooltipContent>
          Desvio de {formattedGap} (dentro da faixa de tolerância de ±2%)
        </TooltipContent>
      </Tooltip>
    )
  }

  if (status === 'WARNING') {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="inline-flex cursor-default items-center rounded border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 font-medium text-[10px] text-amber-600 dark:text-amber-400">
              <AlertTriangle className="mr-1 size-2.5" />
              {formattedGap}
            </span>
          }
        />
        <TooltipContent>
          {gap < 0
            ? `Abaixo da meta (${formattedGap})`
            : `Acima da meta (${formattedGap})`}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              'inline-flex cursor-default items-center rounded px-1.5 py-0.5 font-semibold text-[10px]',
              direction === 'UNDER_ALLOCATED'
                ? 'border border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'border border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400'
            )}
          >
            {direction === 'UNDER_ALLOCATED' ? (
              <TrendingDown className="mr-1 size-2.5" />
            ) : (
              <TrendingUp className="mr-1 size-2.5" />
            )}
            {formattedGap}
          </span>
        }
      />
      <TooltipContent>
        {direction === 'UNDER_ALLOCATED'
          ? `Abaixo da meta (${formattedGap}) — Priorize aportes nesta classe`
          : `Acima da meta (${formattedGap}) — Categoria sobreponderada`}
      </TooltipContent>
    </Tooltip>
  )
}
