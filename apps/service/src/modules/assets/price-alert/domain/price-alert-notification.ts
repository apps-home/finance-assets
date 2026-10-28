import { PriceAlertDirection } from './price-alert.entity'
import type {
  PriceAlertSourceKind,
  PriceAlertWithDetails
} from './price-alert.repository'

/** Dados do workflow `price-alert` no Novu, usados como {{payload.<campo>}} */
export interface PriceAlertNotificationPayload extends Record<string, unknown> {
  alertId: string
  ticker: string
  name: string
  currency: string
  direction: PriceAlertDirection
  /** "subiu para" ou "caiu para" */
  directionLabel: string
  targetPrice: number
  currentPrice: number
  /** Ex.: "R$ 40,00", "US$ 210,50" */
  targetPriceFormatted: string
  currentPriceFormatted: string
  source: PriceAlertSourceKind
  sourceId: string
  /** Página da origem na web, para o redirect da notificação */
  url: string
}

const DIRECTION_LABELS: Record<PriceAlertDirection, string> = {
  [PriceAlertDirection.ABOVE]: 'subiu para',
  [PriceAlertDirection.BELOW]: 'caiu para'
}

const SOURCE_URLS: Record<PriceAlertSourceKind, string> = {
  ASSET: '/assets',
  WISHLIST: '/wishlist'
}

export function formatPrice(value: number, currency: string): string {
  // Abaixo de 1 (cripto barata) mostra mais casas para não virar "R$ 0,00"
  const maximumFractionDigits = Math.abs(value) < 1 ? 6 : 2

  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits
    }).format(value)
  } catch {
    // Código de moeda inválido na categoria
    return `${currency} ${value.toFixed(2)}`
  }
}

export function buildPriceAlertNotification(
  { alert, ticker, source }: PriceAlertWithDetails,
  currentPrice: number
): PriceAlertNotificationPayload {
  return {
    alertId: alert.id,
    ticker,
    name: source.name,
    currency: source.currency,
    direction: alert.direction,
    directionLabel: DIRECTION_LABELS[alert.direction],
    targetPrice: alert.targetPrice,
    currentPrice,
    targetPriceFormatted: formatPrice(alert.targetPrice, source.currency),
    currentPriceFormatted: formatPrice(currentPrice, source.currency),
    source: source.kind,
    sourceId: source.id,
    url: SOURCE_URLS[source.kind]
  }
}
