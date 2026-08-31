'use client'

import {
  Building2,
  CircleOff,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp
} from 'lucide-react'

import { AssetPriceInfo } from '@/features/assets/components/AssetPriceInfo'
import { CategoryType } from '@/features/categories/api/types'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'
import { cn } from '@/shared/lib/utils'
import { CURRENCIES } from '@/shared/utils/currencies'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatPercentage } from '@/shared/utils/format-percentage'

import type { AssetWithCategory } from '../../types'

interface AssetCardProps {
  asset: AssetWithCategory
  onEdit: (asset: AssetWithCategory) => void
  onDelete: (asset: AssetWithCategory) => void
  className?: string
}

const CATEGORY_TYPE_COLORS: Record<CategoryType, string> = {
  [CategoryType.FIXED]:
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  [CategoryType.VARIABLE_BR]: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  [CategoryType.VARIABLE_US]:
    'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  [CategoryType.CRYPTO]: 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
}

const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  [CategoryType.FIXED]: 'Renda Fixa',
  [CategoryType.VARIABLE_BR]: 'Ações BR',
  [CategoryType.VARIABLE_US]: 'Ações EUA',
  [CategoryType.CRYPTO]: 'Cripto'
}

export function AssetCard({
  asset,
  onEdit,
  onDelete,
  className
}: AssetCardProps) {
  const hasPL = asset.profitLoss != null && asset.profitLoss !== 0
  const isPositivePL = hasPL && asset.profitLoss! > 0
  const isNegativePL = hasPL && asset.profitLoss! < 0
  const catType = asset.category?.type || CategoryType.FIXED
  const currency = asset.category?.currency || CURRENCIES[catType]

  return (
    <Card
      data-slot="asset-card"
      className={cn(
        'flex flex-col border-border transition-shadow hover:shadow-md',
        !asset.isActive && 'bg-muted/10 opacity-60',
        className
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2.5">
          <Badge
            variant="default"
            className="shrink-0 px-2 py-0.5 font-bold text-xs"
          >
            {asset.ticker || asset.name.substring(0, 3).toUpperCase()}
          </Badge>
          <div>
            <h3
              className="truncate font-semibold text-foreground text-sm"
              title={asset.name}
            >
              {asset.name}
            </h3>
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

        <div className="flex items-center gap-1">
          {!asset.isActive && (
            <Badge
              variant="secondary"
              className="gap-1 border-0 bg-muted text-[10px] text-muted-foreground"
            >
              <CircleOff className="size-2.5" />
              Inativo
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onEdit(asset)}
          >
            <Pencil className="size-3.5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-destructive hover:text-destructive/80"
            onClick={() => onDelete(asset)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-4 pt-1">
        <div className="grid grid-cols-4 gap-2 rounded-xl bg-muted/20 p-3">
          <div className="space-y-0.5">
            <span className="text-muted-foreground/60 text-xs">Quantidade</span>
            <p className="font-semibold text-foreground text-xs tabular-nums">
              {asset.quantity != null
                ? asset.quantity.toLocaleString('pt-BR')
                : '—'}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground/60 text-xs">
              Preço Médio
            </span>
            <p className="font-semibold text-foreground text-xs tabular-nums">
              {asset.averagePrice != null
                ? formatCurrency(asset.averagePrice, currency)
                : '—'}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground/60 text-xs">
              Valor Investido
            </span>
            <p className="font-medium text-foreground text-xs tabular-nums">
              {asset.investedValue != null
                ? formatCurrency(asset.investedValue, currency)
                : '—'}
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground/60 text-xs">
              Saldo Atual
            </span>
            <p className="font-semibold text-foreground text-xs tabular-nums">
              {asset.currentBalance != null
                ? formatCurrency(asset.currentBalance, currency)
                : '—'}
            </p>
          </div>
        </div>

        {catType !== 'FIXED' && (
          <AssetPriceInfo
            currentClosePrice={asset.currentClosePrice}
            lastMonthClosePrice={asset.lastMonthClosePrice}
            currency={currency}
          />
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
                    isPositivePL &&
                      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                    isNegativePL &&
                      'bg-red-500/15 text-red-600 dark:text-red-400'
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
                      isPositivePL && 'text-emerald-600 dark:text-emerald-400',
                      isNegativePL && 'text-red-600 dark:text-red-400'
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
