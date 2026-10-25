'use client'

import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { formatPercentage } from '@/shared/utils/format-percentage'

import type { PerformancePoint } from '../../api/types'
import {
  formatMonthLabel,
  SERIES_COLORS,
  SERIES_KEYS,
  SERIES_LABELS,
  type SeriesKey
} from '../../utils'

interface PerformanceChartProps {
  points: PerformancePoint[]
}

interface CustomTooltipProps {
  active?: boolean
  label?: string
  payload?: Array<{ dataKey: SeriesKey; value: number | null }>
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-xl border border-border/50 bg-popover/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="mb-2 font-semibold text-popover-foreground text-sm">
        {label}
      </p>
      <div className="space-y-1">
        {payload
          .filter((item) => item.value !== null && item.value !== undefined)
          .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
          .map((item) => (
            <div
              key={item.dataKey}
              className="flex items-center justify-between gap-6 text-xs"
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: SERIES_COLORS[item.dataKey] }}
                />
                {SERIES_LABELS[item.dataKey]}
              </span>
              <span className="font-medium tabular-nums">
                {formatPercentage(item.value as number)}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}

export function PerformanceChart({ points }: PerformanceChartProps) {
  const isMobile = !useMediaQuery('(min-width: 640px)')

  const data = useMemo(
    () => points.map((point) => ({ ...point, label: formatMonthLabel(point) })),
    [points]
  )

  const presentKeys = SERIES_KEYS.filter(
    (key) => key === 'portfolio' || points.some((point) => point[key] !== null)
  )

  return (
    <div
      data-slot="performance-chart"
      className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-xl">Rentabilidade acumulada</h3>
        <span className="text-muted-foreground text-xs">
          Retorno ponderado pelo tempo, descontando aportes
        </span>
      </div>

      {points.length < 2 ? (
        <div className="flex h-72 items-center justify-center text-center text-muted-foreground text-xs">
          Registre pelo menos dois meses consecutivos na página inicial para ver
          a rentabilidade.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                strokeOpacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="var(--border)"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)', strokeOpacity: 0.5 }}
                dy={10}
                interval={isMobile ? 'preserveStartEnd' : 0}
              />
              <YAxis
                stroke="var(--border)"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => `${value.toFixed(0)}%`}
                dx={-5}
                width={isMobile ? 45 : 55}
              />
              <Tooltip
                content={<CustomTooltip />}
                wrapperStyle={{ outline: 'none' }}
                cursor={{
                  stroke: 'var(--muted-foreground)',
                  strokeOpacity: 0.3
                }}
              />
              {presentKeys.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={SERIES_COLORS[key]}
                  strokeWidth={key === 'portfolio' ? 3 : 2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-border/50 border-t pt-4">
            {presentKeys.map((key) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: SERIES_COLORS[key] }}
                />
                <span className="text-muted-foreground text-xs">
                  {SERIES_LABELS[key]}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
