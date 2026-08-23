'use client'

import { TrendingDown, TrendingUp } from 'lucide-react'

import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils/format-currency'
import {
  calcPercentageChange,
  formatPercentage
} from '@/shared/utils/format-percentage'

interface AssetPriceInfoProps {
  currentClosePrice: number | null
  lastMonthClosePrice: number | null
  className?: string
}

export function AssetPriceInfo({
  currentClosePrice,
  lastMonthClosePrice,
  className
}: AssetPriceInfoProps) {
  if (currentClosePrice === null) {
    return (
      <span
        data-slot="asset-price-info"
        className={cn('text-muted-foreground/60 text-xs italic', className)}
      >
        Sem cotação
      </span>
    )
  }

  const hasComparison =
    lastMonthClosePrice !== null && lastMonthClosePrice !== 0
  const percentageChange = hasComparison
    ? calcPercentageChange(currentClosePrice, lastMonthClosePrice)
    : null

  const isPositive = percentageChange !== null && percentageChange >= 0
  const isNegative = percentageChange !== null && percentageChange < 0

  return (
    <div
      data-slot="asset-price-info"
      className={cn('grid grid-cols-3 gap-2', className)}
    >
      <div className="space-y-0.5">
        <span className="text-muted-foreground/60 text-xs">Cotação atual</span>
        <p className="font-semibold text-foreground text-sm tabular-nums">
          {formatCurrency(currentClosePrice)}
        </p>
      </div>
      <div className="space-y-0.5">
        <span className="text-muted-foreground/60 text-xs">Mês anterior</span>
        <p className="font-medium text-muted-foreground text-sm tabular-nums">
          {formatCurrency(lastMonthClosePrice || 0)}
        </p>
      </div>
      <div className="flex items-end justify-end">
        {percentageChange !== null && (
          <Badge
            variant="secondary"
            className={cn(
              'gap-1 border-0 px-2 py-1 font-semibold text-xs tabular-nums',
              isPositive &&
                'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
              isNegative && 'bg-red-500/15 text-red-600 dark:text-red-400'
            )}
          >
            {isPositive ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {formatPercentage(percentageChange)}
          </Badge>
        )}
      </div>
    </div>
  )
}
