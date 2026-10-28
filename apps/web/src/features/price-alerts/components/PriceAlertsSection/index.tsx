'use client'

import { Badge } from '@lib/ui/components/badge'
import { Button } from '@lib/ui/components/button'
import { Input } from '@lib/ui/components/input'
import { Skeleton } from '@lib/ui/components/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@lib/ui/components/tooltip'
import { cn } from '@lib/ui/lib/utils'
import {
  ArrowDownRight,
  ArrowUpRight,
  BellPlus,
  Info,
  Loader2,
  Trash2
} from 'lucide-react'
import { useState } from 'react'

import { useInboxSession } from '@/features/notifications/hooks/use-inbox-session'
import type {
  PriceAlert,
  PriceAlertSource
} from '@/features/price-alerts/api/types'
import {
  useCreatePriceAlert,
  useDeletePriceAlert,
  usePriceAlerts
} from '@/features/price-alerts/hooks/use-price-alerts'
import {
  DIRECTION_LABELS,
  distanceToTarget,
  inferDirection
} from '@/features/price-alerts/utils'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatCurrencyInput } from '@/shared/utils/format-currency-input'
import { formatDate } from '@/shared/utils/format-date'
import { formatPercentage } from '@/shared/utils/format-percentage'
import { parseValue } from '@/shared/utils/parse-value'
import { TREND_CLASSES } from '@/shared/utils/trend-classes'

interface PriceAlertsSectionProps {
  source: PriceAlertSource
  /** Ticker atual da origem: alertas de outro ticker mostram o deles */
  ticker: string
  currentPrice: number | null
  currency: string
  /** Wishlist: atalho para criar o alerta no preço alvo */
  suggestedPrice?: number | null
}

const toInput = (value: number) =>
  formatCurrencyInput(Math.round(value * 100).toString())

export function PriceAlertsSection({
  source,
  ticker,
  currentPrice,
  currency,
  suggestedPrice
}: PriceAlertsSectionProps) {
  const [value, setValue] = useState('')

  const { data: alerts = [], isLoading } = usePriceAlerts(source)
  const { data: inboxSession } = useInboxSession()
  const { mutateAsync: createAlert, isPending: isCreating } =
    useCreatePriceAlert()

  const targetPrice = parseValue(value)
  const direction = inferDirection(targetPrice, currentPrice)
  const distance = distanceToTarget(targetPrice, currentPrice)

  const showSuggestion =
    suggestedPrice != null &&
    suggestedPrice > 0 &&
    suggestedPrice !== currentPrice &&
    !alerts.some((alert) => alert.targetPrice === suggestedPrice) &&
    targetPrice !== suggestedPrice

  async function handleCreate() {
    if (!direction) return

    try {
      await createAlert({ ...source, targetPrice })
      setValue('')
    } catch {
      // o erro já é exibido pelo toast do hook de mutation
    }
  }

  return (
    <div data-slot="price-alerts-section" className="space-y-3">
      {isLoading ? (
        <Skeleton className="h-14 w-full rounded-lg" />
      ) : alerts.length > 0 ? (
        <ul className="space-y-2">
          {alerts.map((alert) => (
            <PriceAlertRow
              key={alert.id}
              alert={alert}
              showTicker={alert.ticker !== ticker}
              currentPrice={currentPrice}
            />
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-xs">
          Nenhum alerta. Crie um para ser avisado quando a cotação chegar a um
          preço.
        </p>
      )}

      <div className="space-y-1.5 rounded-lg border border-border bg-muted/10 p-3">
        <div className="flex gap-2">
          <Input
            aria-label={`Preço do alerta em ${currency}`}
            inputMode="numeric"
            placeholder={`Preço em ${currency}`}
            value={value}
            disabled={currentPrice == null || isCreating}
            onChange={(event) =>
              setValue(formatCurrencyInput(event.target.value))
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleCreate()
            }}
            className="h-9 text-xs tabular-nums"
          />
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!direction || isCreating}
            className="h-9 shrink-0 gap-1.5 text-xs"
          >
            {isCreating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <BellPlus className="size-3.5" />
            )}
            Criar alerta
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {currentPrice == null
            ? 'Este ativo ainda não tem cotação: o alerta pode ser criado assim que ela chegar.'
            : direction && distance != null
              ? `Vai avisar quando a cotação ${direction === 'ABOVE' ? 'subir' : 'cair'} até ${formatCurrency(targetPrice, currency)} (${formatPercentage(distance)} da cotação atual).`
              : targetPrice > 0
                ? 'Escolha um preço diferente da cotação atual.'
                : `Cotação atual: ${formatCurrency(currentPrice, currency)}.`}
          {showSuggestion && (
            <>
              {' '}
              <button
                type="button"
                onClick={() => setValue(toInput(suggestedPrice))}
                className="cursor-pointer text-primary underline-offset-2 hover:underline"
              >
                Usar preço alvo ({formatCurrency(suggestedPrice, currency)})
              </button>
            </>
          )}
        </p>
      </div>

      <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-snug">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Conferido a cada atualização de cotação (fechamento das 19h ou
          &quot;Atualizar cotações&quot;). Depois de avisar, volta a vigiar
          sozinho quando a cotação sai da faixa.
          {inboxSession &&
            !inboxSession.enabled &&
            ' As notificações ainda não estão configuradas: o alerta registra quando o preço for atingido, mas o aviso só chega depois que o Novu for ligado.'}
        </span>
      </p>
    </div>
  )
}

interface PriceAlertRowProps {
  alert: PriceAlert
  showTicker: boolean
  currentPrice: number | null
}

function PriceAlertRow({
  alert,
  showTicker,
  currentPrice
}: PriceAlertRowProps) {
  const { mutate: deleteAlert, isPending: isDeleting } = useDeletePriceAlert()

  const isAbove = alert.direction === 'ABOVE'
  const isTriggered = alert.status === 'TRIGGERED'
  const distance = distanceToTarget(alert.targetPrice, currentPrice)
  const DirectionIcon = isAbove ? ArrowUpRight : ArrowDownRight

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-muted/10 px-3 py-2">
      <div
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-md',
          isAbove ? TREND_CLASSES.positive.badge : TREND_CLASSES.negative.badge
        )}
      >
        <DirectionIcon className="size-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground text-xs tabular-nums">
          {DIRECTION_LABELS[alert.direction]}{' '}
          {formatCurrency(alert.targetPrice, alert.currency)}
          {showTicker && (
            <span className="ml-1.5 font-normal text-muted-foreground">
              ({alert.ticker})
            </span>
          )}
        </p>
        <p className="truncate text-[11px] text-muted-foreground tabular-nums">
          {isTriggered && alert.lastTriggeredAt
            ? `Atingido em ${formatDate(alert.lastTriggeredAt)}${alert.lastTriggeredPrice != null ? ` a ${formatCurrency(alert.lastTriggeredPrice, alert.currency)}` : ''}`
            : distance != null
              ? `Faltam ${formatPercentage(distance)}`
              : 'Aguardando cotação'}
          {alert.triggerCount > 1 && ` · ${alert.triggerCount} avisos`}
        </p>
      </div>

      <Badge
        variant="secondary"
        className={cn(
          'shrink-0 border-0 font-medium',
          isTriggered
            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isTriggered ? 'Atingido' : 'Vigiando'}
      </Badge>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remover alerta"
              disabled={isDeleting}
              onClick={() => deleteAlert(alert.id)}
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent>Remover alerta</TooltipContent>
      </Tooltip>
    </li>
  )
}
