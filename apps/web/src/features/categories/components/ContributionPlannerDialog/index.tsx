'use client'

import { Badge } from '@lib/ui/components/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@lib/ui/components/dialog'
import { Input } from '@lib/ui/components/input'
import { Label } from '@lib/ui/components/label'
import { cn } from '@lib/ui/lib/utils'
import { ArrowRight, Calculator, Info } from 'lucide-react'
import { useMemo, useState } from 'react'

import { CategoryType } from '@/features/categories/api/types'
import {
  CategoryAllocation,
  PortfolioAllocationSummary
} from '@/features/categories/types/allocation'
import {
  CATEGORY_TYPE_BG,
  CATEGORY_TYPE_COLORS,
  CATEGORY_TYPE_LABELS
} from '@/features/categories/utils'
import { distributeContribution } from '@/features/categories/utils/distribute-contribution'
import type { WishlistWithCategory } from '@/features/wishlist/api/types'
import { useWishlist } from '@/features/wishlist/hooks/use-wishlist'
import {
  BUY_VERDICT_INFO,
  type BuyVerdict,
  getBuyVerdict
} from '@/features/wishlist/utils/buy-signal'
import { getTargetPriceInfo } from '@/features/wishlist/utils/target-price'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatCurrencyInput } from '@/shared/utils/format-currency-input'
import { parseValue } from '@/shared/utils/parse-value'
import { TREND_CLASSES } from '@/shared/utils/trend-classes'

/** Quantos ativos da wishlist sugerir por categoria */
const MAX_SUGGESTIONS = 3

const SUGGESTED_VERDICTS: BuyVerdict[] = ['BUY', 'NEAR']

const VERDICT_CLASS: Partial<Record<BuyVerdict, string>> = {
  BUY: TREND_CLASSES.positive.badge,
  NEAR: 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
}

interface ContributionPlannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  summary: PortfolioAllocationSummary
  /** Moeda -> cotação em R$, para converter o aporte em cotas */
  exchangeRates: Record<string, number>
}

export function ContributionPlannerDialog({
  open,
  onOpenChange,
  summary,
  exchangeRates
}: ContributionPlannerDialogProps) {
  const [value, setValue] = useState('')
  const amount = parseValue(value)

  const { data: wishlist = [] } = useWishlist()

  const splits = useMemo(
    () => distributeContribution(summary.allocations, amount),
    [summary.allocations, amount]
  )

  const allocationById = useMemo(
    () => new Map(summary.allocations.map((item) => [item.categoryId, item])),
    [summary.allocations]
  )

  const suggestionsByCategory = useMemo(() => {
    const map = new Map<string, WishlistWithCategory[]>()

    for (const item of wishlist) {
      const { currentClosePrice, targetPrice } = item.wishlist
      const verdict = getBuyVerdict(currentClosePrice, targetPrice)
      if (!SUGGESTED_VERDICTS.includes(verdict)) continue

      const list = map.get(item.category.id) ?? []
      list.push(item)
      map.set(item.category.id, list)
    }

    // Mais perto do alvo (ou mais abaixo dele) primeiro
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          (getTargetPriceInfo(
            a.wishlist.currentClosePrice,
            a.wishlist.targetPrice
          ).distancePercentage ?? 0) -
          (getTargetPriceInfo(
            b.wishlist.currentClosePrice,
            b.wishlist.targetPrice
          ).distancePercentage ?? 0)
      )
    }

    return map
  }, [wishlist])

  const visibleSplits = splits.filter((split) => split.amount > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="contribution-planner-dialog"
        className="flex max-h-[90svh] flex-col gap-0 p-0 sm:max-w-lg"
      >
        <DialogHeader className="border-border/60 border-b p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Calculator className="size-4.5" />
            </div>
            <div>
              <DialogTitle>Simular aporte</DialogTitle>
              <DialogDescription>
                Distribui o valor entre as categorias para aproximar a carteira
                das suas metas, sem vender nada.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto p-4">
          <div className="space-y-1.5">
            <Label htmlFor="contribution-amount" className="text-xs">
              Quanto você vai aportar?
            </Label>
            <Input
              id="contribution-amount"
              inputMode="numeric"
              autoFocus
              placeholder="R$ 0,00"
              value={value}
              onChange={(event) =>
                setValue(formatCurrencyInput(event.target.value))
              }
              className="h-10 text-sm tabular-nums"
            />
          </div>

          {amount > 0 && visibleSplits.length === 0 && (
            <p className="text-muted-foreground text-xs">
              Defina metas de alocação nas categorias para simular o aporte.
            </p>
          )}

          {visibleSplits.map((split) => {
            const allocation = allocationById.get(split.categoryId)
            if (!allocation) return null

            return (
              <SplitRow
                key={split.categoryId}
                allocation={allocation}
                amount={split.amount}
                resultingPercentage={split.resultingPercentage}
                suggestions={(
                  suggestionsByCategory.get(split.categoryId) ?? []
                ).slice(0, MAX_SUGGESTIONS)}
                exchangeRate={
                  allocation.currency === 'BRL'
                    ? 1
                    : (exchangeRates[allocation.currency] ?? 1)
                }
              />
            )
          })}

          {visibleSplits.length > 0 && (
            <div className="flex items-start gap-1.5 border-border/50 border-t pt-3 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Sugestões da wishlist: ativos no preço alvo ou até 5% acima
                dele. Categorias em dólar usam a cotação de hoje.
                {summary.totalTargetPercentage < 100 &&
                  ' Como suas metas somam menos de 100%, a sobra segue a proporção das metas.'}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface SplitRowProps {
  allocation: CategoryAllocation
  amount: number
  resultingPercentage: number
  suggestions: WishlistWithCategory[]
  exchangeRate: number
}

function SplitRow({
  allocation,
  amount,
  resultingPercentage,
  suggestions,
  exchangeRate
}: SplitRowProps) {
  const type = allocation.categoryType
  const amountInCurrency = amount / exchangeRate

  return (
    <div className="space-y-2.5 rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'size-2.5 shrink-0 rounded-full',
                CATEGORY_TYPE_BG[type] || 'bg-muted'
              )}
            />
            <span className="truncate font-semibold text-foreground text-xs">
              {allocation.categoryName}
            </span>
            <Badge
              variant="secondary"
              className={cn(
                'h-4 border-0 px-1.5 py-0 font-normal text-[10px]',
                CATEGORY_TYPE_COLORS[type]
              )}
            >
              {CATEGORY_TYPE_LABELS[type] || type}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
            <span>{allocation.actualPercentage.toFixed(1)}%</span>
            <ArrowRight className="size-3" />
            <span className="font-medium text-foreground">
              {resultingPercentage.toFixed(1)}%
            </span>
            <span>(meta {(allocation.targetPercentage ?? 0).toFixed(1)}%)</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-semibold text-primary text-sm tabular-nums">
            {formatCurrency(amount)}
          </p>
          {allocation.currency !== 'BRL' && (
            <p className="text-[11px] text-muted-foreground tabular-nums">
              ≈ {formatCurrency(amountInCurrency, allocation.currency)}
            </p>
          )}
        </div>
      </div>

      {suggestions.length > 0 ? (
        <ul className="space-y-1.5">
          {suggestions.map(({ wishlist }) => {
            const price = wishlist.currentClosePrice as number
            const verdict = getBuyVerdict(price, wishlist.targetPrice)
            const units =
              type !== CategoryType.CRYPTO && price > 0
                ? Math.floor(amountInCurrency / price)
                : null

            return (
              <li
                key={wishlist.id}
                className="flex items-center justify-between gap-2 rounded-md bg-background/60 px-2.5 py-1.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="font-semibold text-foreground text-xs">
                    {wishlist.ticker}
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'h-4 border-0 px-1.5 py-0 font-normal text-[10px]',
                      VERDICT_CLASS[verdict]
                    )}
                  >
                    {BUY_VERDICT_INFO[verdict].label}
                  </Badge>
                </div>
                <div className="shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
                  {formatCurrency(price, allocation.currency)}
                  {units != null && (
                    <span className="ml-1.5 text-foreground">
                      {units > 0 ? `≈ ${units} cotas` : 'cota acima do valor'}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Nenhum ativo da wishlist no preço alvo nesta categoria. Considere
          reforçar os ativos que você já tem.
        </p>
      )}
    </div>
  )
}
