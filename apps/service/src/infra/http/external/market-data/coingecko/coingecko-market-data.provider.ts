import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

import {
  MarketDataProvider,
  MarketQuote
} from '@/core/http/external/market-data/market-data.provider'

interface CoinGeckoMarketChartResponse {
  prices: [number, number][]
}

const TICKER_TO_COINGECKO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  XRP: 'ripple',
  SOL: 'solana',
  USDC: 'usd-coin',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  LTC: 'litecoin',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  BNB: 'binancecoin'
}

@Injectable()
export class CoinGeckoMarketDataProvider implements MarketDataProvider {
  private readonly logger = new Logger(CoinGeckoMarketDataProvider.name)
  private readonly baseUrl = 'https://api.coingecko.com/api/v3'

  constructor(private readonly httpService: HttpService) {}

  async fetchQuote(ticker: string): Promise<MarketQuote | null> {
    try {
      const coinId = this.resolveCoinId(ticker)

      if (!coinId) {
        this.logger.warn(
          `Unknown crypto ticker "${ticker}" — no CoinGecko mapping found. Skipping.`
        )
        return null
      }

      this.logger.log(
        `Fetching crypto quote for ${ticker} (${coinId}) from CoinGecko...`
      )

      const { data } = await firstValueFrom(
        this.httpService.get<CoinGeckoMarketChartResponse>(
          `${this.baseUrl}/coins/${coinId}/market_chart`,
          {
            params: {
              vs_currency: 'brl',
              days: '90',
              interval: 'daily'
            }
          }
        )
      )

      const prices = data?.prices

      if (!prices || prices.length === 0) {
        this.logger.warn(
          `No price data returned from CoinGecko for coin: ${coinId}`
        )
        return null
      }

      const currentPrice = prices[prices.length - 1][1]
      const lastMonthPrice = this.extractLastMonthClosePrice(prices)

      this.logger.log(
        `CoinGecko quote for ${ticker}: current=${currentPrice}, lastMonth=${lastMonthPrice}`
      )

      return {
        currentPrice,
        lastMonthPrice: lastMonthPrice ?? currentPrice
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch crypto quote from CoinGecko for coin: ${ticker}`,
        error instanceof Error ? error.message : error
      )
      return null
    }
  }

  private resolveCoinId(ticker: string): string | null {
    return TICKER_TO_COINGECKO_ID[ticker.toUpperCase()] ?? null
  }

  private extractLastMonthClosePrice(
    prices: [number, number][]
  ): number | null {
    const now = new Date()
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1)
    const previousMonthNum = previousMonth.getMonth()
    const previousMonthYear = previousMonth.getFullYear()

    const previousMonthEntries = prices
      .filter(([timestamp]) => {
        const entryDate = new Date(timestamp)
        return (
          entryDate.getMonth() === previousMonthNum &&
          entryDate.getFullYear() === previousMonthYear
        )
      })
      .sort((a, b) => b[0] - a[0])

    if (previousMonthEntries.length > 0) {
      return previousMonthEntries[0][1]
    }

    return null
  }
}
