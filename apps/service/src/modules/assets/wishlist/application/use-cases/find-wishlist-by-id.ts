import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { WishlistProps } from '../../domain/wishlist.entity'
import { WishlistMapper } from '../../domain/wishlist.mapper'
import { WishlistRepository } from '../../domain/wishlist.repository'
import { WishlistNotFoundError } from '../errors/wishlist-not-found.error'

type FindWishlistByIdResponse = Either<WishlistNotFoundError, WishlistProps>

@Injectable()
export class FindWishlistByIdUseCase {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  async execute(userId: string, id: string): Promise<FindWishlistByIdResponse> {
    const item = await this.wishlistRepository.findById(id, userId)

    if (!item) {
      return left(new WishlistNotFoundError())
    }

    return right(WishlistMapper.toHTTP(item))
  }
}
