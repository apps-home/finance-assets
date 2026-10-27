import { Building2, CircleOff, TrendingDown, TrendingUp } from 'lucide-react'
import type { KeyboardEvent } from 'react'

import type { AssetWithCategory } from '@/features/assets/api/types'
import { calcAssetMetrics } from '@/features/assets/utils/asset-metrics'
import { formatIndexer } from '@/features/assets/utils/fixed-income'
import { CategoryType } from '@/features/categories/api/types'
import {
  CATEGORY_TYPE_COLORS,
  CATEGORY_TYPE_LABELS,
  getCategoryCurrency
} from '@/features/categories/utils'
import { Badge } from '@/shared/components/ui/badge'
import { TableCell, TableRow } from '@/shared/components/ui/table'
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

import { EmptyValue, RowActions, TrendBadge } from './parts'

interface AssetTableRowProps {
  asset: AssetWithCategory
  yieldOnCost?: number
  onView: (asset: AssetWithCategory) => void
  onEdit: (asset: AssetWithCategory) => void
  onDelete: (asset: AssetWithCategory) => void
}

export function AssetTableRow({
  asset,
  yieldOnCost,
  onView,
  onEdit,
  onDelete
}: AssetTableRowProps) {
  const currency = getCategoryCurrency(asset.category)
  const catType = asset.category?.type || CategoryType.VARIABLE_BR
  const indexerLabel = formatIndexer(asset.indexer, asset.indexerRate)
  const {
    monthChange,
    pmDiffPercent,
    hasProfitLoss,
    isPositivePL,
    isNegativePL
  } = calcAssetMetrics(asset)

  const isMonthPositive = monthChange != null && monthChange >= 0
  const isAbovePM = pmDiffPercent != null && pmDiffPercent >= 0
  // Ativo inativo: atenua só os dados, não as ações
  const dim = !asset.isActive && 'opacity-60'

  // Só reage ao teclado quando o foco está na própria linha (não nos botões)
  function handleKeyDown(e: KeyboardEvent<HTMLTableRowElement>) {
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onView(asset)
    }
  }

  return (
    <TableRow
      tabIndex={0}
      onClick={() => onView(asset)}
      onKeyDown={handleKeyDown}
      className={cn(
        'group cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none',
        !asset.isActive && 'bg-muted/15'
      )}
    >
      {/* Ativo, categoria, corretora e quantidade */}
      <TableCell
        className={cn(
          'sticky left-0 z-10 bg-card py-3 group-hover:bg-muted',
          dim
        )}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="default"
              className="shrink-0 px-2 py-0.5 font-bold text-xs"
            >
              {asset.ticker || asset.name.substring(0, 3).toUpperCase()}
            </Badge>
            <Badge
              variant="secondary"
              className={cn(
                'border-0 px-1.5 py-0 font-medium text-xs',
                CATEGORY_TYPE_COLORS[catType]
              )}
            >
              {asset.category?.name || CATEGORY_TYPE_LABELS[catType] || catType}
            </Badge>
            {!asset.isActive && (
              <Badge
                variant="secondary"
                className="gap-1 border-0 bg-muted px-1.5 py-0 text-muted-foreground text-xs"
              >
                <CircleOff className="size-2.5" />
                Inativo
              </Badge>
            )}
          </div>

          <Tooltip>
            <TooltipTrigger
              render={
                <span className="block max-w-60 truncate font-medium text-foreground text-xs">
                  {asset.name}
                </span>
              }
            />
            <TooltipContent>{asset.name}</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            {asset.broker && (
              <span className="flex items-center gap-1">
                <Building2 className="size-3 text-muted-foreground/70" />
                <span className="max-w-28 truncate">{asset.broker}</span>
              </span>
            )}
            {asset.broker && (indexerLabel || asset.quantity != null) && (
              <span className="text-muted-foreground/40">•</span>
            )}
            {indexerLabel ? (
              <span>{indexerLabel}</span>
            ) : (
              asset.quantity != null && (
                <span className="tabular-nums">
                  {formatQuantity(asset.quantity)} cotas
                </span>
              )
            )}
          </div>
        </div>
      </TableCell>

      {/* Cotação atual e variação do mês (MTD) */}
      <TableCell className={cn('py-3 text-right', dim)}>
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-bold text-foreground text-xs tabular-nums">
            {asset.currentClosePrice != null
              ? formatCurrency(asset.currentClosePrice, currency)
              : '—'}
          </span>

          {monthChange != null ? (
            <Tooltip>
              <TooltipTrigger render={<span className="inline-flex" />}>
                <TrendBadge
                  positive={isMonthPositive}
                  icon={
                    isMonthPositive ? (
                      <TrendingUp className="size-2.5" />
                    ) : (
                      <TrendingDown className="size-2.5" />
                    )
                  }
                >
                  {formatPercentage(monthChange)}
                </TrendBadge>
              </TooltipTrigger>
              <TooltipContent>
                Fechamento anterior:{' '}
                {asset.lastMonthClosePrice != null
                  ? formatCurrency(asset.lastMonthClosePrice, currency)
                  : '—'}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="text-muted-foreground/60 text-xs italic">
              Sem var. MTD
            </span>
          )}
        </div>
      </TableCell>

      {/* Preço médio e margem vs cotação */}
      <TableCell className={cn('py-3 text-right', dim)}>
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-medium text-foreground text-xs tabular-nums">
            {asset.averagePrice != null
              ? formatCurrency(asset.averagePrice, currency)
              : '—'}
          </span>

          {pmDiffPercent != null ? (
            <TrendBadge positive={isAbovePM}>
              {formatPercentage(pmDiffPercent)} vs PM
            </TrendBadge>
          ) : (
            <EmptyValue />
          )}
        </div>
      </TableCell>

      {/* Posição e retorno total */}
      <TableCell className={cn('py-3 text-right', dim)}>
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-bold text-foreground text-xs tabular-nums">
            {asset.currentBalance != null
              ? formatCurrency(asset.currentBalance, currency)
              : '—'}
          </span>

          {hasProfitLoss && asset.profitLoss != null ? (
            <span
              className={cn(
                'font-semibold text-xs tabular-nums',
                isPositivePL && TREND_CLASSES.positive.text,
                isNegativePL && TREND_CLASSES.negative.text
              )}
            >
              {isPositivePL ? '+' : ''}
              {formatCurrency(asset.profitLoss, currency)}
              {asset.profitabilityPercentage != null &&
                ` (${formatPercentage(asset.profitabilityPercentage)})`}
            </span>
          ) : (
            <EmptyValue />
          )}

          {asset.investedValue != null && (
            <span className="text-muted-foreground/70 text-xs tabular-nums">
              Inv: {formatCurrency(asset.investedValue, currency)}
            </span>
          )}
        </div>
      </TableCell>

      {/* Yield on Cost */}
      <TableCell className={cn('py-3 text-right', dim)}>
        {yieldOnCost != null ? (
          <TrendBadge positive>{formatPercentage(yieldOnCost)}</TrendBadge>
        ) : (
          <EmptyValue />
        )}
      </TableCell>

      {/* Ações rápidas */}
      <TableCell
        className="py-3 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <RowActions asset={asset} onEdit={onEdit} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  )
}
