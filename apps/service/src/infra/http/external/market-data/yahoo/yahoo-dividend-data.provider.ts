import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

import {
  DividendDataProvider,
  ExternalDividend
} from '@/core/http/external/market-data/dividend-data.provider'

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      events?: {
        dividends?: Record<string, { amount?: number; date?: number }>
      }
    }> | null
  }
}

/**
 * Yahoo Finance (`/v8/finance/chart/{ticker}.SA?events=div`), gratuito e sem
 * chave. Atende Ações BR e FIIs, já que o dividendo da Brapi exige plano pago.
 *
 * O Yahoo só informa a data EX (não a de pagamento) e não distingue JCP de
 * dividendo, então a data EX é usada como COM e como pagamento (aproximação:
 * o pagamento real costuma cair dias depois). Tickers terminados em 11 são
 * tratados como rendimento de FII (INCOME); os demais, como dividendo.
 */
@Injectable()
export class YahooDividendDataProvider implements DividendDataProvider {
  private readonly logger = new Logger(YahooDividendDataProvider.name)
  private readonly baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart'

  constructor(private readonly httpService: HttpService) {}

  async fetchDividends(ticker: string): Promise<ExternalDividend[] | null> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<YahooChartResponse>(
          `${this.baseUrl}/${encodeURIComponent(`${ticker}.SA`)}`,
          {
            params: { range: '2y', interval: '3mo', events: 'div' },
            headers: { 'User-Agent': 'Mozilla/5.0' }
          }
        )
      )

      const dividends = data?.chart?.result?.[0]?.events?.dividends ?? {}
      const type = ticker.endsWith('11') ? 'INCOME' : 'DIVIDEND'

      return Object.values(dividends).flatMap((item) => {
        const rateAmount = Number(item.amount)

        if (!item.date || !Number.isFinite(rateAmount) || rateAmount <= 0) {
          return []
        }

        const date = new Date(item.date * 1000)

        return [{ type, rateAmount, comDate: date, paymentDate: date }]
      })
    } catch (error) {
      this.logger.error(
        `Failed to fetch dividends from Yahoo for ticker: ${ticker}`,
        error instanceof Error ? error.message : error
      )
      return null
    }
  }
}
