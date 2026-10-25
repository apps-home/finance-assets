import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

import {
  PriceHistoryGateway,
  type PriceHistoryRange,
  type PricePoint
} from '@/core/http/external/market-data/price-history.gateway'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[]
      indicators?: { quote?: Array<{ close?: Array<number | null> }> }
    }> | null
  }
}

interface YahooQuery {
  range: string
  interval: string
  /** Quando o Yahoo não tem o período, corta os pontos mais antigos */
  sinceYears?: number
}

// O Yahoo não tem 3 anos: pede 5 anos e corta no servidor
const QUERY_BY_RANGE: Record<PriceHistoryRange, YahooQuery> = {
  '5d': { range: '5d', interval: '30m' },
  '1m': { range: '1mo', interval: '1d' },
  ytd: { range: 'ytd', interval: '1d' },
  '1y': { range: '1y', interval: '1d' },
  '3y': { range: '5y', interval: '1wk', sinceYears: 3 },
  '5y': { range: '5y', interval: '1wk' }
}

const CACHE_TTL_MS = 15 * 60 * 1000

/**
 * Yahoo Finance (`/v8/finance/chart/{ticker}`), gratuito e sem chave. Mantém um
 * cache em memória por ticker + período para não repetir a mesma consulta a
 * cada abertura do gráfico.
 */
@Injectable()
export class YahooPriceHistoryProvider implements PriceHistoryGateway {
  private readonly logger = new Logger(YahooPriceHistoryProvider.name)
  private readonly baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart'
  private readonly cache = new Map<
    string,
    { expiresAt: number; points: PricePoint[] }
  >()

  constructor(private readonly httpService: HttpService) {}

  async fetchHistory(
    ticker: string,
    categoryType: CategoryType,
    range: PriceHistoryRange
  ): Promise<PricePoint[] | null> {
    const symbol = toYahooSymbol(ticker, categoryType)

    if (!symbol) return null

    const key = `${symbol}|${range}`
    const cached = this.cache.get(key)

    if (cached && cached.expiresAt > Date.now()) {
      return cached.points
    }

    const { sinceYears, ...params } = QUERY_BY_RANGE[range]

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<YahooChartResponse>(
          `${this.baseUrl}/${encodeURIComponent(symbol)}`,
          { params, headers: { 'User-Agent': 'Mozilla/5.0' } }
        )
      )

      const result = data?.chart?.result?.[0]
      const timestamps = result?.timestamp ?? []
      const closes = result?.indicators?.quote?.[0]?.close ?? []

      const limit = sinceYears
        ? Date.now() - sinceYears * 365.25 * 24 * 60 * 60 * 1000
        : null

      const points = timestamps.flatMap((timestamp, index) => {
        const close = closes[index]
        const date = new Date(timestamp * 1000)

        if (close == null || !Number.isFinite(close)) return []
        if (limit !== null && date.getTime() < limit) return []

        return [{ date, close }]
      })

      if (points.length === 0) return null

      this.cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, points })

      return points
    } catch (error) {
      this.logger.error(
        `Failed to fetch price history from Yahoo for ticker: ${ticker}`,
        error instanceof Error ? error.message : error
      )
      return null
    }
  }
}

function toYahooSymbol(
  ticker: string,
  categoryType: CategoryType
): string | null {
  const symbol = ticker.trim().toUpperCase()

  if (!symbol) return null

  switch (categoryType) {
    case CategoryType.VARIABLE_BR:
    case CategoryType.FII:
      return `${symbol}.SA`

    // BRK.B → BRK-B
    case CategoryType.VARIABLE_US:
      return symbol.replace('.', '-')

    default:
      return null
  }
}
