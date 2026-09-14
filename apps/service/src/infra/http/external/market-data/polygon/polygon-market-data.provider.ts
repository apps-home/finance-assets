import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { isAxiosError } from 'axios'
import { firstValueFrom } from 'rxjs'

import {
  MarketDataProvider,
  MarketQuote
} from '@/core/http/external/market-data/market-data.provider'
import { EnvService } from '@/infra/env/env.service'

interface PolygonAggResult {
  c: number // Close price
  t: number // Unix millisecond timestamp
  v?: number
  o?: number
  h?: number
  l?: number
}

interface PolygonAggsResponse {
  ticker: string
  status: string
  queryCount?: number
  resultsCount?: number
  results?: PolygonAggResult[]
}

@Injectable()
export class PolygonMarketDataProvider implements MarketDataProvider {
  private readonly logger = new Logger(PolygonMarketDataProvider.name)
  private readonly baseUrl = 'https://api.polygon.io/v2/aggs/ticker'

  private readonly POLYGON_API_KEY: string

  constructor(
    private readonly httpService: HttpService,
    private readonly env: EnvService
  ) {
    this.POLYGON_API_KEY = this.env.get('POLYGON_API_KEY')
  }

  async fetchQuote(ticker: string): Promise<MarketQuote | null> {
    try {
      if (!this.POLYGON_API_KEY) {
        this.logger.warn(
          'POLYGON_API_KEY is not configured for US stock quotes. Skipping Polygon.'
        )
        return null
      }

      this.logger.log(
        `Fetching US stock quote for ${ticker} from Polygon.io...`
      )

      const now = new Date()
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

      const toDate = now.toISOString().split('T')[0]
      const fromDate = ninetyDaysAgo.toISOString().split('T')[0]

      const url = `${this.baseUrl}/${encodeURIComponent(ticker.toUpperCase())}/range/1/day/${fromDate}/${toDate}`

      const { data } = await firstValueFrom(
        this.httpService.get<PolygonAggsResponse>(url, {
          params: {
            adjusted: 'true',
            sort: 'desc',
            limit: 120
          },
          headers: {
            Authorization: `Bearer ${this.POLYGON_API_KEY}`
          }
        })
      )

      const results = data?.results

      if (!results || results.length === 0) {
        this.logger.warn(
          `No aggregate price data returned from Polygon.io for ticker: ${ticker}`
        )
        return null
      }

      // Since results are sorted descending, results[0] is the most recent daily close
      const currentPrice = results[0].c
      const lastMonthPrice = this.extractLastMonthClosePrice(results)

      this.logger.log(
        `Polygon quote for ${ticker}: current=${currentPrice}, lastMonth=${lastMonthPrice}`
      )

      return {
        currentPrice,
        lastMonthPrice: lastMonthPrice ?? currentPrice
      }
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status
        if (status === 429) {
          this.logger.warn(
            `Polygon.io rate limit reached (429 - max 5 req/min) for ticker: ${ticker}.`
          )
        } else {
          this.logger.error(
            `Polygon.io API error for ticker ${ticker} [Status: ${status}]: ${JSON.stringify(error.response?.data)}`
          )
        }
      } else {
        this.logger.error(
          `Failed to fetch quote from Polygon.io for ticker: ${ticker}`,
          error instanceof Error ? error.message : error
        )
      }

      return null
    }
  }

  private extractLastMonthClosePrice(
    results: PolygonAggResult[]
  ): number | null {
    const now = new Date()
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1)
    const previousMonthNum = previousMonth.getMonth()
    const previousMonthYear = previousMonth.getFullYear()

    const previousMonthEntries = results
      .filter((entry) => {
        const entryDate = new Date(entry.t)
        return (
          entryDate.getMonth() === previousMonthNum &&
          entryDate.getFullYear() === previousMonthYear
        )
      })
      .sort((a, b) => b.t - a.t)

    if (previousMonthEntries.length > 0) {
      return previousMonthEntries[0].c
    }

    return null
  }
}
