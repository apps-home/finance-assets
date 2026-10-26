import { HandCoins } from 'lucide-react'

import type { AssetWithCategory } from '@/features/assets/api/types'
import { useDividends } from '@/features/dividends/hooks/use-dividends'
import { DIVIDEND_TYPE_LABELS } from '@/features/dividends/utils'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDate } from '@/shared/utils/format-date'
import { formatPercentage } from '@/shared/utils/format-percentage'

import { Section, Stat } from './parts'

interface AssetDividendsProps {
  asset: AssetWithCategory
  currency: string
}

export function AssetDividends({ asset, currency }: AssetDividendsProps) {
  const { data: dividends = [], isLoading } = useDividends({
    assetId: asset.id
  })

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
          <div className="grid grid-cols-2 gap-2.5">
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
          </div>

          <ul className="divide-y divide-border rounded-lg border border-border text-xs">
            {received.slice(0, 3).map(({ dividend }) => (
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
                <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(dividend.amount, currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  )
}
