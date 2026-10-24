import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card, CardContent } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils/format-currency'
import { TREND_CLASSES } from '@/shared/utils/trend-classes'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  iconClassName?: string
  trend?: string
  trendUp?: boolean
  subtitle?: ReactNode
  variant?: 'default' | 'trend'
  className?: string
  valueClassName?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  trend,
  trendUp,
  subtitle,
  variant = 'default',
  className,
  valueClassName
}: StatCardProps) {
  const isTrendVariant = variant === 'trend'
  const isPositive = trendUp === true
  const isNegative = trendUp === false

  const defaultIconClassName = isTrendVariant
    ? isPositive
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : isNegative
        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
        : 'bg-muted text-muted-foreground'
    : 'bg-primary/10 text-primary'

  const formattedValue =
    typeof value === 'number' ? formatCurrency(value) : value

  return (
    <Card className={cn('border-border shadow-xs', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-muted-foreground text-xs">
            {title}
          </span>
          <div
            className={cn(
              'flex size-8 items-center justify-center rounded-lg',
              defaultIconClassName,
              iconClassName
            )}
          >
            <Icon className="size-4" />
          </div>
        </div>

        <div className="mt-2 space-y-1">
          <div className="flex items-baseline gap-2">
            <p
              className={cn(
                'font-bold text-xl tabular-nums',
                isTrendVariant && isPositive && TREND_CLASSES.positive.text,
                isTrendVariant && isNegative && TREND_CLASSES.negative.text,
                (!isTrendVariant || (!isPositive && !isNegative)) &&
                  'text-foreground',
                valueClassName
              )}
            >
              {isTrendVariant && typeof value === 'number' && value > 0 && '+'}
              {formattedValue}
            </p>
            {trend && (
              <span
                className={cn(
                  'font-semibold text-xs tabular-nums',
                  isPositive && TREND_CLASSES.positive.text,
                  isNegative && TREND_CLASSES.negative.text,
                  !isPositive && !isNegative && 'text-muted-foreground'
                )}
              >
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-muted-foreground text-xs">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
