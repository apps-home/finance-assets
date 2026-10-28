'use client'

import { Badge } from '@lib/ui/components/badge'
import { Button } from '@lib/ui/components/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@lib/ui/components/card'
import { Separator } from '@lib/ui/components/separator'
import { Skeleton } from '@lib/ui/components/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@lib/ui/components/tooltip'
import { cn } from '@lib/ui/lib/utils'
import {
  Briefcase,
  Edit2,
  ExternalLink,
  Plus,
  Target,
  Trash2,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

import type { AssetWithCategory } from '@/features/assets/api/types'
import { Category } from '@/features/categories/api/types'
import { CategoryAllocation } from '@/features/categories/types/allocation'
import {
  CATEGORY_TYPE_BG,
  CATEGORY_TYPE_COLORS,
  CATEGORY_TYPE_LABELS,
  CURRENCY_LABELS
} from '@/features/categories/utils'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatPercentage } from '@/shared/utils/format-percentage'
import { TREND_CLASSES } from '@/shared/utils/trend-classes'

import { AllocationBadge } from '../AllocationBadge'

interface CategoryCardProps {
  category: Category
  assets: AssetWithCategory[]
  isLoadingAssets: boolean
  allocation?: CategoryAllocation
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onAddAsset?: (category: Category) => void
  className?: string
}

export function CategoryCard({
  category,
  assets,
  isLoadingAssets,
  allocation,
  onEdit,
  onDelete,
  onAddAsset,
  className
}: CategoryCardProps) {
  const categoryType = category.type

  const assetCount = assets.length
  const targetPercentage = category.targetPercentage

  const totals = assets.reduce(
    (acc, asset) => ({
      investedValue: acc.investedValue + (asset.investedValue || 0),
      currentBalance: acc.currentBalance + (asset.currentBalance || 0),
      profitLoss: acc.profitLoss + (asset.profitLoss || 0)
    }),
    { investedValue: 0, currentBalance: 0, profitLoss: 0 }
  )

  const totalProfitPercentage =
    totals.investedValue > 0
      ? ((totals.currentBalance - totals.investedValue) /
          totals.investedValue) *
        100
      : 0

  return (
    <Card
      data-slot="category-card"
      className={cn(
        'flex flex-col overflow-hidden border-border shadow-xs transition-shadow hover:shadow-md',
        className
      )}
    >
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-xl',
              CATEGORY_TYPE_COLORS[categoryType]
            )}
          >
            <TrendingUp className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base">{category.name}</CardTitle>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  'border-0 text-[10px]',
                  CATEGORY_TYPE_COLORS[categoryType]
                )}
              >
                {CATEGORY_TYPE_LABELS[categoryType] || categoryType}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {CURRENCY_LABELS[category.currency] || category.currency}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => onEdit(category)}
                >
                  <Edit2 className="size-3.5 text-muted-foreground" />
                </Button>
              }
            />
            <TooltipContent>Editar Categoria</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive/80"
                  onClick={() => onDelete(category)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent>Excluir Categoria</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target className="size-3.5 text-primary" />
              <span className="font-semibold text-foreground text-xs">
                Meta de Alocação
              </span>
            </div>
            {targetPercentage != null && targetPercentage > 0 ? (
              <div className="flex items-center gap-1.5">
                {allocation && <AllocationBadge allocation={allocation} />}
                <span className="font-bold text-primary text-xs tabular-nums">
                  {targetPercentage}%
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground text-xs italic">
                Não definida
              </span>
            )}
          </div>

          {targetPercentage != null && targetPercentage > 0 && (
            <div className="space-y-1.5">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/70">
                {allocation && (
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      CATEGORY_TYPE_BG[categoryType] || 'bg-primary'
                    )}
                    style={{
                      width: `${Math.min(allocation.actualPercentage, 100)}%`
                    }}
                  />
                )}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-foreground shadow-xs"
                  style={{ left: `${Math.min(targetPercentage, 100)}%` }}
                />
              </div>

              {allocation && (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
                  <span>
                    Real:{' '}
                    <strong className="font-medium text-foreground">
                      {allocation.actualPercentage.toFixed(1)}%
                    </strong>
                  </span>
                  <span>
                    Meta:{' '}
                    <strong className="font-medium text-primary">
                      {targetPercentage}%
                    </strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {isLoadingAssets ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/15 p-3 sm:grid-cols-3">
            <div className="space-y-0.5">
              <span className="text-muted-foreground/60 text-xs">
                Total Investido
              </span>
              <p className="font-medium text-foreground text-xs tabular-nums">
                {formatCurrency(totals.investedValue, category.currency)}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground/60 text-xs">
                Saldo Atual
              </span>
              <p className="font-semibold text-foreground text-xs tabular-nums">
                {formatCurrency(totals.currentBalance, category.currency)}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground/60 text-xs">
                Lucro / Prejuízo
              </span>
              <div className="flex flex-col">
                <p
                  className={cn(
                    'font-semibold text-xs tabular-nums',
                    totals.profitLoss > 0 && TREND_CLASSES.positive.text,
                    totals.profitLoss < 0 && TREND_CLASSES.negative.text,
                    totals.profitLoss === 0 && 'text-muted-foreground'
                  )}
                >
                  {formatCurrency(totals.profitLoss, category.currency)}
                </p>
                {totalProfitPercentage !== 0 && (
                  <span
                    className={cn(
                      'font-medium text-[10px] tabular-nums',
                      totalProfitPercentage > 0 && TREND_CLASSES.positive.text,
                      totalProfitPercentage < 0 && TREND_CLASSES.negative.text
                    )}
                  >
                    {formatPercentage(totalProfitPercentage)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {category.years && category.years.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Competências:
            </span>
            <div className="flex flex-wrap gap-1">
              {category.years
                .sort((a, b) => a - b)
                .map((year) => (
                  <span
                    key={year}
                    className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 font-medium text-[10px] text-primary"
                  >
                    {year}
                  </span>
                ))}
            </div>
          </div>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-wrap items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-1.5">
          <Briefcase className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground text-xs">
            {isLoadingAssets
              ? 'Carregando...'
              : `${assetCount} ${assetCount === 1 ? 'ativo' : 'ativos'}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onAddAsset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddAsset(category)}
              className="h-7 gap-1 px-2 text-xs"
            >
              <Plus className="size-3" />
              Ativo
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-7 gap-1 px-2.5 text-xs hover:bg-primary/10 hover:text-primary"
          >
            <Link href={`/assets?category=${category.id}`}>
              Ver Ativos
              <ExternalLink className="size-3" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
