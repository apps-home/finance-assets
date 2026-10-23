'use client'

import { TrendingDown, TrendingUp } from 'lucide-react'

import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils/format-currency'
import {
  calcMonthChange,
  formatPercentage
} from '@/shared/utils/format-percentage'
import { TREND_CLASSES } from '@/shared/utils/trend-classes'

interface AssetPriceInfoProps {
  currentClosePrice: number | null
  lastMonthClosePrice: number | null
  currency?: string
  className?: string
}

export function AssetPriceInfo({
  currentClosePrice,
  lastMonthClosePrice,
  currency = 'BRL',
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

  const percentageChange = calcMonthChange(
    currentClosePrice,
    lastMonthClosePrice
  )

  const isPositive = percentageChange !== null && percentageChange >= 0
  const isNegative = percentageChange !== null && percentageChange < 0

  return (
    <div
      data-slot="asset-price-info"
      className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3', className)}
    >
      <div className="space-y-0.5">
        <span className="text-muted-foreground/60 text-xs">Cotação atual</span>
        <p className="font-semibold text-foreground text-sm tabular-nums">
          {formatCurrency(currentClosePrice, currency)}
        </p>
      </div>
      <div className="space-y-0.5">
        <span className="text-muted-foreground/60 text-xs">Mês anterior</span>
        <p className="font-medium text-muted-foreground text-sm tabular-nums">
          {formatCurrency(lastMonthClosePrice || 0, currency)}
        </p>
      </div>
      <div className="flex items-end justify-end">
        {percentageChange !== null && (
          <Badge
            variant="secondary"
            className={cn(
              'gap-1 border-0 px-2 py-1 font-semibold text-xs tabular-nums',
              isPositive && TREND_CLASSES.positive.badge,
              isNegative && TREND_CLASSES.negative.badge
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
