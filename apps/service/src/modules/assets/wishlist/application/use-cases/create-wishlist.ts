import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'
import { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'
import { ResolveMarketAssetWithQuoteUseCase } from '@/modules/assets/market-asset/application/use-cases/resolve-market-asset-with-quote'

import { CreateWishlistPayload } from '../../domain/dto/create-wishlist.dto'
import { WishlistMapper } from '../../domain/wishlist.mapper'
import { WishlistRepository } from '../../domain/wishlist.repository'

type CreateWishlistResponse = Either<CategoryNotFoundError | PayloadError, void>

@Injectable()
export class CreateWishlistUseCase {
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly resolveMarketAsset: ResolveMarketAssetWithQuoteUseCase
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

      // Reaproveita o ticker do catálogo; busca a cotação só se não for recente
      const { value: marketAsset } = await this.resolveMarketAsset.execute({
        ticker: wishlist.ticker,
        type: category.type,
        name: wishlist.name
      })
      wishlist.linkMarketAsset(marketAsset)

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
