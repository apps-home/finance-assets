import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

import {
  MarketDataProvider,
  MarketQuote
} from '@/core/http/external/market-data/market-data.provider'
import { EnvService } from '@/infra/env/env.service'

interface BrapiCryptoResult {
  regularMarketPrice?: number
  historicalDataPrice?: Array<{
    date: number
    close: number
  }>
}

interface BrapiCryptoResponse {
  coins: BrapiCryptoResult[]
}

@Injectable()
export class BrapiCryptoMarketDataProvider implements MarketDataProvider {
  private readonly logger = new Logger(BrapiCryptoMarketDataProvider.name)
  private readonly baseUrl = 'https://brapi.dev/api/v2/crypto'

  private readonly BRAPI_TOKEN: string

  constructor(
    private readonly httpService: HttpService,
    private readonly env: EnvService
  ) {
    this.BRAPI_TOKEN = this.env.get('BRAPI_TOKEN')
  }

  async fetchQuote(ticker: string): Promise<MarketQuote | null> {
    try {
      if (!this.BRAPI_TOKEN) {
        this.logger.warn('BRAPI_TOKEN is required for crypto quotes. Skipping.')
        return null
      }

      this.logger.log(`Fetching crypto quote for ${ticker} from Brapi...`)

      const { data } = await firstValueFrom(
        this.httpService.get<BrapiCryptoResponse>(this.baseUrl, {
          params: {
            coin: ticker,
            currency: 'BRL',
            range: '3mo',
            interval: '1d'
          },
          headers: {
            Authorization: `Bearer ${this.BRAPI_TOKEN}`
          }
        })
      )

      const result = data?.coins?.[0]

      if (!result) {
        this.logger.warn(
          `No results returned from Brapi crypto for coin: ${ticker}`
        )
        return null
      }

      const currentPrice = result.regularMarketPrice ?? null
      const lastMonthPrice = this.extractLastMonthClosePrice(
        result.historicalDataPrice
      )

      if (currentPrice === null) {
        this.logger.warn(
          `No current price available from Brapi crypto for coin: ${ticker}`
        )
        return null
      }

      this.logger.log(
        `Brapi crypto quote for ${ticker}: current=${currentPrice}, lastMonth=${lastMonthPrice}`
      )

      return {
        currentPrice,
        lastMonthPrice: lastMonthPrice ?? currentPrice
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch crypto quote from Brapi for coin: ${ticker}`,
        error instanceof Error ? error.message : error
      )
      return null
    }
  }

  private extractLastMonthClosePrice(
    historicalData?: Array<{ date: number; close: number }>
  ): number | null {
    if (!historicalData || historicalData.length === 0) {
      return null
    }

    const now = new Date()
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1)
    const previousMonthNum = previousMonth.getMonth()
    const previousMonthYear = previousMonth.getFullYear()

    const previousMonthEntries = historicalData
      .filter((entry) => {
        const entryDate = new Date(entry.date * 1000)
        return (
          entryDate.getMonth() === previousMonthNum &&
          entryDate.getFullYear() === previousMonthYear
        )
      })
      .sort((a, b) => b.date - a.date)

    if (previousMonthEntries.length > 0) {
      return previousMonthEntries[0].close
    }

    return null
  }
}
