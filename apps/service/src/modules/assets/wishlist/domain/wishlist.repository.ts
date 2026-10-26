import { CategorySummary } from '@/modules/assets/categories/domain/category.entity'

import { FindAllWishlistParams } from './dto/find-all-wishlist-params.dto'
import { Wishlist } from './wishlist.entity'

export interface WishlistWithCategory {
  wishlist: Wishlist
  category: CategorySummary
}

export interface WishlistWithUserDetails extends WishlistWithCategory {
  user: {
    id: string
    name: string
    email: string
  }
}

export abstract class WishlistRepository {
  abstract list(params: FindAllWishlistParams): Promise<WishlistWithCategory[]>
  abstract save(wishlist: Wishlist): Promise<void>
  abstract findById(id: string, userId: string): Promise<Wishlist | null>
  abstract findByIdForSystem(id: string): Promise<Wishlist | null>
  abstract findByUserAndTicker(
    userId: string,
    ticker: string
  ): Promise<Wishlist | null>
  abstract delete(id: string): Promise<void>
  abstract findAllWithUserDetails(): Promise<WishlistWithUserDetails[]>
}
