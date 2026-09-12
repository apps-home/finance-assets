import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { isAxiosError } from 'axios'
import { firstValueFrom } from 'rxjs'

import {
  MarketDataProvider,
  MarketQuote
} from '@/core/http/external/market-data/market-data.provider'
import { EnvService } from '@/infra/env/env.service'

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
  BNB: 'binancecoin',
  MUSD: 'usd-coin'
}

@Injectable()
export class CoinGeckoMarketDataProvider implements MarketDataProvider {
  private readonly logger = new Logger(CoinGeckoMarketDataProvider.name)
  private baseUrl = 'https://api.coingecko.com/api/v3'
  private authHeader = 'x-cg-demo-api-key'

  private readonly COINGECKO_API_KEY: string

  constructor(
    private readonly httpService: HttpService,
    private readonly env: EnvService
  ) {
    const rawKey = this.env.get('COINGECKO_API_KEY')
    this.COINGECKO_API_KEY = rawKey
      ? rawKey.trim().replace(/^['"](.*)['"]$/, '$1')
      : ''
  }

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

      let responseData: CoinGeckoMarketChartResponse

      const headers: Record<string, string> = {}
      if (this.COINGECKO_API_KEY) {
        headers[this.authHeader] = this.COINGECKO_API_KEY
      }

      try {
        const { data } = await firstValueFrom(
          this.httpService.get<CoinGeckoMarketChartResponse>(
            `${this.baseUrl}/coins/${coinId}/market_chart`,
            {
              params: {
                vs_currency: 'brl',
                days: '90',
                interval: 'daily'
              },
              ...(Object.keys(headers).length > 0 && { headers })
            }
          )
        )
        responseData = data
      } catch (requestError) {
        // Case 1: CoinGecko error 10010: Pro key used on Demo endpoint -> switch to Pro API
        if (
          isAxiosError(requestError) &&
          (requestError.response?.data as { status?: { error_code?: number } })
            ?.status?.error_code === 10010
        ) {
          this.logger.warn(
            'CoinGecko key identified as PRO key (error 10010). Switching to pro-api.coingecko.com and retrying...'
          )
          this.baseUrl = 'https://pro-api.coingecko.com/api/v3'
          this.authHeader = 'x-cg-pro-api-key'

          const { data } = await firstValueFrom(
            this.httpService.get<CoinGeckoMarketChartResponse>(
              `${this.baseUrl}/coins/${coinId}/market_chart`,
              {
                params: {
                  vs_currency: 'brl',
                  days: '90',
                  interval: 'daily'
                },
                headers: {
                  [this.authHeader]: this.COINGECKO_API_KEY
                }
              }
            )
          )
          responseData = data
        } else if (
          isAxiosError(requestError) &&
          requestError.response?.status === 401 &&
          this.COINGECKO_API_KEY
        ) {
          // Case 2: Key was rejected (401). Fallback to public keyless API to ensure prices update.
          const errorDetails = JSON.stringify(requestError.response?.data)
          this.logger.warn(
            `CoinGecko API key was rejected (401: ${errorDetails}). Retrying ${ticker} via public keyless endpoint...`
          )

          const { data } = await firstValueFrom(
            this.httpService.get<CoinGeckoMarketChartResponse>(
              `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
              {
                params: {
                  vs_currency: 'brl',
                  days: '90',
                  interval: 'daily'
                }
              }
            )
          )
          responseData = data
        } else {
          throw requestError
        }
      }

      const prices = responseData?.prices

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
      if (isAxiosError(error)) {
        const status = error.response?.status
        const details = JSON.stringify(error.response?.data)
        this.logger.error(
          `Failed to fetch crypto quote from CoinGecko for coin: ${ticker} [Status: ${status}] Details: ${details}`
        )
      } else {
        this.logger.error(
          `Failed to fetch crypto quote from CoinGecko for coin: ${ticker}`,
          error instanceof Error ? error.message : error
        )
      }
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
