'use client'

import {
  Building2,
  CircleOff,
  Eye,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp
} from 'lucide-react'

import type { AssetWithCategory } from '@/features/assets/api/types'
import { AssetPriceInfo } from '@/features/assets/components/AssetPriceInfo'
import { CategoryType } from '@/features/categories/api/types'
import {
  CATEGORY_TYPE_COLORS,
  CATEGORY_TYPE_LABELS,
  getCategoryCurrency
} from '@/features/categories/utils'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatQuantity } from '@/shared/utils/format-number'
import { formatPercentage } from '@/shared/utils/format-percentage'
import { TREND_CLASSES } from '@/shared/utils/trend-classes'

interface AssetCardProps {
  asset: AssetWithCategory
  onEdit: (asset: AssetWithCategory) => void
  onDelete: (asset: AssetWithCategory) => void
  onViewDetails?: (asset: AssetWithCategory) => void
  /** Yield on Cost (%) dos últimos 12 meses, vindo do resumo de proventos */
  yieldOnCost?: number | null
  className?: string
}

export function AssetCard({
  asset,
  onEdit,
  onDelete,
  onViewDetails,
  yieldOnCost,
  className
}: AssetCardProps) {
  const hasPL = asset.profitLoss != null && asset.profitLoss !== 0
  const isPositivePL = hasPL && asset.profitLoss! > 0
  const isNegativePL = hasPL && asset.profitLoss! < 0
  const catType = asset.category?.type || CategoryType.FIXED
  const currency = getCategoryCurrency(asset.category)

  return (
    <Card
      data-slot="asset-card"
      className={cn(
        'flex flex-col border-border transition-shadow hover:shadow-md',
        onViewDetails && 'cursor-pointer hover:border-primary/40',
        !asset.isActive && 'bg-muted/10 opacity-60',
        className
      )}
      onClick={() => onViewDetails?.(asset)}
    >
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-2.5">
          <Badge
            variant="default"
            className="shrink-0 px-2 py-0.5 font-bold text-xs"
          >
            {asset.ticker || asset.name.substring(0, 3).toUpperCase()}
          </Badge>
          <div>
            <Tooltip>
              <TooltipTrigger
                render={
                  <h3 className="truncate font-semibold text-foreground text-sm">
                    {asset.name}
                  </h3>
                }
              />
              <TooltipContent>{asset.name}</TooltipContent>
            </Tooltip>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="font-medium text-muted-foreground text-xs">
                {asset.category?.name || '—'}
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'w-fit border-0 px-1.5 py-0 text-[10px]',
                  CATEGORY_TYPE_COLORS[catType]
                )}
              >
                {CATEGORY_TYPE_LABELS[catType] || catType}
              </Badge>
              {asset.broker && (
                <span className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Building2 className="size-3" />
                  {asset.broker}
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {!asset.isActive && (
            <Badge
              variant="secondary"
              className="gap-1 border-0 bg-muted text-[10px] text-muted-foreground"
            >
              <CircleOff className="size-2.5" />
              Inativo
            </Badge>
          )}

          {onViewDetails && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    onClick={() => onViewDetails(asset)}
                  >
                    <Eye className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent>Métricas e Detalhes</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => onEdit(asset)}
                >
                  <Pencil className="size-3.5 text-muted-foreground" />
                </Button>
              }
            />
            <TooltipContent>Editar Ativo</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive/80"
                  onClick={() => onDelete(asset)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent>Remover Ativo</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-4 pt-1">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/20 p-3 sm:grid-cols-4">
          <div className="space-y-0.5">
            <span className="text-muted-foreground text-xs">Quantidade</span>
            <p className="font-semibold text-foreground text-sm tabular-nums">
              {asset.quantity != null ? formatQuantity(asset.quantity) : '—'}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground text-xs">Preço médio</span>
            <p className="font-semibold text-foreground text-sm tabular-nums">
              {asset.averagePrice != null
                ? formatCurrency(asset.averagePrice, currency)
                : '—'}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground text-xs">
              Total investido
            </span>
            <p className="font-semibold text-foreground text-sm tabular-nums">
              {asset.investedValue != null
                ? formatCurrency(asset.investedValue, currency)
                : '—'}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground text-xs">Saldo atual</span>
            <p className="font-semibold text-foreground text-sm tabular-nums">
              {asset.currentBalance != null
                ? formatCurrency(asset.currentBalance, currency)
                : '—'}
            </p>
          </div>
        </div>

        <AssetPriceInfo
          currentClosePrice={asset.currentClosePrice}
          lastMonthClosePrice={asset.lastMonthClosePrice}
          currency={currency}
        />

        {yieldOnCost != null && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Yield on Cost</span>
            <span className="rounded-sm bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-600 text-xs tabular-nums dark:text-emerald-400">
              {yieldOnCost.toFixed(2)}%
            </span>
          </div>
        )}

        {hasPL && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                Lucro / Prejuízo
              </span>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    'gap-1 border-0 px-2 py-0.5 font-semibold text-xs tabular-nums',
                    isPositivePL && TREND_CLASSES.positive.badge,
                    isNegativePL && TREND_CLASSES.negative.badge
                  )}
                >
                  {isPositivePL ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {formatCurrency(Math.abs(asset.profitLoss!), currency)}
                </Badge>
                {asset.profitabilityPercentage != null && (
                  <span
                    className={cn(
                      'font-medium text-xs tabular-nums',
                      isPositivePL && TREND_CLASSES.positive.text,
                      isNegativePL && TREND_CLASSES.negative.text
                    )}
                  >
                    {formatPercentage(asset.profitabilityPercentage)}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
