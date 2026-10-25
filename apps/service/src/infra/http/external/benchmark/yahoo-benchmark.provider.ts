import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

import {
  BenchmarkMonthlyReturn,
  BenchmarkType,
  MonthKey
} from '@/core/http/external/benchmark/benchmark-data.gateway'
import { addMonths, lastClosedMonth, monthIndex } from '@/core/utils/month'

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[]
      indicators?: { quote?: Array<{ close?: Array<number | null> }> }
    }> | null
  }
}

const SYMBOLS = {
  IBOV: '^BVSP',
  SP500: '^GSPC',
  USD_BRL: 'BRL=X'
} as const

/**
 * Cada barra mensal é carimbada no início do mês no fuso da bolsa: o dólar
 * (`BRL=X`, Londres) vem às 23:00 UTC do último dia do mês anterior no horário
 * de verão, e índices americanos às 04:00/05:00 UTC do dia 1º. Somar 12h leva
 * qualquer fuso entre UTC-12 e UTC+12 para dentro do mês certo.
 */
const MONTH_BAR_OFFSET_MS = 12 * 60 * 60 * 1000

/**
 * Yahoo Finance (gratuito, sem chave) para Ibovespa, S&P 500 e dólar.
 * Os índices são de preço (sem dividendos reinvestidos).
 */
@Injectable()
export class YahooBenchmarkProvider {
  private readonly logger = new Logger(YahooBenchmarkProvider.name)
  private readonly baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart'

  constructor(private readonly httpService: HttpService) {}

  async fetchMonthlyReturns(
    benchmark: BenchmarkType.IBOV | BenchmarkType.SP500_BRL,
    since: MonthKey
  ): Promise<BenchmarkMonthlyReturn[] | null> {
    try {
      if (benchmark === BenchmarkType.IBOV) {
        const closes = await this.fetchMonthlyCloses(SYMBOLS.IBOV, since)
        return this.toReturns(closes, since)
      }

      const [sp500, usdBrl] = await Promise.all([
        this.fetchMonthlyCloses(SYMBOLS.SP500, since),
        this.fetchMonthlyCloses(SYMBOLS.USD_BRL, since)
      ])

      // (1 + retorno em USD) × (1 + variação do dólar) − 1
      const fxReturns = new Map(
        this.toReturns(usdBrl, since).map((r) => [monthIndex(r), r.returnPct])
      )

      return this.toReturns(sp500, since).flatMap((r) => {
        const fx = fxReturns.get(monthIndex(r))

        if (fx === undefined) {
          return []
        }

        return [
          {
            year: r.year,
            month: r.month,
            returnPct: ((1 + r.returnPct / 100) * (1 + fx / 100) - 1) * 100
          }
        ]
      })
    } catch (error) {
      this.logger.error(
        `Failed to fetch ${benchmark} from Yahoo`,
        error instanceof Error ? error.message : error
      )
      return null
    }
  }

  /** Fechamento de cada mês, indexado por `monthIndex`. Inclui o mês anterior a `since` */
  private async fetchMonthlyCloses(
    symbol: string,
    since: MonthKey
  ): Promise<Map<number, number>> {
    const start = addMonths(since, -1)
    const period1 = Math.floor(Date.UTC(start.year, start.month - 1, 1) / 1000)

    const { data } = await firstValueFrom(
      this.httpService.get<YahooChartResponse>(
        `${this.baseUrl}/${encodeURIComponent(symbol)}`,
        {
          params: {
            period1,
            period2: Math.floor(Date.now() / 1000),
            interval: '1mo'
          },
          headers: { 'User-Agent': 'Mozilla/5.0' }
        }
      )
    )

    const result = data?.chart?.result?.[0]
    const timestamps = result?.timestamp ?? []
    const closes = result?.indicators?.quote?.[0]?.close ?? []
    const byMonth = new Map<number, number>()

    timestamps.forEach((ts, i) => {
      const close = closes[i]

      if (close == null || !Number.isFinite(close)) {
        return
      }

      const date = new Date(ts * 1000 + MONTH_BAR_OFFSET_MS)

      byMonth.set(
        monthIndex({
          year: date.getUTCFullYear(),
          month: date.getUTCMonth() + 1
        }),
        close
      )
    })

    return byMonth
  }

  private toReturns(
    closes: Map<number, number>,
    since: MonthKey
  ): BenchmarkMonthlyReturn[] {
    const first = monthIndex(since)
    const last = monthIndex(lastClosedMonth())
    const returns: BenchmarkMonthlyReturn[] = []

    for (let index = first; index <= last; index++) {
      const current = closes.get(index)
      const previous = closes.get(index - 1)

      if (current === undefined || previous === undefined || previous === 0) {
        continue
      }

      returns.push({
        year: Math.floor(index / 12),
        month: (index % 12) + 1,
        returnPct: (current / previous - 1) * 100
      })
    }

    return returns
  }
}
