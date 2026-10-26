import type { Wishlist } from '@/modules/assets/wishlist/domain/wishlist.entity'
import type {
  WishlistRepository,
  WishlistWithCategory,
  WishlistWithUserDetails
} from '@/modules/assets/wishlist/domain/wishlist.repository'

export class InMemoryWishlistRepository implements WishlistRepository {
  public items: Wishlist[] = []

  async list(): Promise<WishlistWithCategory[]> {
    return []
  }

  async save(wishlist: Wishlist): Promise<void> {
    const index = this.items.findIndex((item) => item.id === wishlist.id)

    if (index >= 0) {
      this.items[index] = wishlist
    } else {
      this.items.push(wishlist)
    }
  }

  async findById(id: string, userId: string): Promise<Wishlist | null> {
    return (
      this.items.find((item) => item.id === id && item.userId === userId) ??
      null
    )
  }

  async findByIdForSystem(id: string): Promise<Wishlist | null> {
    return this.items.find((item) => item.id === id) ?? null
  }

  async findByUserAndTicker(
    userId: string,
    ticker: string
  ): Promise<Wishlist | null> {
    return (
      this.items.find(
        (item) => item.userId === userId && item.ticker === ticker
      ) ?? null
    )
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id)
  }

  async findAllWithUserDetails(): Promise<WishlistWithUserDetails[]> {
    return []
  }
}
