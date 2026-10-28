import { Skeleton } from '@lib/ui/components/skeleton'
import { cn } from '@lib/ui/lib/utils'
import { ChevronDown, HandCoins } from 'lucide-react'
import { useState } from 'react'

import type { AssetWithCategory } from '@/features/assets/api/types'
import { useDividends } from '@/features/dividends/hooks/use-dividends'
import { DIVIDEND_TYPE_LABELS } from '@/features/dividends/utils'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDate } from '@/shared/utils/format-date'
import {
  calcPercentageChange,
  formatPercentage
} from '@/shared/utils/format-percentage'
import { TREND_CLASSES } from '@/shared/utils/trend-classes'

import { Section, Stat } from './parts'

interface AssetDividendsProps {
  asset: AssetWithCategory
  currency: string
}

export function AssetDividends({ asset, currency }: AssetDividendsProps) {
  const { data: dividends = [], isLoading } = useDividends({
    assetId: asset.id
  })

  const [openYears, setOpenYears] = useState<Set<number>>(new Set())

  const now = new Date()
  const yearAgo = new Date(now)
  yearAgo.setFullYear(now.getFullYear() - 1)

  const received = dividends
    .filter(({ dividend }) => new Date(dividend.paymentDate) <= now)
    .sort(
      (a, b) =>
        new Date(b.dividend.paymentDate).getTime() -
        new Date(a.dividend.paymentDate).getTime()
    )

  const lastYear = received.filter(
    ({ dividend }) => new Date(dividend.paymentDate) >= yearAgo
  )
  const last12Months = lastYear.reduce(
    (sum, { dividend }) => sum + dividend.amount - (dividend.taxAmount ?? 0),
    0
  )

  // Mesmo critério do servidor: líquido por cota (quantidade da época) ÷ preço médio
  const perShare = lastYear.reduce((sum, { dividend }) => {
    const net = dividend.amount - (dividend.taxAmount ?? 0)

    if (dividend.quantity) return sum + net / dividend.quantity
    if (dividend.rateAmount && dividend.amount > 0)
      return sum + dividend.rateAmount * (net / dividend.amount)

    return sum
  }, 0)

  const net = (dividend: { amount: number; taxAmount: number | null }) =>
    dividend.amount - (dividend.taxAmount ?? 0)

  // Histórico completo, do mais recente ao mais antigo, agrupado por ano de pagamento
  const years = Object.values(
    received.reduce<
      Record<number, { year: number; total: number; items: typeof received }>
    >((acc, entry) => {
      const year = new Date(entry.dividend.paymentDate).getUTCFullYear()
      acc[year] ??= { year, total: 0, items: [] }
      acc[year].total += net(entry.dividend)
      acc[year].items.push(entry)
      return acc
    }, {})
  ).sort((a, b) => b.year - a.year)

  const totalReceived = years.reduce((sum, { total }) => sum + total, 0)
  // O 1º ano da lista (mais recente) fica aberto até o usuário mexer
  const isOpen = (year: number) =>
    openYears.size === 0 ? year === years[0]?.year : openYears.has(year)

  function toggleYear(year: number) {
    const current = openYears.size === 0 ? new Set([years[0].year]) : openYears
    const next = new Set(current)
    next.has(year) ? next.delete(year) : next.add(year)
    // Set vazio significa "padrão": mantém um marcador para o caso de fechar todos
    setOpenYears(next.size === 0 ? new Set([-1]) : next)
  }

  const averagePrice = asset.averagePrice ?? 0
  const yieldOnCost =
    averagePrice > 0 && perShare > 0 ? (perShare / averagePrice) * 100 : null

  return (
    <Section title="Proventos" icon={<HandCoins className="size-3.5" />}>
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : received.length === 0 ? (
        <p className="rounded-lg border border-border border-dashed p-3 text-center text-muted-foreground text-xs">
          Nenhum provento recebido para este ativo.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-lg border border-border bg-muted/10 p-3">
              <Stat
                label="Últimos 12 meses"
                value={formatCurrency(last12Months, currency)}
              />
            </div>
            <div className="rounded-lg border border-border bg-muted/10 p-3">
              <Stat
                label="Yield on Cost"
                value={
                  yieldOnCost != null ? formatPercentage(yieldOnCost) : '—'
                }
              />
            </div>
            <div className="rounded-lg border border-border bg-muted/10 p-3">
              <Stat
                label="Total recebido"
                value={formatCurrency(totalReceived, currency)}
              />
            </div>
          </div>

          <div className="space-y-2">
            {years.map(({ year, total, items }, index) => {
              const previous = years[index + 1]
              const change = previous
                ? calcPercentageChange(total, previous.total)
                : null
              const open = isOpen(year)

              return (
                <div
                  key={year}
                  className="overflow-hidden rounded-lg border border-border text-xs"
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => toggleYear(year)}
                    className="flex w-full items-center justify-between gap-2 bg-muted/10 px-3 py-2.5 text-left transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        className={cn(
                          'size-3.5 text-muted-foreground transition-transform',
                          !open && '-rotate-90'
                        )}
                      />
                      <span className="font-semibold text-foreground text-sm">
                        {year}
                      </span>
                      <span className="text-muted-foreground">
                        {items.length}{' '}
                        {items.length === 1 ? 'pagamento' : 'pagamentos'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {change != null && (
                        <span
                          className={cn(
                            'font-medium tabular-nums',
                            change >= 0
                              ? TREND_CLASSES.positive.text
                              : TREND_CLASSES.negative.text
                          )}
                        >
                          {formatPercentage(change)}
                        </span>
                      )}
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatCurrency(total, currency)}
                      </span>
                    </div>
                  </button>

                  {open && (
                    <ul className="divide-y divide-border border-border border-t">
                      {items.map(({ dividend }) => (
                        <li
                          key={dividend.id}
                          className="flex items-center justify-between gap-2 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <span className="block font-medium text-foreground">
                              {DIVIDEND_TYPE_LABELS[dividend.type]}
                            </span>
                            <span className="text-muted-foreground tabular-nums">
                              {formatDate(dividend.paymentDate)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="block font-semibold text-foreground tabular-nums">
                              {formatCurrency(net(dividend), currency)}
                            </span>
                            {(dividend.taxAmount ?? 0) > 0 && (
                              <span className="text-muted-foreground tabular-nums">
                                bruto{' '}
                                {formatCurrency(dividend.amount, currency)}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Section>
  )
}
