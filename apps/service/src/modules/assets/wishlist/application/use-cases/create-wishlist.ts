import { Injectable, Logger } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { MarketDataGateway } from '@/core/http/external/market-data/market-data.gateway'
import { Either, left, right } from '@/core/utils/Either'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'
import { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'

import { CreateWishlistPayload } from '../../domain/dto/create-wishlist.dto'
import { WishlistMapper } from '../../domain/wishlist.mapper'
import { WishlistRepository } from '../../domain/wishlist.repository'

type CreateWishlistResponse = Either<CategoryNotFoundError | PayloadError, void>

@Injectable()
export class CreateWishlistUseCase {
  private readonly logger = new Logger(CreateWishlistUseCase.name)

  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly marketDataGateway: MarketDataGateway
  ) {}

  async execute(data: CreateWishlistPayload): Promise<CreateWishlistResponse> {
    try {
      const category = await this.categoryRepository.findById(
        data.categoryId,
        data.userId
      )

      if (!category) {
        return left(new CategoryNotFoundError())
      }

      const existingItem = await this.wishlistRepository.findByUserAndTicker(
        data.userId,
        data.ticker.trim().toUpperCase()
      )

      if (existingItem) {
        return left(new PayloadError('This ticker is already in your wishlist'))
      }

      const wishlist = WishlistMapper.toDomain(data)

      // Fetch initial market quote if ticker is provided
      if (wishlist.ticker) {
        try {
          const provider = this.marketDataGateway.getProvider(category.type)

          if (provider) {
            const quote = await provider.fetchQuote(wishlist.ticker)

            if (quote) {
              wishlist.update({
                currentClosePrice: quote.currentPrice,
                lastMonthClosePrice: quote.lastMonthPrice
              })
            }
          }
        } catch (quoteError) {
          this.logger.warn(
            `Failed to fetch initial quote for wishlist ticker "${wishlist.ticker}": ${
              quoteError instanceof Error ? quoteError.message : quoteError
            }`
          )
        }
      }

      await this.wishlistRepository.save(wishlist)

      return right(void 0)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }
  }
}
