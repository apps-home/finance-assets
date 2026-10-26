import { Injectable } from '@nestjs/common'

import {
  PriceHistoryGateway,
  type PriceHistoryRange
} from '@/core/http/external/market-data/price-history.gateway'
import { Either, left, right } from '@/core/utils/Either'
import { PriceHistoryUnavailableError } from '@/modules/assets/asset/application/errors/price-history-unavailable.error'
import type { AssetPriceHistory } from '@/modules/assets/asset/application/use-cases/get-asset-price-history'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'
import { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'

import { WishlistRepository } from '../../domain/wishlist.repository'
import { WishlistNotFoundError } from '../errors/wishlist-not-found.error'

type GetWishlistPriceHistoryResponse = Either<
  WishlistNotFoundError | CategoryNotFoundError | PriceHistoryUnavailableError,
  AssetPriceHistory
>

@Injectable()
export class GetWishlistPriceHistoryUseCase {
  constructor(
    private wishlistRepository: WishlistRepository,
    private categoryRepository: CategoryRepository,
    private priceHistoryGateway: PriceHistoryGateway
  ) {}

  async execute(
    userId: string,
    id: string,
    range: PriceHistoryRange
  ): Promise<GetWishlistPriceHistoryResponse> {
    const item = await this.wishlistRepository.findById(id, userId)

    if (!item) {
      return left(new WishlistNotFoundError())
    }

    const category = await this.categoryRepository.findById(
      item.categoryId,
      userId
    )

    if (!category) {
      return left(new CategoryNotFoundError())
    }

    const points = await this.priceHistoryGateway.fetchHistory(
      item.ticker,
      category.type,
      range
    )

    if (!points || points.length === 0) {
      return left(new PriceHistoryUnavailableError())
    }

    const first = points[0].close
    const last = points[points.length - 1].close

    return right({
      ticker: item.ticker,
      currency: category.currency,
      range,
      points,
      change: last - first,
      changePercent: first !== 0 ? (last / first - 1) * 100 : null
    })
  }
}
