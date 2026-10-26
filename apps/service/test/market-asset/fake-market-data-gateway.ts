import { vi } from 'vitest'

import { MarketDataGateway } from '@/core/http/external/market-data/market-data.gateway'
import type {
  MarketDataProvider,
  MarketQuote
} from '@/core/http/external/market-data/market-data.provider'

export class FakeMarketDataGateway extends MarketDataGateway {
  public fetchQuote = vi.fn<MarketDataProvider['fetchQuote']>(async () => null)
  public provider: MarketDataProvider | null = { fetchQuote: this.fetchQuote }

  getProvider(): MarketDataProvider | null {
    return this.provider
  }

  withQuote(quote: MarketQuote | null) {
    this.fetchQuote.mockResolvedValue(quote)
  }
}
