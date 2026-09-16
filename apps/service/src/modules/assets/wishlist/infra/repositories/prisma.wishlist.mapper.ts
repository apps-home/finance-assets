import type { AssetWishlists as PrismaAssetWishlists } from '@lib/db'

import { Wishlist } from '../../domain/wishlist.entity'

export class PrismaWishlistMapper {
  static toDomain(raw: PrismaAssetWishlists): Wishlist {
    return Wishlist.create({
      id: raw.id,
      userId: raw.userId,
      categoryId: raw.categoryId,
      name: raw.name,
      ticker: raw.ticker,
      targetPrice: raw.targetPrice ? Number(raw.targetPrice) : null,
      currentClosePrice: raw.currentClosePrice
        ? Number(raw.currentClosePrice)
        : null,
      lastMonthClosePrice: raw.lastMonthClosePrice
        ? Number(raw.lastMonthClosePrice)
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
      currentClosePrice: wishlist.currentClosePrice,
      lastMonthClosePrice: wishlist.lastMonthClosePrice,
      notes: wishlist.notes,
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt
    }
  }
}
