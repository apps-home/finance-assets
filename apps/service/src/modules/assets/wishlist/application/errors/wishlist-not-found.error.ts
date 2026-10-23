import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class WishlistNotFoundError extends NotFoundError {
  constructor() {
    super('Wishlist item not found')
    this.name = WishlistNotFoundError.name
  }
}
