import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { isAxiosError } from 'axios'
import { firstValueFrom } from 'rxjs'

import {
  DividendDataProvider,
  ExternalDividend
} from '@/core/http/external/market-data/dividend-data.provider'
import { EnvService } from '@/infra/env/env.service'

interface PolygonDividendResult {
  cash_amount?: number
  ex_dividend_date?: string | null
  pay_date?: string | null
}

interface PolygonDividendsResponse {
  results?: PolygonDividendResult[]
}

/** Polygon/Massive: `GET /stocks/v1/dividends?ticker=` (valores em USD). */
@Injectable()
export class PolygonDividendDataProvider implements DividendDataProvider {
  private readonly logger = new Logger(PolygonDividendDataProvider.name)
  private readonly url = 'https://api.polygon.io/stocks/v1/dividends'
  private readonly POLYGON_API_KEY: string

  constructor(
    private readonly httpService: HttpService,
    private readonly env: EnvService
  ) {
    this.POLYGON_API_KEY = this.env.get('POLYGON_API_KEY')
  }

  async fetchDividends(ticker: string): Promise<ExternalDividend[]> {
    if (!this.POLYGON_API_KEY) {
      this.logger.warn('POLYGON_API_KEY is not configured. Skipping dividends.')
      return []
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<PolygonDividendsResponse>(this.url, {
          params: {
            ticker: ticker.toUpperCase(),
            limit: 50,
            sort: 'ex_dividend_date.desc'
          },
          headers: { Authorization: `Bearer ${this.POLYGON_API_KEY}` }
        })
      )

      return (data?.results ?? []).flatMap((item) => {
        const paymentDate = parseDate(item.pay_date)
        const rateAmount = Number(item.cash_amount)

        if (!paymentDate || !Number.isFinite(rateAmount) || rateAmount <= 0) {
          return []
        }

        return [
          {
            type: 'DIVIDEND' as const,
            rateAmount,
            comDate: parseDate(item.ex_dividend_date),
            paymentDate
          }
        ]
      })
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 429) {
        this.logger.warn(
          `Polygon rate limit reached (429) fetching dividends for ${ticker}.`
        )
      } else {
        this.logger.error(
          `Failed to fetch dividends from Polygon for ticker: ${ticker}`,
          error instanceof Error ? error.message : error
        )
      }
      return []
    }
  }
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null

  const date = new Date(`${value}T00:00:00.000Z`)

  return Number.isNaN(date.getTime()) ? null : date
}
