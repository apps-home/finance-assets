'use client'

import { Badge } from '@lib/ui/components/badge'
import { Button } from '@lib/ui/components/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@lib/ui/components/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@lib/ui/components/tooltip'
import { cn } from '@lib/ui/lib/utils'
import {
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Pencil,
  Target,
  Trash2,
  TrendingUp
} from 'lucide-react'

import { CategoryType } from '@/features/categories/api/types'
import {
  CATEGORY_TYPE_COLORS,
  CATEGORY_TYPE_LABELS,
  getCategoryCurrency
} from '@/features/categories/utils'
import type { WishlistWithCategory } from '@/features/wishlist/api/types'
import { getTargetPriceInfo } from '@/features/wishlist/utils/target-price'
import { formatCurrency } from '@/shared/utils/format-currency'
import {
  calcMonthChange,
  formatPercentage
} from '@/shared/utils/format-percentage'
import { TREND_CLASSES } from '@/shared/utils/trend-classes'

interface WishlistTableProps {
  items: WishlistWithCategory[]
  onEdit: (item: WishlistWithCategory) => void
  onDelete: (item: WishlistWithCategory) => void
  onViewDetails: (item: WishlistWithCategory) => void
  onAddToPortfolio: (item: WishlistWithCategory) => void
  className?: string
}

export function WishlistTable({
  items,
  onEdit,
  onDelete,
  onViewDetails,
  onAddToPortfolio,
  className
}: WishlistTableProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div
      data-slot="wishlist-table-wrapper"
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-xs',
        className
      )}
    >
      <Table data-slot="wishlist-table">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="sticky left-0 z-10 w-55 bg-card font-semibold text-xs">
              Ativo
            </TableHead>
            <TableHead className="font-semibold text-xs">Categoria</TableHead>
            <TableHead className="text-right font-semibold text-xs">
              Cotação Atual
            </TableHead>
            <TableHead className="text-right font-semibold text-xs">
              Preço Alvo
            </TableHead>
            <TableHead className="text-center font-semibold text-xs">
              Status do Alvo
            </TableHead>
            <TableHead className="font-semibold text-xs">Anotações</TableHead>
            <TableHead className="w-28 text-right font-semibold text-xs">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const { wishlist, category } = item
            const catType = category?.type || CategoryType.VARIABLE_BR
            const currency = getCategoryCurrency(category)

            const currentPrice = wishlist.currentClosePrice
            const lastMonthPrice = wishlist.lastMonthClosePrice
            const targetPrice = wishlist.targetPrice

            const monthlyChange = calcMonthChange(currentPrice, lastMonthPrice)
            const { hasTarget, isAtOrBelowTarget, distancePercentage } =
              getTargetPriceInfo(currentPrice, targetPrice)

            return (
              <TableRow
                key={wishlist.id}
                tabIndex={0}
                onClick={() => onViewDetails(item)}
                onKeyDown={(e) => {
                  // Só reage ao teclado quando o foco está na própria linha (não nos botões)
                  if (e.target !== e.currentTarget) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onViewDetails(item)
                  }
                }}
                className="cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
              >
                <TableCell className="sticky left-0 z-10 bg-card">
                  <div className="flex items-center gap-2.5">
                    <Badge
                      variant="default"
                      className="shrink-0 px-2 py-0.5 font-bold text-xs"
                    >
                      {wishlist.ticker}
                    </Badge>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span className="truncate font-medium text-foreground text-xs">
                            {wishlist.name}
                          </span>
                        }
                      />
                      <TooltipContent>{wishlist.name}</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-0.5">
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

                <TableCell className="text-right text-xs tabular-nums">
                  {currentPrice != null ? (
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-foreground">
                        {formatCurrency(currentPrice, currency)}
                      </span>
                      {monthlyChange !== null && (
                        <span
                          className={cn(
                            'font-medium text-[10px]',
                            monthlyChange >= 0
                              ? TREND_CLASSES.positive.text
                              : TREND_CLASSES.negative.text
                          )}
                        >
                          {formatPercentage(monthlyChange)} no mês
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground/60 italic">—</span>
                  )}
                </TableCell>

                <TableCell className="text-right font-medium text-foreground text-xs tabular-nums">
                  {targetPrice != null ? (
                    formatCurrency(targetPrice, currency)
                  ) : (
                    <span className="text-muted-foreground/60 italic">—</span>
                  )}
                </TableCell>

                <TableCell className="text-center">
                  {hasTarget && currentPrice != null ? (
                    isAtOrBelowTarget ? (
                      <Badge
                        variant="secondary"
                        className="gap-1 border-0 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
                      >
                        <CheckCircle2 className="size-2.5" />
                        No Preço{' '}
                        {distancePercentage !== null && (
                          <span className="tabular-nums">
                            ({formatPercentage(distancePercentage)})
                          </span>
                        )}
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="gap-1 border-0 bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-400"
                      >
                        <TrendingUp className="size-2.5" />
                        Acima{' '}
                        {distancePercentage !== null && (
                          <span className="tabular-nums">
                            ({formatPercentage(distancePercentage)})
                          </span>
                        )}
                      </Badge>
                    )
                  ) : hasTarget ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 border-0 bg-muted text-[10px] text-muted-foreground"
                    >
                      <Target className="size-2.5" />
                      Aguardando cotação
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="border-0 bg-muted text-[10px] text-muted-foreground"
                    >
                      Sem meta
                    </Badge>
                  )}
                </TableCell>

                <TableCell>
                  {wishlist.notes ? (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <div className="flex max-w-xs items-center gap-1.5 text-muted-foreground text-xs">
                            <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{wishlist.notes}</span>
                          </div>
                        }
                      />
                      <TooltipContent className="max-w-xs text-xs">
                        {wishlist.notes}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-muted-foreground/40 text-xs">—</span>
                  )}
                </TableCell>

                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label="Adicionar à carteira"
                            onClick={() => onAddToPortfolio(item)}
                          >
                            <BriefcaseBusiness className="size-3.5 text-primary" />
                          </Button>
                        }
                      />
                      <TooltipContent>Adicionar à carteira</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => onEdit(item)}
                          >
                            <Pencil className="size-3.5 text-muted-foreground" />
                          </Button>
                        }
                      />
                      <TooltipContent>Editar Item</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive/80"
                            onClick={() => onDelete(item)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        }
                      />
                      <TooltipContent>Remover da Wishlist</TooltipContent>
                    </Tooltip>
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
