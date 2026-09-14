import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'

import { FindAllWishlistParams } from '../../domain/dto/find-all-wishlist-params.dto'
import {
  WishlistMapper,
  WishlistWithCategoryHTTPResponse
} from '../../domain/wishlist.mapper'
import { WishlistRepository } from '../../domain/wishlist.repository'

type FindAllWishlistResponse = Either<Error, WishlistWithCategoryHTTPResponse[]>

@Injectable()
export class FindAllWishlistUseCase {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  async execute(
    params: FindAllWishlistParams
  ): Promise<FindAllWishlistResponse> {
    const items = await this.wishlistRepository.list(params)

    return right(items.map(WishlistMapper.toHTTPWithCategory))
  }
}
