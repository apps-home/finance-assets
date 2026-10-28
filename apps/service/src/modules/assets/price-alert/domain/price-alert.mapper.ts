import type {
  PriceAlertDirection,
  PriceAlertStatus
} from './price-alert.entity'
import type { PriceAlertWithDetails } from './price-alert.repository'

export interface PriceAlertHTTPResponse {
  id: string
  assetId: string | null
  wishlistId: string | null
  ticker: string
  name: string
  currency: string
  targetPrice: number
  direction: PriceAlertDirection
  status: PriceAlertStatus
  currentPrice: number | null
  lastTriggeredAt: Date | null
  lastTriggeredPrice: number | null
  triggerCount: number
  createdAt: Date
}

export class PriceAlertMapper {
  static toHTTP({
    alert,
    ticker,
    currentPrice,
    source
  }: PriceAlertWithDetails): PriceAlertHTTPResponse {
    return {
      id: alert.id,
      assetId: alert.assetId,
      wishlistId: alert.wishlistId,
      ticker,
      name: source.name,
      currency: source.currency,
      targetPrice: alert.targetPrice,
      direction: alert.direction,
      status: alert.status,
      currentPrice,
      lastTriggeredAt: alert.lastTriggeredAt,
      lastTriggeredPrice: alert.lastTriggeredPrice,
      triggerCount: alert.triggerCount,
      createdAt: alert.createdAt
    }
  }
}
