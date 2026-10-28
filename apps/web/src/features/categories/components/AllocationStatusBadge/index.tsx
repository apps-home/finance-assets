import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@lib/ui/components/tooltip'
import { cn } from '@lib/ui/lib/utils'
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp
} from 'lucide-react'

import { CategoryAllocation } from '@/features/categories/types/allocation'

export function AllocationStatusBadge({
  allocation,
  formattedGap
}: {
  allocation: CategoryAllocation
  formattedGap: string
}) {
  const { status, direction, gap } = allocation

  if (status === 'BALANCED') {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="inline-flex cursor-default items-center rounded-md border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 font-medium text-[10px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="mr-1 size-2.5" />
              Em equilíbrio ({formattedGap})
            </span>
          }
        />
        <TooltipContent>
          Alocação alinhada à meta com desvio de {formattedGap} (faixa de ±2% de
          tolerância).
        </TooltipContent>
      </Tooltip>
    )
  }

  if (status === 'WARNING') {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="inline-flex cursor-default items-center rounded-md border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 font-medium text-[10px] text-amber-600 dark:text-amber-400">
              <AlertTriangle className="mr-1 size-2.5" />
              Atenção ({formattedGap})
            </span>
          }
        />
        <TooltipContent>
          {gap < 0
            ? `Categoria ${formattedGap} abaixo da meta. Avalie aportar nesta classe.`
            : `Categoria ${formattedGap} acima da meta. Avalie desacelerar aportes.`}
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
              'inline-flex cursor-default items-center rounded-md px-1.5 py-0.5 font-semibold text-[10px]',
              direction === 'UNDER_ALLOCATED'
                ? 'border border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'border border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400'
            )}
          >
            {direction === 'UNDER_ALLOCATED' ? (
              <>
                <TrendingDown className="mr-1 size-2.5" />
                Abaixo da meta ({formattedGap})
              </>
            ) : (
              <>
                <TrendingUp className="mr-1 size-2.5" />
                Acima da meta ({formattedGap})
              </>
            )}
          </span>
        }
      />
      <TooltipContent>
        {direction === 'UNDER_ALLOCATED'
          ? `Desvio expressivo (${formattedGap}). Esta classe deve ser priorizada no próximo aporte.`
          : `Desvio expressivo (${formattedGap}). Esta classe está com sobrepeso em relação à sua meta.`}
      </TooltipContent>
    </Tooltip>
  )
}
