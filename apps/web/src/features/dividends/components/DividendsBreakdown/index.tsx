'use client'

import { Badge } from '@lib/ui/components/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@lib/ui/components/tooltip'

import { CATEGORY_TYPE_LABELS } from '@/features/categories/utils'
import { formatCurrency } from '@/shared/utils/format-currency'

import type { DividendsSummary } from '../../api/types'
import { CATEGORY_TYPE_CHART_COLORS } from '../../utils'

interface DividendsBreakdownProps {
  summary: DividendsSummary
}

export function DividendsBreakdown({ summary }: DividendsBreakdownProps) {
  const topAssets = summary.byAsset.filter((a) => a.totalYear > 0).slice(0, 8)

  return (
    <div
      data-slot="dividends-breakdown"
      className="grid grid-cols-1 gap-6 lg:grid-cols-2"
    >
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <h3 className="mb-4 font-semibold text-sm">
          Por classe em {summary.year}
        </h3>

        {summary.byCategoryType.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Nenhum provento recebido neste ano.
          </p>
        ) : (
          <div className="space-y-4">
            {summary.byCategoryType.map((item) => {
              const share =
                summary.totalYear > 0
                  ? (item.total / summary.totalYear) * 100
                  : 0

              return (
                <div key={item.type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className="size-2.5 rounded-full"
                        style={{
                          backgroundColor: CATEGORY_TYPE_CHART_COLORS[item.type]
                        }}
                      />
                      {CATEGORY_TYPE_LABELS[item.type]}
                    </span>
                    <span className="tabular-nums">
                      <span className="font-semibold">
                        {formatCurrency(item.total)}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {share.toFixed(1)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${share}%`,
                        backgroundColor: CATEGORY_TYPE_CHART_COLORS[item.type]
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Por ativo em {summary.year}</h3>
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="cursor-help text-[11px] text-muted-foreground underline decoration-dotted">
                  O que é YoC?
                </span>
              }
            />
            <TooltipContent>
              Yield on Cost: proventos dos últimos 12 meses ÷ valor investido
              (quantidade × preço médio).
            </TooltipContent>
          </Tooltip>
        </div>

        {topAssets.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Nenhum provento recebido neste ano.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {topAssets.map((asset) => (
              <li
                key={asset.assetId}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Badge variant="default" className="px-2 py-0.5 text-xs">
                    {asset.ticker || asset.name.slice(0, 3).toUpperCase()}
                  </Badge>
                  <span className="truncate text-muted-foreground text-xs">
                    {asset.name}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs tabular-nums">
                  {asset.yieldOnCost != null && (
                    <span className="rounded-sm bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-[10px] text-emerald-600 dark:text-emerald-400">
                      YoC {asset.yieldOnCost.toFixed(2)}%
                    </span>
                  )}
                  <span className="font-semibold">
                    {formatCurrency(asset.totalYear)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
