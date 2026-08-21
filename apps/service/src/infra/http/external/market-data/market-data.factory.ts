import { Injectable, Logger } from '@nestjs/common'
import { MarketDataGateway } from '@/core/http/external/market-data/market-data.gateway'
import { MarketDataProvider } from '@/core/http/external/market-data/market-data.provider'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'
import { AlphaVantageMarketDataProvider } from './alpha-vantage/alpha-vantage-market-data.provider'
import { BrapiMarketDataProvider } from './brapi/brapi-market-data.provider'
import { CoinGeckoMarketDataProvider } from './coingecko/coingecko-market-data.provider'

@Injectable()
export class MarketDataFactory implements MarketDataGateway {
  private readonly logger = new Logger(MarketDataFactory.name)

  constructor(
    private readonly brapiProvider: BrapiMarketDataProvider,
    private readonly coingeckoProvider: CoinGeckoMarketDataProvider,
    private readonly alphaVantageProvider: AlphaVantageMarketDataProvider
  ) {}

  getProvider(categoryType: CategoryType): MarketDataProvider | null {
    switch (categoryType) {
      case CategoryType.FIXED:
        this.logger.debug(
          'Category type is FIXED — no market data fetch needed'
        )
        return null

      case CategoryType.VARIABLE_BR:
        return this.brapiProvider

      case CategoryType.VARIABLE_US:
        return this.alphaVantageProvider

      case CategoryType.CRYPTO:
        return this.coingeckoProvider

      default:
        this.logger.warn(`Unknown category type: ${categoryType}`)
        return null
    }
  }
}
