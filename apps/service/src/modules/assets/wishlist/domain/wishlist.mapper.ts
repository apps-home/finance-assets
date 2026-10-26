import { CategorySummary } from '@/modules/assets/categories/domain/category.entity'

import { CreateWishlistPayload } from './dto/create-wishlist.dto'
import { Wishlist, WishlistProps } from './wishlist.entity'
import { WishlistWithCategory } from './wishlist.repository'

export interface WishlistWithCategoryHTTPResponse {
  wishlist: WishlistProps
  category: CategorySummary
}

export class WishlistMapper {
  static toDomain(raw: CreateWishlistPayload): Wishlist {
    return Wishlist.create({
      userId: raw.userId,
      categoryId: raw.categoryId,
      name: raw.name,
      ticker: raw.ticker,
      targetPrice: raw.targetPrice ?? null,
      notes: raw.notes ?? null
    })
  }

  static toHTTP(wishlist: Wishlist): WishlistProps {
    return {
      id: wishlist.id,
      userId: wishlist.userId,
      categoryId: wishlist.categoryId,
      name: wishlist.name,
      ticker: wishlist.ticker,
      targetPrice: wishlist.targetPrice,
      marketAssetId: wishlist.marketAssetId,
      currentClosePrice: wishlist.currentClosePrice,
      lastMonthClosePrice: wishlist.lastMonthClosePrice,
      notes: wishlist.notes,
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt
    }
  }

  static toHTTPWithCategory(
    item: WishlistWithCategory
  ): WishlistWithCategoryHTTPResponse {
    return {
      wishlist: WishlistMapper.toHTTP(item.wishlist),
      category: item.category
    }
  }
}
