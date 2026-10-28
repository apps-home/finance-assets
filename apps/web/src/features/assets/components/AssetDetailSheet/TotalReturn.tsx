import { Badge } from '@lib/ui/components/badge'
import { cn } from '@lib/ui/lib/utils'

import { useAssetTotalReturns } from '@/features/performance/hooks/use-performance'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatPercentage } from '@/shared/utils/format-percentage'
import { TREND_CLASSES } from '@/shared/utils/trend-classes'

interface TotalReturnProps {
  assetId: string
  currency: string
}

const signed = (value: number, currency: string) =>
  `${value > 0 ? '+' : ''}${formatCurrency(value, currency)}`

const trendText = (value: number) =>
  value > 0
    ? TREND_CLASSES.positive.text
    : value < 0
      ? TREND_CLASSES.negative.text
      : undefined

/**
 * Retorno total do ativo: o resultado de preço (mostrado acima) somado às
 * vendas já feitas e aos proventos recebidos. Só aparece quando há algo além
 * do preço, senão repetiria o lucro/prejuízo.
 */
export function TotalReturn({ assetId, currency }: TotalReturnProps) {
  const { data: totalReturns } = useAssetTotalReturns()
  const item = totalReturns?.find((entry) => entry.assetId === assetId)

  if (!item || (item.dividendsReceived === 0 && item.realizedResult === 0)) {
    return null
  }

  const rows = [
    { label: 'Preço (posição atual)', value: item.unrealizedResult },
    ...(item.realizedResult !== 0
      ? [{ label: 'Vendas realizadas', value: item.realizedResult }]
      : []),
    { label: 'Proventos recebidos', value: item.dividendsReceived }
  ]

  return (
    <div
      data-slot="asset-total-return"
      className="col-span-2 space-y-2.5 rounded-lg border border-border bg-muted/10 p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="block text-muted-foreground text-xs">
            Retorno total (com proventos)
          </span>
          <span
            className={cn(
              'font-bold text-sm tabular-nums',
              trendText(item.totalReturn) ?? 'text-foreground'
            )}
          >
            {signed(item.totalReturn, currency)}
          </span>
        </div>
        {item.totalReturnPercentage != null && (
          <Badge
            variant="secondary"
            className={cn(
              'shrink-0 border-0 font-bold tabular-nums',
              item.totalReturn >= 0
                ? TREND_CLASSES.positive.badge
                : TREND_CLASSES.negative.badge
            )}
          >
            {formatPercentage(item.totalReturnPercentage)}
          </Badge>
        )}
      </div>

      <ul className="space-y-1 border-border/60 border-t pt-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between text-xs"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className={cn('tabular-nums', trendText(row.value))}>
              {signed(row.value, currency)}
            </span>
          </li>
        ))}
      </ul>

      {item.investedCapital != null && (
        <p className="text-[11px] text-muted-foreground">
          Percentual sobre {formatCurrency(item.investedCapital, currency)}{' '}
          investidos no total.
        </p>
      )}
    </div>
  )
}
