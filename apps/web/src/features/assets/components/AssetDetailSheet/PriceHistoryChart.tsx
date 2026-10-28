'use client'

import { Skeleton } from '@lib/ui/components/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@lib/ui/components/tabs'
import { cn } from '@lib/ui/lib/utils'
import type { UseQueryResult } from '@tanstack/react-query'
import { LineChart as LineChartIcon } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import type {
  PriceHistory,
  PriceHistoryRange
} from '@/features/assets/api/types'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatPercentage } from '@/shared/utils/format-percentage'
import { TREND_CLASSES } from '@/shared/utils/trend-classes'

import { Section } from './parts'

const RANGES: Array<{ value: PriceHistoryRange; label: string }> = [
  { value: '5d', label: '5D' },
  { value: '1m', label: '1M' },
  { value: 'ytd', label: 'YTD' },
  { value: '1y', label: '1A' },
  { value: '3y', label: '3A' },
  { value: '5y', label: '5A' }
]

interface PriceHistoryChartProps {
  id: string
  currency: string
  /** Hook de consulta do histórico (ativo ou wishlist) */
  useHistory: (
    id: string,
    range: PriceHistoryRange
  ) => UseQueryResult<PriceHistory>
}

interface TooltipProps {
  active?: boolean
  currency: string
  intraday: boolean
  payload?: Array<{ payload: { date: string; close: number } }>
}

function formatPointDate(value: string, intraday: boolean) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    ...(intraday ? { hour: '2-digit', minute: '2-digit' } : { year: 'numeric' })
  }).format(new Date(value))
}

function formatAxisDate(value: string, range: PriceHistoryRange) {
  const date = new Date(value)

  if (range === '3y' || range === '5y' || range === '1y') {
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
      year: '2-digit'
    }).format(date)
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short'
  }).format(date)
}

function PriceTooltip({ active, payload, currency, intraday }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const { date, close } = payload[0].payload

  return (
    <div className="rounded-lg border border-border/50 bg-popover/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-muted-foreground text-xs">
        {formatPointDate(date, intraday)}
      </p>
      <p className="font-semibold text-popover-foreground text-sm tabular-nums">
        {formatCurrency(close, currency)}
      </p>
    </div>
  )
}

export function PriceHistoryChart({
  id,
  currency,
  useHistory
}: PriceHistoryChartProps) {
  const [range, setRange] = useState<PriceHistoryRange>('1m')
  const gradientId = useId()
  const { data, isLoading, isError, isFetching } = useHistory(id, range)

  const prices = useMemo(() => data?.points.map((p) => p.close) ?? [], [data])
  const isPositive = (data?.change ?? 0) >= 0
  const color = isPositive ? 'var(--chart-1)' : 'var(--destructive)'
  const trend = isPositive ? TREND_CLASSES.positive : TREND_CLASSES.negative

  const min = prices.length > 0 ? Math.min(...prices) : 0
  const max = prices.length > 0 ? Math.max(...prices) : 0
  const padding = (max - min) * 0.1 || max * 0.02

  return (
    <Section
      title="Histórico de cotação"
      icon={<LineChartIcon className="size-3.5" />}
    >
      <Tabs
        value={range}
        onValueChange={(value) => setRange(value as PriceHistoryRange)}
      >
        <TabsList variant="line" className="w-full">
          {RANGES.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <Skeleton className="h-52 w-full" />
      ) : isError || !data ? (
        <p className="rounded-lg border border-border border-dashed p-3 text-center text-muted-foreground text-xs">
          Histórico indisponível para este ativo.
        </p>
      ) : (
        <div className={cn('space-y-2', isFetching && 'opacity-70')}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-muted-foreground text-xs">
              Variação no período
            </span>
            <span
              className={cn('font-semibold text-xs tabular-nums', trend.text)}
            >
              {data.change > 0 ? '+' : ''}
              {formatCurrency(data.change, currency)}
              {data.changePercent != null &&
                ` (${formatPercentage(data.changePercent)})`}
            </span>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={data.points}
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                strokeOpacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
                tickFormatter={(value: string) => formatAxisDate(value, range)}
              />
              <YAxis
                orientation="right"
                domain={[min - padding, max + padding]}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(value: number) =>
                  value >= 1000
                    ? `${(value / 1000).toFixed(1)}k`
                    : value.toFixed(2)
                }
              />
              <Tooltip
                content={
                  <PriceTooltip currency={currency} intraday={range === '5d'} />
                }
                wrapperStyle={{ outline: 'none' }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Section>
  )
}
