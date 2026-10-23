import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'

import { UpdateWishlistPayload } from '../../domain/dto/update-wishlist.dto'
import { WishlistRepository } from '../../domain/wishlist.repository'
import { WishlistNotFoundError } from '../errors/wishlist-not-found.error'

type UpdateWishlistResponse = Either<WishlistNotFoundError | PayloadError, void>

@Injectable()
export class UpdateWishlistUseCase {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  async execute(
    userId: string,
    id: string,
    data: UpdateWishlistPayload
  ): Promise<UpdateWishlistResponse> {
    try {
      const item = await this.wishlistRepository.findById(id, userId)

      if (!item) {
        return left(new WishlistNotFoundError())
      }

      if (data.ticker && data.ticker.trim().toUpperCase() !== item.ticker) {
        const existing = await this.wishlistRepository.findByUserAndTicker(
          userId,
          data.ticker.trim().toUpperCase()
        )

        if (existing) {
          return left(
            new PayloadError('This ticker is already in your wishlist')
          )
        }
      }

      item.update(data)

      await this.wishlistRepository.save(item)

      return right(void 0)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }
  }
}
