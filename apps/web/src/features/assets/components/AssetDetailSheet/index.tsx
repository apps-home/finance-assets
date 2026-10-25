'use client'

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  CircleOff,
  Coins,
  Lightbulb,
  Pencil,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react'
import { useRef } from 'react'

import type { AssetWithCategory } from '@/features/assets/api/types'
import { calcAssetMetrics } from '@/features/assets/utils/asset-metrics'
import { CategoryType } from '@/features/categories/api/types'
import {
  CATEGORY_TYPE_COLORS,
  CATEGORY_TYPE_LABELS,
  getCategoryCurrency
} from '@/features/categories/utils'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/shared/components/ui/sheet'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDate } from '@/shared/utils/format-date'
import { formatQuantity } from '@/shared/utils/format-number'
import { formatPercentage } from '@/shared/utils/format-percentage'
import { TREND_CLASSES } from '@/shared/utils/trend-classes'

import { AssetDividends } from './AssetDividends'
import { PriceHistoryChart } from './PriceHistoryChart'
import { DetailItem, MetricCard, PMGauge, Section, Stat } from './parts'

interface AssetDetailSheetProps {
  asset: AssetWithCategory | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (asset: AssetWithCategory) => void
  onDelete: (asset: AssetWithCategory) => void
}

// Histórico de cotação só existe para ativos com cotação de mercado (e ticker)
const PRICE_HISTORY_TYPES: CategoryType[] = [
  CategoryType.VARIABLE_BR,
  CategoryType.FII,
  CategoryType.VARIABLE_US
]

const trendBadge = (positive: boolean) =>
  positive ? TREND_CLASSES.positive.badge : TREND_CLASSES.negative.badge

const trendText = (positive: boolean) =>
  positive ? TREND_CLASSES.positive.text : TREND_CLASSES.negative.text

export function AssetDetailSheet({
  asset,
  open,
  onOpenChange,
  onEdit,
  onDelete
}: AssetDetailSheetProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  if (!asset) return null

  const currency = getCategoryCurrency(asset.category)
  const catType = asset.category?.type || CategoryType.VARIABLE_BR
  const {
    monthChange,
    monthDiffValue,
    pmDiffPercent,
    pmDiffValue,
    isPositivePL,
    isNegativePL
  } = calcAssetMetrics(asset)

  const isMonthPositive = monthChange != null && monthChange >= 0
  const isAbovePM = pmDiffPercent != null && pmDiffPercent >= 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={popupRef}
        // Sem isso o foco vai para o 1º botão (rodapé) e rola o sheet até o fim
        initialFocus={popupRef}
        data-slot="asset-detail-sheet"
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="space-y-3 border-border border-b bg-muted/20 p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="px-2.5 py-1 font-bold">
                {asset.ticker || asset.name.substring(0, 3).toUpperCase()}
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
              className={cn(
                'gap-1 border-0',
                asset.isActive
                  ? TREND_CLASSES.positive.badge
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {asset.isActive ? (
                <CheckCircle2 className="size-3" />
              ) : (
                <CircleOff className="size-3" />
              )}
              {asset.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          <div>
            <SheetTitle className="font-bold text-foreground text-sm">
              {asset.name}
            </SheetTitle>
            <SheetDescription className="text-muted-foreground text-xs">
              {asset.category?.name}
              {asset.broker ? ` • ${asset.broker}` : ''}
            </SheetDescription>
          </div>

          {/* Hero: cotação atual + variação do mês */}
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="block text-muted-foreground text-xs">
                Cotação atual
              </span>
              <span className="font-bold text-foreground text-sm tabular-nums">
                {asset.currentClosePrice != null
                  ? formatCurrency(asset.currentClosePrice, currency)
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
          {asset.ticker && PRICE_HISTORY_TYPES.includes(catType) && (
            <>
              <PriceHistoryChart assetId={asset.id} currency={currency} />

              <Separator />
            </>
          )}

          <Section title="Indicadores para decisão">
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
                        ` (${monthDiffValue > 0 ? '+' : ''}${formatCurrency(monthDiffValue, currency)}/cota)`}
                    </span>
                  </div>
                )
              }
            >
              <Stat
                label="Cotação atual"
                value={
                  asset.currentClosePrice != null
                    ? formatCurrency(asset.currentClosePrice, currency)
                    : '—'
                }
              />
              <Stat
                label="Fechamento anterior"
                valueClassName="font-medium text-muted-foreground"
                value={
                  asset.lastMonthClosePrice != null
                    ? formatCurrency(asset.lastMonthClosePrice, currency)
                    : '—'
                }
              />
            </MetricCard>

            <MetricCard
              title="Distância para o preço médio"
              badge={
                pmDiffPercent != null && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'border-0 font-semibold tabular-nums',
                      trendBadge(isAbovePM)
                    )}
                  >
                    {formatPercentage(pmDiffPercent)} vs PM
                  </Badge>
                )
              }
              footer={
                pmDiffPercent != null && (
                  <>
                    {asset.averagePrice != null &&
                      asset.currentClosePrice != null && (
                        <PMGauge
                          average={asset.averagePrice}
                          current={asset.currentClosePrice}
                          isAbove={isAbovePM}
                        />
                      )}
                    <p className="flex items-start gap-1.5 text-muted-foreground text-xs leading-snug">
                      {isAbovePM ? (
                        <BarChart3 className="mt-0.5 size-3.5 shrink-0" />
                      ) : (
                        <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                      )}
                      {isAbovePM
                        ? 'Cotação acima do seu custo médio.'
                        : 'Comprar abaixo do preço médio reduz seu custo de aquisição.'}
                    </p>
                  </>
                )
              }
            >
              <Stat
                label="Seu preço médio"
                value={
                  asset.averagePrice != null
                    ? formatCurrency(asset.averagePrice, currency)
                    : '—'
                }
              />
              <Stat
                label="Diferença por cota"
                valueClassName={
                  pmDiffValue != null && pmDiffValue !== 0
                    ? trendText(pmDiffValue > 0)
                    : undefined
                }
                value={
                  pmDiffValue != null
                    ? `${pmDiffValue > 0 ? '+' : ''}${formatCurrency(pmDiffValue, currency)}`
                    : '—'
                }
              />
            </MetricCard>
          </Section>

          <Separator />

          <Section title="Posição e desempenho">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-border bg-muted/10 p-3">
                <Stat
                  label="Saldo atual"
                  value={
                    asset.currentBalance != null
                      ? formatCurrency(asset.currentBalance, currency)
                      : '—'
                  }
                />
              </div>
              <div className="rounded-lg border border-border bg-muted/10 p-3">
                <Stat
                  label="Total investido"
                  valueClassName="font-medium text-foreground/80"
                  value={
                    asset.investedValue != null
                      ? formatCurrency(asset.investedValue, currency)
                      : '—'
                  }
                />
              </div>
              <div className="col-span-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/10 p-3">
                <Stat
                  label="Lucro / prejuízo acumulado"
                  valueClassName={cn(
                    isPositivePL && TREND_CLASSES.positive.text,
                    isNegativePL && TREND_CLASSES.negative.text
                  )}
                  value={
                    asset.profitLoss != null
                      ? `${isPositivePL ? '+' : ''}${formatCurrency(asset.profitLoss, currency)}`
                      : '—'
                  }
                />
                {asset.profitabilityPercentage != null && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'shrink-0 border-0 font-bold tabular-nums',
                      isPositivePL && TREND_CLASSES.positive.badge,
                      isNegativePL && TREND_CLASSES.negative.badge
                    )}
                  >
                    {formatPercentage(asset.profitabilityPercentage)}
                  </Badge>
                )}
              </div>
            </div>
          </Section>

          <Separator />

          <AssetDividends asset={asset} currency={currency} />

          <Separator />

          <Section title="Detalhes operacionais">
            <div className="grid grid-cols-2 gap-2.5">
              <DetailItem
                icon={<Coins className="size-3.5" />}
                label="Cotas"
                value={
                  asset.quantity != null
                    ? formatQuantity(asset.quantity, 8)
                    : '—'
                }
              />
              <DetailItem
                icon={<Wallet className="size-3.5" />}
                label="Moeda"
                value={currency}
              />
              <DetailItem
                icon={<Building2 className="size-3.5" />}
                label="Corretora"
                value={asset.broker || 'Não especificada'}
              />
              <DetailItem
                icon={<Tag className="size-3.5" />}
                label="Categoria"
                value={asset.category?.name || '—'}
              />
              {asset.createdAt && (
                <div className="col-span-2">
                  <DetailItem
                    icon={<Calendar className="size-3.5" />}
                    label="Data de cadastro"
                    value={formatDate(asset.createdAt)}
                  />
                </div>
              )}
            </div>
          </Section>
        </div>

        <SheetFooter className="border-border border-t bg-muted/10 p-4">
          <div className="flex w-full items-center gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2 text-xs"
              onClick={() => {
                onOpenChange(false)
                onEdit(asset)
              }}
            >
              <Pencil className="size-3.5" />
              Editar ativo
            </Button>
            <Button
              variant="outline"
              className="gap-2 text-destructive text-xs hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                onOpenChange(false)
                onDelete(asset)
              }}
            >
              <Trash2 className="size-3.5" />
              Excluir
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
