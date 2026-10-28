import {
  PriceAlert,
  type PriceAlertStatus
} from '@/modules/assets/price-alert/domain/price-alert.entity'
import type {
  ListPriceAlertsParams,
  PriceAlertRepository,
  PriceAlertWithDetails
} from '@/modules/assets/price-alert/domain/price-alert.repository'

type AlertDetails = Omit<PriceAlertWithDetails, 'alert'>

/** Ticker, cotação e origem genéricos; os testes podem trocar por alerta */
function defaultDetails(alert: PriceAlert): AlertDetails {
  return {
    ticker: 'WEGE3',
    currentPrice: null,
    source: {
      kind: alert.assetId ? 'ASSET' : 'WISHLIST',
      id: (alert.assetId ?? alert.wishlistId) as string,
      name: 'Weg',
      currency: 'BRL'
    }
  }
}

/** Cópia independente, como uma linha lida do banco */
function snapshot(alert: PriceAlert): PriceAlert {
  return new PriceAlert({
    id: alert.id,
    userId: alert.userId,
    marketAssetId: alert.marketAssetId,
    assetId: alert.assetId,
    wishlistId: alert.wishlistId,
    targetPrice: alert.targetPrice,
    direction: alert.direction,
    status: alert.status,
    lastTriggeredAt: alert.lastTriggeredAt,
    lastTriggeredPrice: alert.lastTriggeredPrice,
    triggerCount: alert.triggerCount,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt
  })
}

export class InMemoryPriceAlertRepository implements PriceAlertRepository {
  public items: PriceAlert[] = []
  public details = new Map<string, AlertDetails>()

  private withDetails(alert: PriceAlert): PriceAlertWithDetails {
    return {
      alert: snapshot(alert),
      ...(this.details.get(alert.id) ?? defaultDetails(alert))
    }
  }

  async create(alert: PriceAlert): Promise<void> {
    this.items.push(snapshot(alert))
  }

  async findById(id: string, userId: string): Promise<PriceAlert | null> {
    const alert = this.items.find(
      (item) => item.id === id && item.userId === userId
    )

    return alert ? snapshot(alert) : null
  }

  async list({
    userId,
    assetId,
    wishlistId
  }: ListPriceAlertsParams): Promise<PriceAlertWithDetails[]> {
    return this.items
      .filter(
        (item) =>
          item.userId === userId &&
          (!assetId || item.assetId === assetId) &&
          (!wishlistId || item.wishlistId === wishlistId)
      )
      .map((item) => this.withDetails(item))
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id)
  }

  async findByMarketAsset(
    marketAssetId: string
  ): Promise<PriceAlertWithDetails[]> {
    return this.items
      .filter((item) => item.marketAssetId === marketAssetId)
      .map((item) => this.withDetails(item))
  }

  async transition(
    alert: PriceAlert,
    from: PriceAlertStatus
  ): Promise<boolean> {
    const index = this.items.findIndex(
      (item) => item.id === alert.id && item.status === from
    )

    if (index < 0) return false

    this.items[index] = snapshot(alert)
    return true
  }
}
