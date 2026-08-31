'use client'

import { Building2, CircleOff, Pencil, Trash2 } from 'lucide-react'

import { CategoryType } from '@/features/categories/api/types'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/shared/components/ui/table'
import { cn } from '@/shared/lib/utils'
import { CURRENCIES } from '@/shared/utils/currencies'
import { formatCurrency } from '@/shared/utils/format-currency'
import {
  calcPercentageChange,
  formatPercentage
} from '@/shared/utils/format-percentage'

import type { AssetWithCategory } from '../../types'

interface AssetTableProps {
  assets: AssetWithCategory[]
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
  [CategoryType.VARIABLE_BR]: 'Ações Nacionais',
  [CategoryType.VARIABLE_US]: 'Ações Internacionais',
  [CategoryType.CRYPTO]: 'Criptomoedas'
}

export function AssetTable({
  assets,
  onEdit,
  onDelete,
  className
}: AssetTableProps) {
  if (assets.length === 0) {
    return null
  }

  return (
    <div
      data-slot="asset-table-wrapper"
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-xs',
        className
      )}
    >
      <Table data-slot="asset-table">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-55 font-semibold text-xs">Ativo</TableHead>
            <TableHead className="font-semibold text-xs">Categoria</TableHead>
            <TableHead className="font-semibold text-xs">Corretora</TableHead>
            <TableHead className="text-right font-semibold text-xs">
              Quantidade
            </TableHead>
            <TableHead className="text-right font-semibold text-xs">
              Preço Médio
            </TableHead>
            <TableHead className="text-right font-semibold text-xs">
              Cotação Atual
            </TableHead>
            <TableHead className="text-right font-semibold text-xs">
              Total Investido
            </TableHead>
            <TableHead className="text-right font-semibold text-xs">
              Saldo Atual
            </TableHead>
            <TableHead className="text-right font-semibold text-xs">
              Lucro / Prejuízo
            </TableHead>
            <TableHead className="w-22.5 text-center font-semibold text-xs">
              Status
            </TableHead>
            <TableHead className="w-20 text-right font-semibold text-xs">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => {
            const hasPL = asset.profitLoss != null && asset.profitLoss !== 0
            const isPositivePL = hasPL && asset.profitLoss! > 0
            const isNegativePL = hasPL && asset.profitLoss! < 0

            const hasComparison =
              asset.currentClosePrice != null &&
              asset.lastMonthClosePrice != null &&
              asset.lastMonthClosePrice !== 0
            const percentagePriceChange = hasComparison
              ? calcPercentageChange(
                  asset.currentClosePrice!,
                  asset.lastMonthClosePrice!
                )
              : null

            const catType = asset.category?.type || CategoryType.FIXED
            const currency = asset.category?.currency || CURRENCIES[catType]

            return (
              <TableRow
                key={asset.id}
                className={cn(
                  'transition-colors',
                  !asset.isActive && 'bg-muted/20 opacity-60'
                )}
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Badge
                      variant="default"
                      className="shrink-0 px-2 py-0.5 font-bold text-xs"
                    >
                      {asset.ticker || asset.name.substring(0, 3).toUpperCase()}
                    </Badge>
                    <span
                      className="truncate font-medium text-foreground text-xs"
                      title={asset.name}
                    >
                      {asset.name}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground text-xs">
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
                  </div>
                </TableCell>

                <TableCell>
                  {asset.broker ? (
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Building2 className="size-3" />
                      <span>{asset.broker}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/60 text-xs">—</span>
                  )}
                </TableCell>

                <TableCell className="text-right font-medium text-foreground text-xs tabular-nums">
                  {asset.quantity != null
                    ? asset.quantity.toLocaleString('pt-BR')
                    : '—'}
                </TableCell>

                <TableCell className="text-right font-medium text-foreground text-xs tabular-nums">
                  {asset.averagePrice != null
                    ? formatCurrency(asset.averagePrice, currency)
                    : '—'}
                </TableCell>

                <TableCell className="text-right text-xs tabular-nums">
                  {asset.currentClosePrice != null ? (
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-foreground">
                        {formatCurrency(asset.currentClosePrice, currency)}
                      </span>
                      {percentagePriceChange !== null && (
                        <span
                          className={cn(
                            'font-medium text-[10px]',
                            percentagePriceChange >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          )}
                        >
                          {formatPercentage(percentagePriceChange)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground/60 italic">—</span>
                  )}
                </TableCell>

                <TableCell className="text-right font-medium text-foreground text-xs tabular-nums">
                  {asset.investedValue != null
                    ? formatCurrency(asset.investedValue, currency)
                    : '—'}
                </TableCell>

                <TableCell className="text-right font-semibold text-foreground text-xs tabular-nums">
                  {asset.currentBalance != null
                    ? formatCurrency(asset.currentBalance, currency)
                    : '—'}
                </TableCell>

                <TableCell className="text-right text-xs tabular-nums">
                  {hasPL ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <span
                        className={cn(
                          'font-semibold',
                          isPositivePL &&
                            'text-emerald-600 dark:text-emerald-400',
                          isNegativePL && 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {isPositivePL ? '+' : ''}
                        {formatCurrency(asset.profitLoss!, currency)}
                      </span>
                      {asset.profitabilityPercentage != null && (
                        <span
                          className={cn(
                            'font-medium text-[10px]',
                            isPositivePL &&
                              'text-emerald-600 dark:text-emerald-400',
                            isNegativePL && 'text-red-600 dark:text-red-400'
                          )}
                        >
                          {formatPercentage(asset.profitabilityPercentage)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground/60 text-xs">—</span>
                  )}
                </TableCell>

                <TableCell className="text-center">
                  {asset.isActive ? (
                    <Badge
                      variant="secondary"
                      className="border-0 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
                    >
                      Ativo
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="gap-1 border-0 bg-muted text-[10px] text-muted-foreground"
                    >
                      <CircleOff className="size-2.5" />
                      Inativo
                    </Badge>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => onEdit(asset)}
                      title="Editar Ativo"
                    >
                      <Pencil className="size-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive/80"
                      onClick={() => onDelete(asset)}
                      title="Remover Ativo"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
