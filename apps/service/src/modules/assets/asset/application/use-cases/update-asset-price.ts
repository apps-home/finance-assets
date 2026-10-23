import { Injectable, Logger } from '@nestjs/common'

import { MarketDataGateway } from '@/core/http/external/market-data/market-data.gateway'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'
import { WishlistRepository } from '@/modules/assets/wishlist/domain/wishlist.repository'

import { AssetRepository } from '../../domain/asset.repository'

interface UpdateAssetPriceUseCaseProps {
  ticker: string
  categoryType: CategoryType
  assetId?: string
  assetIds?: string[]
  wishlistIds?: string[]
}

@Injectable()
export class UpdateAssetPriceUseCase {
  private readonly logger = new Logger(UpdateAssetPriceUseCase.name)

  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly wishlistRepository: WishlistRepository,
    private readonly marketDataGateway: MarketDataGateway
  ) {}

  async execute({
    ticker,
    categoryType,
    assetId,
    assetIds,
    wishlistIds
  }: UpdateAssetPriceUseCaseProps): Promise<void> {
    if (!ticker) {
      this.logger.debug('No ticker provided. Skipping market data fetch.')
      return
    }

    const provider = this.marketDataGateway.getProvider(categoryType)

    if (!provider) {
      this.logger.debug(
        `No market data provider for category type: ${categoryType}. Skipping.`
      )
      return
    }

    const quote = await provider.fetchQuote(ticker)

    if (!quote) {
      this.logger.warn(
        `Could not fetch quote for ticker: ${ticker}. Prices will not be updated.`
      )
      return
    }

    const targetAssetIds = assetIds ? [...assetIds] : assetId ? [assetId] : []

    for (const id of targetAssetIds) {
      const asset = await this.assetRepository.findByIdForSystem(id)

      if (!asset) {
        this.logger.warn(`Could not find asset with id: ${id}. Skipping.`)
        continue
      }

      this.logger.log(
        `Asset "${asset.ticker}" updated — current: ${quote.currentPrice}, lastMonth: ${quote.lastMonthPrice}`
      )

      asset.update({
        currentClosePrice: quote.currentPrice,
        lastMonthClosePrice: quote.lastMonthPrice
      })

      await this.assetRepository.save(asset)
    }

    if (wishlistIds && wishlistIds.length > 0) {
      for (const id of wishlistIds) {
        const wishlistItem = await this.wishlistRepository.findByIdForSystem(id)

        if (!wishlistItem) {
          this.logger.warn(
            `Could not find wishlist item with id: ${id}. Skipping.`
          )
          continue
        }

        this.logger.log(
          `Wishlist item "${wishlistItem.ticker}" updated — current: ${quote.currentPrice}, lastMonth: ${quote.lastMonthPrice}`
        )

        wishlistItem.update({
          currentClosePrice: quote.currentPrice,
          lastMonthClosePrice: quote.lastMonthPrice
        })

        await this.wishlistRepository.save(wishlistItem)
      }
    }
  }
}
