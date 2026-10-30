'use client'

import { Tabs, TabsList, TabsTrigger } from '@lib/ui/components/tabs'
import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import type { ChartPeriod } from '@/features/dashboard/utils/build-patrimony-series'
import type { WealthBridge } from '@/features/dashboard/utils/build-wealth-decomposition'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { formatCurrency } from '@/shared/utils/format-currency'

interface ChartData {
  month: string
  total: number | null
  /** Série pontilhada: último mês fechado → prévia do mês corrente */
  estimate?: number | null
  isEstimate?: boolean
  /** Patrimônio inicial + aportes acumulados */
  invested?: number | null
  /** Ganho de mercado acumulado */
  marketGain?: number | null
  [key: string]: string | number | boolean | null | undefined
}

type ChartView = 'total' | 'breakdown'

const PERIOD_OPTIONS: { value: ChartPeriod; label: string }[] = [
  { value: 'year', label: 'Ano' },
  { value: '12M', label: '12M' },
  { value: '24M', label: '24M' },
  { value: 'all', label: 'Tudo' }
]

interface FinancialChartProps {
  data: ChartData[]
  period?: ChartPeriod
  onPeriodChange?: (period: ChartPeriod) => void
  wealthBridge?: WealthBridge | null
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number | null
    dataKey: string
    payload: ChartData
  }>
  label?: string
  showBreakdown?: boolean
}

function CustomTooltip({
  active,
  payload,
  label,
  showBreakdown
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const row = payload[0].payload
  const isPreview = row.total == null && row.estimate != null
  const value = row.total ?? row.estimate ?? null
  if (value == null) return null

  return (
    <div
      className="rounded-xl border border-border/50 bg-popover/95 px-4 py-3 shadow-xl backdrop-blur-sm"
      style={{
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div className="mb-2 flex items-center gap-2.5">
        <div
          className="size-3 rounded-full ring-2 ring-white/20"
          style={{ backgroundColor: 'var(--primary)' }}
        />
        <span className="font-semibold text-popover-foreground text-sm">
          {label}
        </span>
      </div>
      <div className="space-y-1">
        <div className="font-bold text-lg text-primary">
          {formatCurrency(value)}
        </div>
        <div className="text-muted-foreground text-xs">
          {isPreview
            ? 'Prévia em tempo real (não fechado)'
            : 'Patrimônio Total'}
        </div>
        {showBreakdown && !isPreview && row.invested != null && (
          <div className="space-y-0.5 border-border/50 border-t pt-1.5 text-xs">
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Base + aportes</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(row.invested)}
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Ganho de mercado</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(row.marketGain ?? 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function FinancialChart({
  data,
  period = 'year',
  onPeriodChange,
  wealthBridge
}: FinancialChartProps) {
  const isMobile = !useMediaQuery('(min-width: 640px)')
  const [view, setView] = useState<ChartView>('total')

  if (!data || data.length === 0) return null

  const monthsWithData = data.filter(
    (item): item is ChartData & { total: number } =>
      item.total != null && item.total > 0
  )
  const firstMonth = monthsWithData[0] ?? data[0]
  const lastMonth =
    monthsWithData[monthsWithData.length - 1] ?? data[data.length - 1]

  const firstValue = firstMonth?.total ?? 0
  const lastValue = lastMonth?.total ?? 0

  const growth =
    firstValue > 0
      ? ((lastValue - firstValue) / firstValue) * 100
      : lastValue > 0
        ? 100
        : 0

  const isPositiveGrowth = growth >= 0

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-xl">Evolução Patrimonial</h3>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-muted-foreground text-sm">
            {firstMonth?.month} a {lastMonth?.month}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 font-medium text-xs ${
              isPositiveGrowth
                ? 'bg-primary/10 text-primary'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {isPositiveGrowth ? '+' : ''}
            {growth.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {onPeriodChange ? (
          <Tabs
            value={period}
            onValueChange={(value) => onPeriodChange(value as ChartPeriod)}
          >
            <TabsList variant="line">
              {PERIOD_OPTIONS.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : (
          <span />
        )}

        <Tabs
          value={view}
          onValueChange={(value) => setView(value as ChartView)}
        >
          <TabsList variant="line">
            <TabsTrigger value="total">Total</TabsTrigger>
            <TabsTrigger value="breakdown">Aportes vs. Rendimentos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTotalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
              <stop
                offset="50%"
                stopColor="var(--primary)"
                stopOpacity={0.15}
              />
              <stop
                offset="100%"
                stopColor="var(--primary)"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            strokeOpacity={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="month"
            stroke="var(--border)"
            tick={{
              fill: 'var(--muted-foreground)',
              fontSize: 12
            }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)', strokeOpacity: 0.5 }}
            dy={10}
            tickFormatter={(value: string) =>
              value.includes('/') ? value : value.slice(0, 3)
            }
            interval={period !== 'year' || isMobile ? 'preserveStartEnd' : 0}
          />
          <YAxis
            stroke="var(--border)"
            tick={{
              fill: 'var(--muted-foreground)',
              fontSize: 12
            }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            dx={-5}
            width={isMobile ? 50 : 70}
          />
          <Tooltip
            content={<CustomTooltip showBreakdown={view === 'breakdown'} />}
            wrapperStyle={{ outline: 'none' }}
            cursor={{
              stroke: 'var(--primary)',
              strokeWidth: 1,
              strokeDasharray: '4 4',
              strokeOpacity: 0.5
            }}
          />
          {view === 'breakdown' && (
            <Area
              type="monotone"
              dataKey="invested"
              connectNulls={false}
              stroke="var(--chart-2)"
              strokeWidth={2}
              fill="var(--chart-2)"
              fillOpacity={0.25}
              name="Base + aportes"
              isAnimationActive={false}
              dot={false}
              activeDot={false}
            />
          )}
          <Area
            type="monotone"
            dataKey="total"
            connectNulls={false}
            stroke="var(--primary)"
            strokeWidth={2}
            fill={view === 'breakdown' ? 'none' : 'url(#colorTotalGradient)'}
            name="Total"
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
            dot={false}
            activeDot={{
              r: 6,
              fill: 'var(--primary)',
              stroke: 'var(--card)',
              strokeWidth: 3,
              style: {
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
              }
            }}
          />
          <Area
            type="monotone"
            dataKey="estimate"
            connectNulls={false}
            stroke="var(--primary)"
            strokeWidth={2}
            strokeDasharray="4 4"
            strokeOpacity={0.8}
            fill="none"
            name="Estimado hoje"
            isAnimationActive={false}
            activeDot={false}
            dot={(props: {
              cx?: number
              cy?: number
              index?: number
              payload?: ChartData
            }) =>
              props.payload?.isEstimate &&
              props.cx != null &&
              props.cy != null ? (
                <circle
                  key={`estimate-${props.index}`}
                  cx={props.cx}
                  cy={props.cy}
                  r={5}
                  fill="var(--card)"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                />
              ) : (
                <g key={`estimate-${props.index}`} />
              )
            }
          />
        </AreaChart>
      </ResponsiveContainer>

      {view === 'breakdown' && (
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: 'var(--chart-2)' }}
            />
            <span className="text-muted-foreground text-xs">
              Base + aportes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: 'var(--primary)' }}
            />
            <span className="text-muted-foreground text-xs">
              Patrimônio (a diferença é o ganho de mercado)
            </span>
          </div>
        </div>
      )}

      {wealthBridge && <WealthBridgeSummary bridge={wealthBridge} />}

      <div className="mt-4 flex items-center justify-between border-border/50 border-t pt-4">
        <div className="flex items-center gap-2">
          <div
            className="size-3 rounded-full"
            style={{ backgroundColor: 'var(--primary)' }}
          />
          <span className="text-muted-foreground text-sm">
            Patrimônio Total
          </span>
        </div>
        <span className="font-bold text-lg text-primary">
          {formatCurrency(lastValue)}
        </span>
      </div>
    </div>
  )
}

const formatShare = (value: number | null) =>
  value == null ? null : `${value.toFixed(1)}% do crescimento`

function WealthBridgeSummary({ bridge }: { bridge: WealthBridge }) {
  const blocks = [
    {
      label: `Início (${bridge.startLabel})`,
      value: formatCurrency(bridge.start),
      hint: null
    },
    {
      label: '+ Aportes líquidos',
      value: `${bridge.contributions >= 0 ? '+ ' : '- '}${formatCurrency(Math.abs(bridge.contributions))}`,
      hint: formatShare(bridge.contributionShare)
    },
    {
      label: '+ Valorização & juros',
      value: `${bridge.marketGain >= 0 ? '+ ' : '- '}${formatCurrency(Math.abs(bridge.marketGain))}`,
      hint: formatShare(bridge.marketGainShare)
    },
    {
      label: `= Patrimônio final (${bridge.endLabel})`,
      value: formatCurrency(bridge.end),
      hint:
        bridge.growthPct == null
          ? null
          : `${bridge.growthPct >= 0 ? '+' : ''}${bridge.growthPct.toFixed(1)}%`
    }
  ]

  return (
    <div
      data-slot="wealth-bridge"
      className="mt-4 grid grid-cols-2 gap-3 border-border/50 border-t pt-4 lg:grid-cols-4"
    >
      {blocks.map((block) => (
        <div key={block.label} className="space-y-0.5">
          <p className="text-[11px] text-muted-foreground">{block.label}</p>
          <p className="font-bold text-foreground text-sm tabular-nums">
            {block.value}
          </p>
          {block.hint && (
            <p className="text-[11px] text-muted-foreground">{block.hint}</p>
          )}
        </div>
      ))}
    </div>
  )
}
