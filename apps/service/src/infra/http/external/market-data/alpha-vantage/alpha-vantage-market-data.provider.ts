import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

import {
  MarketDataProvider,
  MarketQuote
} from '@/core/http/external/market-data/market-data.provider'
import { EnvService } from '@/infra/env/env.service'

interface AlphaVantageDailyEntry {
  '4. close': string
}

interface AlphaVantageResponse {
  'Time Series (Daily)': Record<string, AlphaVantageDailyEntry>
}

@Injectable()
export class AlphaVantageMarketDataProvider implements MarketDataProvider {
  private readonly logger = new Logger(AlphaVantageMarketDataProvider.name)
  private readonly baseUrl = 'https://www.alphavantage.co/query'

  private readonly ALPHA_VANTAGE_API_KEY: string

  constructor(
    private readonly httpService: HttpService,
    private readonly env: EnvService
  ) {
    this.ALPHA_VANTAGE_API_KEY = this.env.get('ALPHA_VANTAGE_API_KEY')
  }

  async fetchQuote(ticker: string): Promise<MarketQuote | null> {
    try {
      if (!this.ALPHA_VANTAGE_API_KEY) {
        this.logger.warn(
          'ALPHA_VANTAGE_API_KEY is required for US stock quotes. Skipping.'
        )
        return null
      }

      this.logger.log(
        `Fetching US stock quote for ${ticker} from Alpha Vantage...`
      )

      const { data } = await firstValueFrom(
        this.httpService.get<AlphaVantageResponse>(this.baseUrl, {
          params: {
            function: 'TIME_SERIES_DAILY',
            symbol: ticker,
            outputsize: 'compact',
            apikey: this.ALPHA_VANTAGE_API_KEY
          }
        })
      )

      const timeSeries = data?.['Time Series (Daily)']

      if (!timeSeries) {
        const note =
          (data as unknown as Record<string, unknown>).Note ??
          (data as unknown as Record<string, unknown>).Information

        if (note) {
          this.logger.warn(
            `Alpha Vantage rate limit hit for ticker: ${ticker} — ${note}`
          )
        } else {
          this.logger.warn(
            `No time series data returned from Alpha Vantage for ticker: ${ticker}`,
            data ? JSON.stringify(Object.keys(data)) : 'empty response'
          )
        }

        return null
      }

      const sortedDates = Object.keys(timeSeries).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      )

      if (sortedDates.length === 0) {
        this.logger.warn(
          `Empty time series from Alpha Vantage for ticker: ${ticker}`
        )
        return null
      }

      const currentPrice = parseFloat(timeSeries[sortedDates[0]]['4. close'])

      const lastMonthPrice = this.extractLastMonthClosePrice(
        timeSeries,
        sortedDates
      )

      this.logger.log(
        `Alpha Vantage quote for ${ticker}: current=${currentPrice}, lastMonth=${lastMonthPrice}`
      )

      return {
        currentPrice,
        lastMonthPrice: lastMonthPrice ?? currentPrice
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch quote from Alpha Vantage for ticker: ${ticker}`,
        error instanceof Error ? error.message : error
      )
      return null
    }
  }

  private extractLastMonthClosePrice(
    timeSeries: Record<string, AlphaVantageDailyEntry>,
    sortedDates: string[]
  ): number | null {
    const now = new Date()
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1)
    const previousMonthNum = previousMonth.getMonth()
    const previousMonthYear = previousMonth.getFullYear()

    const previousMonthDates = sortedDates.filter((dateStr) => {
      const date = new Date(dateStr)
      return (
        date.getMonth() === previousMonthNum &&
        date.getFullYear() === previousMonthYear
      )
    })

    if (previousMonthDates.length > 0) {
      return parseFloat(timeSeries[previousMonthDates[0]]['4. close'])
    }

    return null
  }
}
