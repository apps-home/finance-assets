import { Injectable, Logger } from '@nestjs/common'

import { MarketDataGateway } from '@/core/http/external/market-data/market-data.gateway'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { AssetRepository } from '../../domain/asset.repository'

interface UpdateAssetPriceUseCaseProps {
  assetId: string
  ticker: string
  categoryType: CategoryType
}

@Injectable()
export class UpdateAssetPriceUseCase {
  private readonly logger = new Logger(UpdateAssetPriceUseCase.name)

  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly marketDataGateway: MarketDataGateway
  ) {}

  async execute({
    assetId,
    ticker,
    categoryType
  }: UpdateAssetPriceUseCaseProps): Promise<void> {
    const asset = await this.assetRepository.findById(assetId)

    if (!asset) {
      this.logger.warn(
        `Could not find asset with id: ${assetId}. Asset prices will not be updated.`
      )
      return
    }

    const provider = this.marketDataGateway.getProvider(categoryType)

    if (!provider) {
      this.logger.debug(
        `No market data provider for category type: ${categoryType}. Skipping.`
      )
      return
    }

    if (!ticker) {
      this.logger.debug(
        `Asset "${assetId}" has no ticker. Skipping market data fetch.`
      )
      return
    }

    const quote = await provider.fetchQuote(ticker)

    if (!quote) {
      this.logger.warn(
        `Could not fetch quote for ticker: ${ticker}. Asset prices will not be updated.`
      )
      return
    }

    this.logger.log(
      `Asset "${asset.ticker}" before update — current: ${asset.currentClosePrice}, lastMonth: ${asset.lastMonthClosePrice}`
    )

    asset.update({
      currentClosePrice: quote.currentPrice,
      lastMonthClosePrice: quote.lastMonthPrice
    })

    await this.assetRepository.save(asset)
  }
}
