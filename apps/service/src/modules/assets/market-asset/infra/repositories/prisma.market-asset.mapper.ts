import type { MarketAsset as PrismaMarketAsset } from '@lib/finance-assets-db'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { MarketAsset } from '../../domain/market-asset.entity'

export class PrismaMarketAssetMapper {
  static toDomain(raw: PrismaMarketAsset): MarketAsset {
    return MarketAsset.create({
      id: raw.id,
      ticker: raw.ticker,
      type: raw.type as CategoryType,
      name: raw.name,
      currentClosePrice:
        raw.currentClosePrice != null ? Number(raw.currentClosePrice) : null,
      lastMonthClosePrice:
        raw.lastMonthClosePrice != null
          ? Number(raw.lastMonthClosePrice)
          : null,
      priceUpdatedAt: raw.priceUpdatedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }

  static toPrisma(marketAsset: MarketAsset) {
    return {
      id: marketAsset.id,
      ticker: marketAsset.ticker,
      type: marketAsset.type,
      name: marketAsset.name,
      currentClosePrice: marketAsset.currentClosePrice,
      lastMonthClosePrice: marketAsset.lastMonthClosePrice,
      priceUpdatedAt: marketAsset.priceUpdatedAt,
      createdAt: marketAsset.createdAt,
      updatedAt: marketAsset.updatedAt
    }
  }
}
