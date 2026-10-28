'use client'

import { Badge } from '@lib/ui/components/badge'
import { CalendarClock } from 'lucide-react'

import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDate } from '@/shared/utils/format-date'

import type { DividendWithAsset } from '../../api/types'
import { DIVIDEND_TYPE_LABELS } from '../../utils'

interface UpcomingDividendsProps {
  items: DividendWithAsset[]
}

export function UpcomingDividends({ items }: UpcomingDividendsProps) {
  const total = items.reduce((sum, item) => sum + item.dividend.amountInBRL, 0)

  return (
    <div
      data-slot="upcoming-dividends"
      className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold text-sm">
          <CalendarClock className="size-4 text-primary" />
          Próximos pagamentos
        </h3>
        {items.length > 0 && (
          <span className="font-semibold text-muted-foreground text-xs tabular-nums">
            {formatCurrency(total)}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          Nenhum pagamento anunciado. Os dividendos são sincronizados
          automaticamente toda segunda-feira.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map(({ dividend, asset, category }) => (
            <li
              key={dividend.id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Badge variant="default" className="px-2 py-0.5 text-xs">
                  {asset.ticker || asset.name.slice(0, 3).toUpperCase()}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {DIVIDEND_TYPE_LABELS[dividend.type]}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end text-xs tabular-nums">
                <span className="font-semibold">
                  {formatCurrency(
                    dividend.amount - (dividend.taxAmount ?? 0),
                    category.currency
                  )}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(dividend.paymentDate)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
