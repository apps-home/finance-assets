import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { WishlistRepository } from '../../domain/wishlist.repository'
import { WishlistNotFoundError } from '../errors/wishlist-not-found.error'

type DeleteWishlistResponse = Either<WishlistNotFoundError, void>

@Injectable()
export class DeleteWishlistUseCase {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  async execute(id: string): Promise<DeleteWishlistResponse> {
    const item = await this.wishlistRepository.findById(id)

    if (!item) {
      return left(new WishlistNotFoundError())
    }

    await this.wishlistRepository.delete(id)

    return right(void 0)
  }
}
