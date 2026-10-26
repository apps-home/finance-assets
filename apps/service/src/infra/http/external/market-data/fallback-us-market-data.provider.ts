import { Logger } from '@nestjs/common'

import {
  MarketDataProvider,
  MarketQuote
} from '@/core/http/external/market-data/market-data.provider'

interface NamedProvider {
  name: string
  provider: MarketDataProvider
}

/**
 * Tenta os providers US em ordem e devolve a primeira cotação obtida.
 */
export class UsMarketDataFallbackProvider implements MarketDataProvider {
  private readonly logger = new Logger(UsMarketDataFallbackProvider.name)

  constructor(private readonly providers: NamedProvider[]) {}

  async fetchQuote(ticker: string): Promise<MarketQuote | null> {
    for (const [index, { name, provider }] of this.providers.entries()) {
      this.logger.log(
        `Attempting to fetch quote for US ticker "${ticker}" via ${name}...`
      )

      const quote = await provider.fetchQuote(ticker)

      if (quote) {
        if (index > 0) {
          this.logger.log(
            `Successfully recovered quote for US ticker "${ticker}" via fallback provider (${name}).`
          )
        }
        return quote
      }

      this.logger.warn(`${name} returned no data for "${ticker}".`)
    }

    this.logger.error(
      `All US market data providers failed to retrieve quote for ticker: ${ticker}`
    )

    return null
  }
}
