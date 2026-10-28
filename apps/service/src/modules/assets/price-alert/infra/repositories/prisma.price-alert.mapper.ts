import type {
  AssetCategory as PrismaCategory,
  MarketAsset as PrismaMarketAsset,
  PriceAlert as PrismaPriceAlert
} from '@lib/db'

import {
  PriceAlert,
  PriceAlertDirection,
  PriceAlertStatus
} from '../../domain/price-alert.entity'
import type { PriceAlertWithDetails } from '../../domain/price-alert.repository'

interface PrismaAlertSource {
  id: string
  name: string
  category: Pick<PrismaCategory, 'currency'>
}

export type PrismaPriceAlertWithDetails = PrismaPriceAlert & {
  marketAsset: Pick<PrismaMarketAsset, 'ticker' | 'currentClosePrice'>
  asset: PrismaAlertSource | null
  wishlist: PrismaAlertSource | null
}

/** Ticker e cotação do catálogo, mais nome e moeda da origem */
export const WITH_DETAILS = {
  marketAsset: { select: { ticker: true, currentClosePrice: true } },
  asset: {
    select: { id: true, name: true, category: { select: { currency: true } } }
  },
  wishlist: {
    select: { id: true, name: true, category: { select: { currency: true } } }
  }
} as const

const toNumber = (value: { toString(): string } | null) =>
  value === null ? null : Number(value)

export class PrismaPriceAlertMapper {
  static toDomain(raw: PrismaPriceAlert): PriceAlert {
    return new PriceAlert({
      id: raw.id,
      userId: raw.userId,
      marketAssetId: raw.marketAssetId,
      assetId: raw.assetId,
      wishlistId: raw.wishlistId,
      targetPrice: Number(raw.targetPrice),
      direction: raw.direction as PriceAlertDirection,
      status: raw.status as PriceAlertStatus,
      lastTriggeredAt: raw.lastTriggeredAt,
      lastTriggeredPrice: toNumber(raw.lastTriggeredPrice),
      triggerCount: raw.triggerCount,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }

  static toDetails(raw: PrismaPriceAlertWithDetails): PriceAlertWithDetails {
    const origin = raw.asset ?? raw.wishlist

    // Garantido pelo CHECK da tabela: sempre há exatamente uma origem
    if (!origin) {
      throw new Error(`Price alert ${raw.id} has no source`)
    }

    return {
      alert: PrismaPriceAlertMapper.toDomain(raw),
      ticker: raw.marketAsset.ticker,
      currentPrice: toNumber(raw.marketAsset.currentClosePrice),
      source: {
        kind: raw.asset ? 'ASSET' : 'WISHLIST',
        id: origin.id,
        name: origin.name,
        currency: origin.category.currency
      }
    }
  }

  static toPrisma(alert: PriceAlert) {
    return {
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
    }
  }
}
