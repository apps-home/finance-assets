import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

import {
  MarketDataProvider,
  MarketQuote
} from '@/core/http/external/market-data/market-data.provider'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { toYahooSymbol } from './yahoo-price-history.provider'

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: { regularMarketPrice?: number }
      timestamp?: number[]
      indicators?: { quote?: Array<{ close?: Array<number | null> }> }
    }> | null
  }
}

/**
 * Cotação de ações US via Yahoo Finance (`/v8/finance/chart`), sem chave. Ao
 * contrário do plano gratuito do Polygon, já traz o fechamento do dia corrente.
 */
@Injectable()
export class YahooMarketDataProvider implements MarketDataProvider {
  private readonly logger = new Logger(YahooMarketDataProvider.name)
  private readonly baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart'

  constructor(private readonly httpService: HttpService) {}

  async fetchQuote(ticker: string): Promise<MarketQuote | null> {
    const symbol = toYahooSymbol(ticker, CategoryType.VARIABLE_US)

    if (!symbol) return null

    try {
      this.logger.log(`Fetching US stock quote for ${ticker} from Yahoo...`)

      const { data } = await firstValueFrom(
        this.httpService.get<YahooChartResponse>(
          `${this.baseUrl}/${encodeURIComponent(symbol)}`,
          {
            params: { range: '3mo', interval: '1d' },
            headers: { 'User-Agent': 'Mozilla/5.0' }
          }
        )
      )

      const result = data?.chart?.result?.[0]
      const timestamps = result?.timestamp ?? []
      const closes = result?.indicators?.quote?.[0]?.close ?? []

      const points = timestamps.flatMap((timestamp, index) => {
        const close = closes[index]

        if (close == null || !Number.isFinite(close)) return []

        return [{ date: new Date(timestamp * 1000), close }]
      })

      const marketPrice = result?.meta?.regularMarketPrice
      const currentPrice =
        marketPrice != null && Number.isFinite(marketPrice)
          ? marketPrice
          : points.at(-1)?.close

      if (currentPrice == null) {
        this.logger.warn(
          `No price data returned from Yahoo for ticker: ${ticker}`
        )
        return null
      }

      const lastMonthPrice = this.extractLastMonthClosePrice(points)

      this.logger.log(
        `Yahoo quote for ${ticker}: current=${currentPrice}, lastMonth=${lastMonthPrice}`
      )

      return {
        currentPrice,
        lastMonthPrice: lastMonthPrice ?? currentPrice
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch quote from Yahoo for ticker: ${ticker}`,
        error instanceof Error ? error.message : error
      )
      return null
    }
  }

  private extractLastMonthClosePrice(
    points: { date: Date; close: number }[]
  ): number | null {
    const now = new Date()
    const previousMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1)
    )

    const previousMonthPoints = points.filter(
      ({ date }) =>
        date.getUTCMonth() === previousMonth.getUTCMonth() &&
        date.getUTCFullYear() === previousMonth.getUTCFullYear()
    )

    return previousMonthPoints.at(-1)?.close ?? null
  }
}
