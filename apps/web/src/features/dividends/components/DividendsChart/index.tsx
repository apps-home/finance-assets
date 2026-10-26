'use client'

import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import type { CategoryType } from '@/features/categories/api/types'
import { CATEGORY_TYPE_LABELS } from '@/features/categories/utils'
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { formatCurrency } from '@/shared/utils/format-currency'

import type { DividendsSummary } from '../../api/types'
import {
  buildChartData,
  buildYearChartData,
  CATEGORY_TYPE_CHART_COLORS
} from '../../utils'

type ChartView = 'year' | 'last12' | 'all'

interface DividendsChartProps {
  summary: DividendsSummary
}

interface CustomTooltipProps {
  active?: boolean
  label?: string
  payload?: Array<{
    dataKey: string
    value: number
    payload: { total: number }
  }>
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
          .filter((item) => item.value > 0)
          .map((item) => (
            <div
              key={item.dataKey}
              className="flex items-center justify-between gap-6 text-xs"
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      CATEGORY_TYPE_CHART_COLORS[item.dataKey as CategoryType]
                  }}
                />
                {CATEGORY_TYPE_LABELS[item.dataKey as CategoryType]}
              </span>
              <span className="font-medium tabular-nums">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        <div className="flex items-center justify-between gap-6 border-border/50 border-t pt-1 font-bold text-sm">
          <span>Total</span>
          <span className="tabular-nums">
            {formatCurrency(payload[0].payload.total)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function DividendsChart({ summary }: DividendsChartProps) {
  const isMobile = !useMediaQuery('(min-width: 640px)')
  const [view, setView] = useState<ChartView>('year')

  const { data, presentTypes, total, title, emptyMessage } = useMemo(() => {
    if (view === 'all') {
      return {
        ...buildYearChartData(summary.byYear),
        total: summary.byYear.reduce((sum, item) => sum + item.total, 0),
        title: 'Histórico de proventos por ano',
        emptyMessage: 'Nenhum provento recebido até hoje.'
      }
    }

    const months = view === 'year' ? summary.byMonth : summary.last12Months

    return {
      ...buildChartData(months),
      total: months.reduce((sum, month) => sum + month.total, 0),
      title:
        view === 'year'
          ? `Proventos em ${summary.year}`
          : 'Proventos nos últimos 12 meses',
      emptyMessage:
        view === 'year'
          ? `Nenhum provento recebido em ${summary.year}.`
          : 'Nenhum provento recebido nos últimos 12 meses.'
    }
  }, [summary, view])

  return (
    <div
      data-slot="dividends-chart"
      className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-xl">{title}</h3>
        <span className="font-semibold text-muted-foreground text-sm">
          Total: {formatCurrency(total)}
        </span>
      </div>

      <Tabs
        value={view}
        onValueChange={(value) => setView(value as ChartView)}
        className="mb-4"
      >
        <TabsList variant="line">
          <TabsTrigger value="year">{summary.year}</TabsTrigger>
          <TabsTrigger value="last12">12 meses</TabsTrigger>
          <TabsTrigger value="all">Todos os anos</TabsTrigger>
        </TabsList>
      </Tabs>

      {presentTypes.length === 0 ? (
        <div className="flex h-72 items-center justify-center text-muted-foreground text-xs">
          {emptyMessage}
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
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
                tickFormatter={(value: number) => `R$ ${value.toFixed(0)}`}
                dx={-5}
                width={isMobile ? 55 : 70}
              />
              <Tooltip
                content={<CustomTooltip />}
                wrapperStyle={{ outline: 'none' }}
                cursor={{ fill: 'var(--muted)', fillOpacity: 0.4 }}
              />
              {presentTypes.map((type, index) => (
                <Bar
                  key={type}
                  dataKey={type}
                  stackId="dividends"
                  fill={CATEGORY_TYPE_CHART_COLORS[type]}
                  radius={
                    index === presentTypes.length - 1
                      ? [4, 4, 0, 0]
                      : [0, 0, 0, 0]
                  }
                  maxBarSize={40}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-border/50 border-t pt-4">
            {presentTypes.map((type) => (
              <div key={type} className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: CATEGORY_TYPE_CHART_COLORS[type] }}
                />
                <span className="text-muted-foreground text-xs">
                  {CATEGORY_TYPE_LABELS[type]}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
