import { Logger } from '@nestjs/common'

import {
  MarketDataProvider,
  MarketQuote
} from '@/core/http/external/market-data/market-data.provider'

import { AlphaVantageMarketDataProvider } from './alpha-vantage/alpha-vantage-market-data.provider'
import { PolygonMarketDataProvider } from './polygon/polygon-market-data.provider'

export class UsMarketDataFallbackProvider implements MarketDataProvider {
  private readonly logger = new Logger(UsMarketDataFallbackProvider.name)

  constructor(
    private readonly primaryProvider: PolygonMarketDataProvider,
    private readonly fallbackProvider: AlphaVantageMarketDataProvider
  ) {}

  async fetchQuote(ticker: string): Promise<MarketQuote | null> {
    this.logger.log(
      `Attempting to fetch quote for US ticker "${ticker}" via primary provider (Polygon.io)...`
    )

    const primaryQuote = await this.primaryProvider.fetchQuote(ticker)

    if (primaryQuote) {
      return primaryQuote
    }

    this.logger.warn(
      `Primary provider (Polygon.io) returned no data for "${ticker}". Falling back to Alpha Vantage...`
    )

    const fallbackQuote = await this.fallbackProvider.fetchQuote(ticker)

    if (fallbackQuote) {
      this.logger.log(
        `Successfully recovered quote for US ticker "${ticker}" via fallback provider (Alpha Vantage).`
      )
      return fallbackQuote
    }

    this.logger.error(
      `Both Polygon.io and Alpha Vantage failed to retrieve quote for ticker: ${ticker}`
    )

    return null
  }
}
