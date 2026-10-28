'use client'

import { Card, CardContent } from '@lib/ui/components/card'
import { cn } from '@lib/ui/lib/utils'
import { AlertCircle, CheckCircle2, Eye, TrendingUp } from 'lucide-react'

import type { WishlistWithCategory } from '@/features/wishlist/api/types'
import { getTargetPriceInfo } from '@/features/wishlist/utils/target-price'

interface WishlistSummaryCardsProps {
  items: WishlistWithCategory[]
  className?: string
}

export function WishlistSummaryCards({
  items,
  className
}: WishlistSummaryCardsProps) {
  const totalCount = items.length

  const targetInfos = items.map(({ wishlist }) =>
    getTargetPriceInfo(wishlist.currentClosePrice, wishlist.targetPrice)
  )

  // Itens com preço alvo definido
  const itemsWithTargetCount = targetInfos.filter(
    (info) => info.hasTarget
  ).length

  // Itens onde a cotação atual está menor ou igual ao preço alvo (oportunidade de compra!)
  const targetReachedItems = targetInfos.filter(
    (info) => info.isAtOrBelowTarget
  )

  // Itens onde a cotação está acima do preço alvo
  const aboveTargetItems = targetInfos.filter((info) => info.isAboveTarget)

  // Sem preço alvo
  const noTargetCount = totalCount - itemsWithTargetCount

  return (
    <div
      data-slot="wishlist-summary-cards"
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-xs">
              Total Monitorados
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Eye className="size-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <p className="font-bold text-foreground text-xl tabular-nums">
              {totalCount}
            </p>
            <p className="text-muted-foreground text-xs">
              {itemsWithTargetCount} com meta de preço
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-xs">
              No Preço / Abaixo
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <p className="font-bold text-emerald-600 text-xl tabular-nums dark:text-emerald-400">
              {targetReachedItems.length}
            </p>
            <p className="text-muted-foreground text-xs">
              Oportunidades de aporte identificadas
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-xs">
              Acima do Alvo
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <p className="font-bold text-amber-600 text-xl tabular-nums dark:text-amber-400">
              {aboveTargetItems.length}
            </p>
            <p className="text-muted-foreground text-xs">
              Aguardando correção para aporte
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-xs">
              Sem Alvo Definido
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <AlertCircle className="size-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <p className="font-bold text-foreground text-xl tabular-nums">
              {noTargetCount}
            </p>
            <p className="text-muted-foreground text-xs">
              Ativos apenas em observação
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
