'use client'

import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react'

import { useDollarRate } from '@/features/assets/hooks/use-dollar-rate'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils/format-currency'

interface DollarRateBadgeProps {
  className?: string
}

export function DollarRateBadge({ className }: DollarRateBadgeProps) {
  const { data, isLoading, isError } = useDollarRate()

  if (isLoading) {
    return <Skeleton className={cn('h-9 w-38 rounded-lg', className)} />
  }

  if (isError || !data || !data.bid) {
    return null
  }

  const bidValue = Number.parseFloat(data.bid)
  const pctChange = Number.parseFloat(data.pctChange)
  const isPositive = pctChange >= 0
  const highValue = data.high ? Number.parseFloat(data.high) : null
  const lowValue = data.low ? Number.parseFloat(data.low) : null

  const titleText =
    highValue && lowValue
      ? `Cotação Dólar (USD/BRL) - Máx: ${formatCurrency(highValue)} | Mín: ${formatCurrency(lowValue)}`
      : 'Cotação Dólar (USD/BRL)'

  return (
    <div
      data-slot="dollar-rate-badge"
      className={cn(
        'flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 shadow-xs transition-colors hover:border-border/80',
        className
      )}
      title={titleText}
    >
      <div className="flex size-5 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <DollarSign className="size-3.5" />
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        <span className="font-medium text-muted-foreground">USD</span>
        <span className="font-semibold text-foreground tabular-nums">
          {formatCurrency(bidValue)}
        </span>
        {!Number.isNaN(pctChange) && (
          <Badge
            variant="secondary"
            className={cn(
              'h-4.5 gap-0.5 border-0 px-1.5 py-0 font-semibold text-[10px] tabular-nums',
              isPositive
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/15 text-red-600 dark:text-red-400'
            )}
          >
            {isPositive ? (
              <TrendingUp className="size-2.5" />
            ) : (
              <TrendingDown className="size-2.5" />
            )}
            {isPositive
              ? `+${pctChange.toFixed(2)}%`
              : `${pctChange.toFixed(2)}%`}
          </Badge>
        )}
      </div>
    </div>
  )
}
