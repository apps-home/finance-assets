import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'
import { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'
import { ResolveMarketAssetWithQuoteUseCase } from '@/modules/assets/market-asset/application/use-cases/resolve-market-asset-with-quote'

import { UpdateWishlistPayload } from '../../domain/dto/update-wishlist.dto'
import { WishlistRepository } from '../../domain/wishlist.repository'
import { WishlistNotFoundError } from '../errors/wishlist-not-found.error'

type UpdateWishlistResponse = Either<
  WishlistNotFoundError | CategoryNotFoundError | PayloadError,
  void
>

@Injectable()
export class UpdateWishlistUseCase {
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly resolveMarketAsset: ResolveMarketAssetWithQuoteUseCase
  ) {}

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

      const previousTicker = item.ticker

      item.update(data)

      // Outro ticker aponta para outro item do catálogo
      if (item.ticker !== previousTicker) {
        const category = await this.categoryRepository.findById(
          item.categoryId,
          userId
        )

        if (!category) {
          return left(new CategoryNotFoundError())
        }

        const { value: marketAsset } = await this.resolveMarketAsset.execute({
          ticker: item.ticker,
          type: category.type,
          name: item.name
        })
        item.linkMarketAsset(marketAsset)
      }

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
