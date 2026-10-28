'use client'

import { Badge } from '@lib/ui/components/badge'
import { Button } from '@lib/ui/components/button'
import { Separator } from '@lib/ui/components/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@lib/ui/components/sheet'
import { Skeleton } from '@lib/ui/components/skeleton'
import { cn } from '@lib/ui/lib/utils'
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Hourglass,
  Lightbulb,
  Pencil,
  Tag,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react'
import { useRef } from 'react'

import { PriceHistoryChart } from '@/features/assets/components/AssetDetailSheet/PriceHistoryChart'
import {
  DetailItem,
  MetricCard,
  Section,
  Stat
} from '@/features/assets/components/AssetDetailSheet/parts'
import { CategoryType } from '@/features/categories/api/types'
import {
  CATEGORY_TYPE_COLORS,
  CATEGORY_TYPE_LABELS,
  getCategoryCurrency
} from '@/features/categories/utils'
import { PriceAlertsSection } from '@/features/price-alerts/components/PriceAlertsSection'
import type { WishlistWithCategory } from '@/features/wishlist/api/types'
import { useWishlistPriceHistory } from '@/features/wishlist/hooks/use-wishlist'
import {
  BUY_VERDICT_INFO,
  type BuyVerdict,
  calcRangeMetrics,
  getBuyVerdict
} from '@/features/wishlist/utils/buy-signal'
import { getTargetPriceInfo } from '@/features/wishlist/utils/target-price'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDate } from '@/shared/utils/format-date'
import {
  calcMonthChange,
  formatPercentage
} from '@/shared/utils/format-percentage'
import { TREND_CLASSES } from '@/shared/utils/trend-classes'

import { RangeGauge } from './parts'

interface WishlistDetailSheetProps {
  item: WishlistWithCategory | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (item: WishlistWithCategory) => void
  onDelete: (item: WishlistWithCategory) => void
  onAddToPortfolio: (item: WishlistWithCategory) => void
}

// Histórico de cotação só existe para ativos com cotação de mercado
const PRICE_HISTORY_TYPES: CategoryType[] = [
  CategoryType.VARIABLE_BR,
  CategoryType.FII,
  CategoryType.VARIABLE_US
]

const VERDICT_STYLE: Record<
  BuyVerdict,
  { className: string; icon: typeof CheckCircle2 }
> = {
  BUY: { className: TREND_CLASSES.positive.badge, icon: CheckCircle2 },
  NEAR: {
    className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    icon: Clock
  },
  WAIT: { className: 'bg-muted text-foreground', icon: Hourglass },
  NO_TARGET: { className: 'bg-muted text-muted-foreground', icon: Target },
  NO_QUOTE: { className: 'bg-muted text-muted-foreground', icon: Clock }
}

const trendBadge = (positive: boolean) =>
  positive ? TREND_CLASSES.positive.badge : TREND_CLASSES.negative.badge

const signed = (value: number, currency: string) =>
  `${value > 0 ? '+' : ''}${formatCurrency(value, currency)}`

export function WishlistDetailSheet({
  item,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onAddToPortfolio
}: WishlistDetailSheetProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  if (!item) return null

  const { wishlist, category } = item
  const currency = getCategoryCurrency(category)
  const catType = category?.type || CategoryType.VARIABLE_BR
  const hasHistory = PRICE_HISTORY_TYPES.includes(catType)

  const currentPrice = wishlist.currentClosePrice
  const lastMonthPrice = wishlist.lastMonthClosePrice
  const targetPrice = wishlist.targetPrice

  const monthChange = calcMonthChange(currentPrice, lastMonthPrice)
  const monthDiffValue =
    currentPrice != null && lastMonthPrice != null
      ? currentPrice - lastMonthPrice
      : null
  const isMonthPositive = monthChange != null && monthChange >= 0

  const { hasTarget, isAtOrBelowTarget, distancePercentage } =
    getTargetPriceInfo(currentPrice, targetPrice)
  const targetDiffValue =
    hasTarget && currentPrice != null && targetPrice != null
      ? currentPrice - targetPrice
      : null

  const verdict = getBuyVerdict(currentPrice, targetPrice)
  const verdictInfo = BUY_VERDICT_INFO[verdict]
  const VerdictIcon = VERDICT_STYLE[verdict].icon

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={popupRef}
        // Sem isso o foco vai para o 1º botão (rodapé) e rola o sheet até o fim
        initialFocus={popupRef}
        data-slot="wishlist-detail-sheet"
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:sm:max-w-xl"
      >
        <SheetHeader className="space-y-3 border-border border-b bg-muted/20 p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="px-2.5 py-1 font-bold">
                {wishlist.ticker}
              </Badge>
              <Badge
                variant="secondary"
                className={cn(
                  'border-0 font-medium',
                  CATEGORY_TYPE_COLORS[catType]
                )}
              >
                {CATEGORY_TYPE_LABELS[catType] || catType}
              </Badge>
            </div>
            <Badge
              variant="secondary"
              className={cn('gap-1 border-0', VERDICT_STYLE[verdict].className)}
            >
              <VerdictIcon className="size-3" />
              {verdictInfo.label}
            </Badge>
          </div>

          <div>
            <SheetTitle className="font-bold text-foreground text-sm">
              {wishlist.name}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground text-xs">
              {category?.name}
            </SheetDescription>
          </div>

          {/* Hero: cotação atual + variação do mês */}
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="block text-muted-foreground text-xs">
                Cotação atual
              </span>
              <span className="font-bold text-foreground text-sm tabular-nums">
                {currentPrice != null
                  ? formatCurrency(currentPrice, currency)
                  : 'Aguardando cotação'}
              </span>
            </div>
            {monthChange != null && (
              <Badge
                variant="secondary"
                className={cn(
                  'gap-1 border-0 font-semibold tabular-nums',
                  trendBadge(isMonthPositive)
                )}
              >
                {isMonthPositive ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {formatPercentage(monthChange)} no mês
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          {hasHistory && (
            <>
              <PriceHistoryChart
                id={wishlist.id}
                currency={currency}
                useHistory={useWishlistPriceHistory}
              />

              <Separator />
            </>
          )}

          <Section title="Indicadores para decisão">
            <div
              className={cn(
                'flex items-start gap-2.5 rounded-lg p-3',
                VERDICT_STYLE[verdict].className
              )}
            >
              <VerdictIcon className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-semibold text-sm">{verdictInfo.label}</p>
                <p className="text-xs leading-snug opacity-90">
                  {verdictInfo.description}
                </p>
              </div>
            </div>

            <MetricCard
              title="Distância para o preço alvo"
              badge={
                distancePercentage != null && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'border-0 font-semibold tabular-nums',
                      isAtOrBelowTarget
                        ? TREND_CLASSES.positive.badge
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {formatPercentage(distancePercentage)} vs alvo
                  </Badge>
                )
              }
              footer={
                targetDiffValue != null && (
                  <p className="flex items-start gap-1.5 text-muted-foreground text-xs leading-snug">
                    {isAtOrBelowTarget ? (
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
                    ) : (
                      <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                    )}
                    {isAtOrBelowTarget
                      ? 'Cotação abaixo do preço que você definiu como bom para comprar.'
                      : `Precisa cair ${formatCurrency(targetDiffValue, currency)} por cota (${formatPercentage(
                          ((targetPrice as number) / (currentPrice as number) -
                            1) *
                            100
                        )}) para atingir o alvo.`}
                  </p>
                )
              }
            >
              <Stat
                label="Preço alvo"
                value={
                  targetPrice != null
                    ? formatCurrency(targetPrice, currency)
                    : '—'
                }
              />
              <Stat
                label="Diferença por cota"
                valueClassName={
                  targetDiffValue != null && targetDiffValue !== 0
                    ? isAtOrBelowTarget
                      ? TREND_CLASSES.positive.text
                      : 'text-amber-600 dark:text-amber-400'
                    : undefined
                }
                value={
                  targetDiffValue != null
                    ? signed(targetDiffValue, currency)
                    : '—'
                }
              />
            </MetricCard>

            {hasHistory && (
              <YearRangeCard
                id={wishlist.id}
                currentPrice={currentPrice}
                targetPrice={targetPrice}
                currency={currency}
              />
            )}

            <MetricCard
              title="Cotação vs. mês anterior (MTD)"
              footer={
                monthChange != null && (
                  <div
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs',
                      trendBadge(isMonthPositive)
                    )}
                  >
                    {isMonthPositive ? (
                      <ArrowUpRight className="size-3.5 shrink-0" />
                    ) : (
                      <ArrowDownRight className="size-3.5 shrink-0" />
                    )}
                    <span className="tabular-nums">
                      {isMonthPositive ? 'Valorizou' : 'Recuou'}{' '}
                      {formatPercentage(monthChange)} no mês
                      {monthDiffValue != null &&
                        ` (${signed(monthDiffValue, currency)}/cota)`}
                    </span>
                  </div>
                )
              }
            >
              <Stat
                label="Cotação atual"
                value={
                  currentPrice != null
                    ? formatCurrency(currentPrice, currency)
                    : '—'
                }
              />
              <Stat
                label="Fechamento anterior"
                valueClassName="font-medium text-muted-foreground"
                value={
                  lastMonthPrice != null
                    ? formatCurrency(lastMonthPrice, currency)
                    : '—'
                }
              />
            </MetricCard>
          </Section>

          {wishlist.marketAssetId && (
            <>
              <Separator />

              <Section
                title="Alertas de preço"
                icon={<Bell className="size-3.5" />}
              >
                <PriceAlertsSection
                  source={{ wishlistId: wishlist.id }}
                  ticker={wishlist.ticker}
                  currentPrice={currentPrice}
                  currency={currency}
                  suggestedPrice={targetPrice}
                />
              </Section>
            </>
          )}

          {wishlist.notes && (
            <>
              <Separator />

              <Section
                title="Anotações"
                icon={<FileText className="size-3.5" />}
              >
                <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/10 p-3 text-foreground text-xs leading-relaxed">
                  {wishlist.notes}
                </p>
              </Section>
            </>
          )}

          <Separator />

          <Section title="Detalhes">
            <div className="grid grid-cols-2 gap-2.5">
              <DetailItem
                icon={<Wallet className="size-3.5" />}
                label="Moeda"
                value={currency}
              />
              <DetailItem
                icon={<Tag className="size-3.5" />}
                label="Categoria"
                value={category?.name || '—'}
              />
              {wishlist.createdAt && (
                <div className="col-span-2">
                  <DetailItem
                    icon={<Calendar className="size-3.5" />}
                    label="Adicionado em"
                    value={formatDate(wishlist.createdAt)}
                  />
                </div>
              )}
            </div>
          </Section>
        </div>

        <SheetFooter className="border-border border-t bg-muted/10 p-4">
          <div className="flex w-full items-center gap-2">
            <Button
              className="flex-1 gap-2 text-xs"
              onClick={() => {
                onOpenChange(false)
                onAddToPortfolio(item)
              }}
            >
              <BriefcaseBusiness className="size-3.5" />
              Adicionar à carteira
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-xs"
              onClick={() => {
                onOpenChange(false)
                onEdit(item)
              }}
            >
              <Pencil className="size-3.5" />
              Editar
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-destructive text-xs hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                onOpenChange(false)
                onDelete(item)
              }}
            >
              <Trash2 className="size-3.5" />
              Remover
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

interface YearRangeCardProps {
  id: string
  currentPrice: number | null
  targetPrice: number | null
  currency: string
}

/** Onde a cotação está na faixa dos últimos 12 meses: base do "está caro ou barato?" */
function YearRangeCard({
  id,
  currentPrice,
  targetPrice,
  currency
}: YearRangeCardProps) {
  const { data, isLoading, isError } = useWishlistPriceHistory(id, '1y')
  const metrics = calcRangeMetrics(data?.points, currentPrice)

  if (isLoading) return <Skeleton className="h-36 w-full" />

  if (isError || !metrics) {
    return (
      <p className="rounded-lg border border-border border-dashed p-3 text-center text-muted-foreground text-xs">
        Faixa de 12 meses indisponível para este ativo.
      </p>
    )
  }

  const { min, max, average, position, fromHigh, fromAverage } = metrics
  const isCheap = position <= 33
  const isExpensive = position >= 67
  const targetPosition =
    targetPrice != null && targetPrice >= min && targetPrice <= max
      ? ((targetPrice - min) / (max - min || 1)) * 100
      : null

  return (
    <MetricCard
      title="Faixa de preço (12 meses)"
      badge={
        <Badge
          variant="secondary"
          className={cn(
            'border-0 font-semibold tabular-nums',
            isCheap
              ? TREND_CLASSES.positive.badge
              : isExpensive
                ? TREND_CLASSES.negative.badge
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
          )}
        >
          {isCheap
            ? 'Região de baixa'
            : isExpensive
              ? 'Região de alta'
              : 'Meio da faixa'}
        </Badge>
      }
      footer={
        <>
          <RangeGauge position={position} targetPosition={targetPosition} />
          <div className="flex justify-between text-muted-foreground text-xs tabular-nums">
            <span>Mín {formatCurrency(min, currency)}</span>
            <span>Máx {formatCurrency(max, currency)}</span>
          </div>
          <p className="flex items-start gap-1.5 text-muted-foreground text-xs leading-snug">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
            {isCheap
              ? 'Cotação perto da mínima do ano, um ponto de entrada historicamente mais barato.'
              : isExpensive
                ? 'Cotação perto da máxima do ano. Comprar aqui é pagar caro em relação ao histórico recente.'
                : 'Cotação no meio da faixa do último ano.'}
            {targetPosition != null && ' A marca vertical indica o seu alvo.'}
          </p>
        </>
      }
    >
      <Stat
        label="Vs. máxima 12m"
        valueClassName={fromHigh < 0 ? TREND_CLASSES.positive.text : undefined}
        value={formatPercentage(fromHigh)}
      />
      <Stat
        label={`Vs. média 12m (${formatCurrency(average, currency)})`}
        valueClassName={
          fromAverage <= 0
            ? TREND_CLASSES.positive.text
            : TREND_CLASSES.negative.text
        }
        value={formatPercentage(fromAverage)}
      />
    </MetricCard>
  )
}
