'use client'

import { useQuery } from '@tanstack/react-query'
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

import { listAssetsByCategory } from '@/features/assets/api'
import type { Category } from '@/features/categories/api/types'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatPercentage } from '@/shared/utils/format-percentage'

interface CategoryCardProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onAddAsset?: (category: Category) => void
  className?: string
}

const CATEGORY_TYPE_COLORS: Record<string, string> = {
  FIXED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  VARIABLE_BR: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  VARIABLE_US: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  CRYPTO: 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
}

const CATEGORY_TYPE_BG: Record<string, string> = {
  FIXED: 'bg-emerald-500',
  VARIABLE_BR: 'bg-blue-500',
  VARIABLE_US: 'bg-violet-500',
  CRYPTO: 'bg-amber-500'
}

const CATEGORY_TYPE_LABELS: Record<string, string> = {
  FIXED: 'Renda Fixa',
  VARIABLE_BR: 'Ações Brasil',
  VARIABLE_US: 'Ações EUA',
  CRYPTO: 'Cripto'
}

const CURRENCY_LABELS: Record<string, string> = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
  GBP: '£'
}

export function CategoryCard({
  category,
  onEdit,
  onDelete,
  onAddAsset,
  className
}: CategoryCardProps) {
  const categoryType = category.type

  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets', category.id],
    queryFn: () => listAssetsByCategory(category.id)
  })

  const assetCount = assets?.length || 0
  const targetPercentage = category.targetPercentage

  const totals = (assets || []).reduce(
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
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
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
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onEdit(category)}
            title="Editar Categoria"
          >
            <Edit2 className="size-3.5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-destructive hover:text-destructive/80"
            onClick={() => onDelete(category)}
            title="Excluir Categoria"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target className="size-3.5 text-primary" />
              <span className="font-semibold text-foreground text-xs">
                Meta de Alocação
              </span>
            </div>
            {targetPercentage != null && targetPercentage > 0 ? (
              <span className="font-bold text-primary text-sm tabular-nums">
                {targetPercentage}%
              </span>
            ) : (
              <span className="text-muted-foreground text-xs italic">
                Não definida
              </span>
            )}
          </div>

          {targetPercentage != null && targetPercentage > 0 && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  CATEGORY_TYPE_BG[categoryType] || 'bg-primary'
                )}
                style={{
                  width: `${Math.min(targetPercentage, 100)}%`
                }}
              />
            </div>
          )}
        </div>

        {isLoadingAssets ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/15 p-3">
            <div className="space-y-0.5">
              <span className="text-muted-foreground/60 text-xs">
                Total Investido
              </span>
              <p className="font-medium text-foreground text-xs tabular-nums">
                {formatCurrency(totals.investedValue)}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground/60 text-xs">
                Saldo Atual
              </span>
              <p className="font-semibold text-foreground text-xs tabular-nums">
                {formatCurrency(totals.currentBalance)}
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
                    totals.profitLoss > 0 &&
                      'text-emerald-600 dark:text-emerald-400',
                    totals.profitLoss < 0 && 'text-red-600 dark:text-red-400',
                    totals.profitLoss === 0 && 'text-muted-foreground'
                  )}
                >
                  {formatCurrency(totals.profitLoss)}
                </p>
                {totalProfitPercentage !== 0 && (
                  <span
                    className={cn(
                      'font-medium text-[10px] tabular-nums',
                      totalProfitPercentage > 0 &&
                        'text-emerald-600 dark:text-emerald-400',
                      totalProfitPercentage < 0 &&
                        'text-red-600 dark:text-red-400'
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
              Anos:
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

      <CardFooter className="flex items-center justify-between p-3">
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
