import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { FindAllWishlistParams } from './dto/find-all-wishlist-params.dto'
import { Wishlist } from './wishlist.entity'

export interface WishlistWithCategory {
	wishlist: Wishlist
	category: {
		id: string
		name: string
		type: CategoryType
		currency: string
	}
}

export interface WishlistWithCategoryType {
	wishlist: Wishlist
	categoryType: CategoryType
}

export abstract class WishlistRepository {
	abstract list(params: FindAllWishlistParams): Promise<WishlistWithCategory[]>
	abstract save(wishlist: Wishlist): Promise<void>
	abstract findById(id: string): Promise<Wishlist | null>
	abstract findByUserAndTicker(
		userId: string,
		ticker: string,
	): Promise<Wishlist | null>
	abstract delete(id: string): Promise<void>
	abstract findAllWithTicker(): Promise<WishlistWithCategoryType[]>
}
