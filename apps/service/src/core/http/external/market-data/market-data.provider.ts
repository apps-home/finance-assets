export interface MarketQuote {
  currentPrice: number
  lastMonthPrice: number
}

export abstract class MarketDataProvider {
  abstract fetchQuote(ticker: string): Promise<MarketQuote | null>
}
