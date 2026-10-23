import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'
import {
  calcMonthChange,
  sortByMonthChange
} from '@/core/utils/sort-by-month-change'

import { FindAllWishlistParams } from '../../domain/dto/find-all-wishlist-params.dto'
import {
  WishlistMapper,
  WishlistWithCategoryHTTPResponse
} from '../../domain/wishlist.mapper'
import {
  WishlistRepository,
  WishlistWithCategory
} from '../../domain/wishlist.repository'

type FindAllWishlistResponse = Either<Error, WishlistWithCategoryHTTPResponse[]>

@Injectable()
export class FindAllWishlistUseCase {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  async execute(
    params: FindAllWishlistParams
  ): Promise<FindAllWishlistResponse> {
    const records = await this.wishlistRepository.list(params)

    const items = records.filter((item) =>
      this.matchesTargetStatus(item, params.targetStatus)
    )

    const sorted =
      params.sort === 'monthChange'
        ? sortByMonthChange(
            items,
            ({ wishlist }) =>
              calcMonthChange(
                wishlist.currentClosePrice,
                wishlist.lastMonthClosePrice
              ),
            params.order
          )
        : items

    return right(sorted.map(WishlistMapper.toHTTPWithCategory))
  }

  private matchesTargetStatus(
    { wishlist }: WishlistWithCategory,
    targetStatus: FindAllWishlistParams['targetStatus']
  ): boolean {
    if (!targetStatus) return true

    const { currentClosePrice, targetPrice } = wishlist
    const hasTarget = targetPrice != null && targetPrice > 0

    switch (targetStatus) {
      case 'BELOW_OR_AT_TARGET':
        return (
          hasTarget &&
          currentClosePrice != null &&
          currentClosePrice <= targetPrice
        )
      case 'ABOVE_TARGET':
        return (
          hasTarget &&
          currentClosePrice != null &&
          currentClosePrice > targetPrice
        )
      case 'NO_TARGET':
        return !hasTarget
    }
  }
}
