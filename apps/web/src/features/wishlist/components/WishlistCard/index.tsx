'use client'

import { Badge } from '@lib/ui/components/badge'
import { Button } from '@lib/ui/components/button'
import { Card, CardContent, CardHeader } from '@lib/ui/components/card'
import { Separator } from '@lib/ui/components/separator'
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

interface WishlistCardProps {
  item: WishlistWithCategory
  onEdit: (item: WishlistWithCategory) => void
  onDelete: (item: WishlistWithCategory) => void
  onViewDetails: (item: WishlistWithCategory) => void
  onAddToPortfolio: (item: WishlistWithCategory) => void
  className?: string
}

export function WishlistCard({
  item,
  onEdit,
  onDelete,
  onViewDetails,
  onAddToPortfolio,
  className
}: WishlistCardProps) {
  const { wishlist, category } = item
  const catType = category?.type || CategoryType.VARIABLE_BR
  const currency = getCategoryCurrency(category)

  const currentPrice = wishlist.currentClosePrice
  const lastMonthPrice = wishlist.lastMonthClosePrice
  const targetPrice = wishlist.targetPrice

  const monthlyChange = calcMonthChange(currentPrice, lastMonthPrice)
  const { hasTarget, isAtOrBelowTarget, isAboveTarget, distancePercentage } =
    getTargetPriceInfo(currentPrice, targetPrice)

  return (
    <Card
      data-slot="wishlist-card"
      tabIndex={0}
      onClick={() => onViewDetails(item)}
      onKeyDown={(e) => {
        // Só reage ao teclado quando o foco está no próprio card (não nos botões)
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onViewDetails(item)
        }
      }}
      className={cn(
        'flex cursor-pointer flex-col border-border transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-2.5">
          <Badge
            variant="default"
            className="shrink-0 px-2 py-0.5 font-bold text-xs"
          >
            {wishlist.ticker}
          </Badge>
          <div>
            <Tooltip>
              <TooltipTrigger
                render={
                  <h3 className="truncate font-semibold text-foreground text-sm">
                    {wishlist.name}
                  </h3>
                }
              />
              <TooltipContent>{wishlist.name}</TooltipContent>
            </Tooltip>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="font-medium text-muted-foreground text-xs">
                {category?.name || '—'}
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
          </div>
        </div>

        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
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
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-4 pt-1">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/20 p-3">
          <div className="space-y-0.5">
            <span className="text-muted-foreground/60 text-xs">
              Cotação Atual
            </span>
            <p className="font-semibold text-foreground text-sm tabular-nums">
              {currentPrice != null ? (
                formatCurrency(currentPrice, currency)
              ) : (
                <span className="font-normal text-muted-foreground/60 text-xs italic">
                  Aguardando...
                </span>
              )}
            </p>
            {monthlyChange !== null && (
              <p
                className={cn(
                  'font-medium text-[10px] tabular-nums',
                  monthlyChange >= 0
                    ? TREND_CLASSES.positive.text
                    : TREND_CLASSES.negative.text
                )}
              >
                {formatPercentage(monthlyChange)} no mês
              </p>
            )}
          </div>

          <div className="space-y-0.5">
            <span className="text-muted-foreground/60 text-xs">Preço Alvo</span>
            <p className="font-semibold text-foreground text-sm tabular-nums">
              {targetPrice != null ? (
                formatCurrency(targetPrice, currency)
              ) : (
                <span className="font-normal text-muted-foreground/60 text-xs italic">
                  Não definido
                </span>
              )}
            </p>
            {hasTarget && (
              <div className="pt-0.5">
                {isAtOrBelowTarget ? (
                  <Badge
                    variant="secondary"
                    className="gap-1 border-0 bg-emerald-500/10 px-1.5 py-0 text-[10px] text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle2 className="size-2.5" />
                    No Preço
                  </Badge>
                ) : isAboveTarget ? (
                  <Badge
                    variant="secondary"
                    className="gap-1 border-0 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-600 dark:text-amber-400"
                  >
                    <TrendingUp className="size-2.5" />
                    Acima (+
                    {distancePercentage !== null &&
                      formatPercentage(distancePercentage)}
                    )
                  </Badge>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {wishlist.notes && (
          <>
            <Separator />
            <div className="flex items-start gap-1.5 text-muted-foreground text-xs">
              <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <p className="line-clamp-2">{wishlist.notes}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
