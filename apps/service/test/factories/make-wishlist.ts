import { faker } from '@faker-js/faker'

import {
  Wishlist,
  type WishlistProps
} from '@/modules/assets/wishlist/domain/wishlist.entity'

export function makeWishlist(
  override: Partial<WishlistProps> &
    Pick<WishlistProps, 'userId' | 'categoryId'>
): Wishlist {
  return Wishlist.create({
    name: faker.finance.accountName(),
    ticker: faker.string.alpha({ length: 4, casing: 'upper' }),
    ...override
  })
}
