import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

import {
  DividendDataProvider,
  ExternalDividend,
  ExternalDividendType
} from '@/core/http/external/market-data/dividend-data.provider'
import { EnvService } from '@/infra/env/env.service'

interface BrapiCashDividend {
  paymentDate?: string | null
  rate?: number | null
  label?: string | null
  lastDatePrior?: string | null
}

interface BrapiDividendsResponse {
  results?: Array<{
    dividendsData?: { cashDividends?: BrapiCashDividend[] }
  }>
}

/**
 * Brapi: `GET /quote/{ticker}?dividends=true` → `results[0].dividendsData.cashDividends`.
 * Atende Ações BR e FIIs. FIIs vêm com label diferente de JCP, então tratamos
 * como rendimento (INCOME) quando o ativo é FII.
 */
@Injectable()
export class BrapiDividendDataProvider implements DividendDataProvider {
  private readonly logger = new Logger(BrapiDividendDataProvider.name)
  private readonly baseUrl = 'https://brapi.dev/api'
  private readonly BRAPI_TOKEN: string

  constructor(
    private readonly httpService: HttpService,
    private readonly env: EnvService
  ) {
    this.BRAPI_TOKEN = this.env.get('BRAPI_TOKEN')
  }

  async fetchDividends(ticker: string): Promise<ExternalDividend[]> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<BrapiDividendsResponse>(
          `${this.baseUrl}/quote/${encodeURIComponent(ticker)}`,
          {
            params: { dividends: true },
            headers: { Authorization: `Bearer ${this.BRAPI_TOKEN}` }
          }
        )
      )

      const cashDividends =
        data?.results?.[0]?.dividendsData?.cashDividends ?? []

      return cashDividends.flatMap((item) => {
        const paymentDate = parseBrapiDate(item.paymentDate)
        const rateAmount = Number(item.rate)

        if (!paymentDate || !Number.isFinite(rateAmount) || rateAmount <= 0) {
          return []
        }

        return [
          {
            type: toDividendType(item.label),
            rateAmount,
            comDate: parseBrapiDate(item.lastDatePrior),
            paymentDate
          }
        ]
      })
    } catch (error) {
      this.logger.error(
        `Failed to fetch dividends from Brapi for ticker: ${ticker}`,
        error instanceof Error ? error.message : error
      )
      return []
    }
  }
}

function toDividendType(label?: string | null): ExternalDividendType {
  const normalized = (label ?? '').toUpperCase()

  if (normalized.includes('JCP') || normalized.includes('JUROS')) return 'JCP'
  if (normalized.includes('DIVIDENDO')) return 'DIVIDEND'
  if (normalized.includes('RENDIMENTO')) return 'INCOME'

  return 'OTHER'
}

// A doc da Brapi não especifica o formato, então aceita ISO e DD/MM/YYYY
function parseBrapiDate(value?: string | null): Date | null {
  if (!value) return null

  const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  const date = br
    ? new Date(Date.UTC(Number(br[3]), Number(br[2]) - 1, Number(br[1])))
    : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}
