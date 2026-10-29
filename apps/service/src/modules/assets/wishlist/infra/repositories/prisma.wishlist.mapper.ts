import type {
  AssetWishlists as PrismaAssetWishlists,
  MarketAsset as PrismaMarketAsset
} from '@lib/finance-assets-db'

import { Wishlist } from '../../domain/wishlist.entity'

export type PrismaWishlistWithMarket = PrismaAssetWishlists & {
  marketAsset: PrismaMarketAsset | null
}

/** Sempre carregar o item com a cotação do catálogo */
export const WITH_MARKET_ASSET = { marketAsset: true } as const

export class PrismaWishlistMapper {
  static toDomain(raw: PrismaWishlistWithMarket): Wishlist {
    const { marketAsset } = raw

    return Wishlist.create({
      id: raw.id,
      userId: raw.userId,
      categoryId: raw.categoryId,
      name: raw.name,
      ticker: raw.ticker,
      targetPrice: raw.targetPrice ? Number(raw.targetPrice) : null,
      marketAssetId: raw.marketAssetId,
      currentClosePrice:
        marketAsset?.currentClosePrice != null
          ? Number(marketAsset.currentClosePrice)
          : null,
      lastMonthClosePrice:
        marketAsset?.lastMonthClosePrice != null
          ? Number(marketAsset.lastMonthClosePrice)
          : null,
      notes: raw.notes ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }

  static toPrisma(wishlist: Wishlist) {
    return {
      id: wishlist.id,
      userId: wishlist.userId,
      categoryId: wishlist.categoryId,
      name: wishlist.name,
      ticker: wishlist.ticker,
      targetPrice: wishlist.targetPrice,
      marketAssetId: wishlist.marketAssetId,
      notes: wishlist.notes,
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt
    }
  }
}
