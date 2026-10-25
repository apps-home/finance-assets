import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

import {
  BenchmarkMonthlyReturn,
  MonthKey
} from '@/core/http/external/benchmark/benchmark-data.gateway'
import { lastClosedMonth, monthIndex } from '@/core/utils/month'

interface BcbSeriesItem {
  /** dd/MM/yyyy (para séries mensais, o dia 01 do mês) */
  data: string
  valor: string
}

/**
 * CDI acumulado no mês (SGS 4391) do Banco Central, gratuito e sem chave.
 * A 4389 é a taxa anualizada e a 12 é diária; a 4391 já vem mensal.
 */
@Injectable()
export class BcbCdiBenchmarkProvider {
  private readonly logger = new Logger(BcbCdiBenchmarkProvider.name)
  private readonly url =
    'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4391/dados'

  constructor(private readonly httpService: HttpService) {}

  async fetchMonthlyReturns(
    since: MonthKey
  ): Promise<BenchmarkMonthlyReturn[] | null> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<BcbSeriesItem[]>(this.url, {
          params: {
            formato: 'json',
            dataInicial: `01/${String(since.month).padStart(2, '0')}/${since.year}`,
            dataFinal: this.formatToday()
          }
        })
      )

      const lastClosed = monthIndex(lastClosedMonth())

      return data.flatMap((item) => {
        const [, month, year] = item.data.split('/').map(Number)
        const returnPct = Number(item.valor)

        if (!month || !year || !Number.isFinite(returnPct)) {
          return []
        }

        // Ignora o mês corrente (série ainda parcial)
        return monthIndex({ year, month }) <= lastClosed
          ? [{ year, month, returnPct }]
          : []
      })
    } catch (error) {
      this.logger.error(
        'Failed to fetch CDI from BCB',
        error instanceof Error ? error.message : error
      )
      return null
    }
  }

  private formatToday(): string {
    const now = new Date()
    const day = String(now.getUTCDate()).padStart(2, '0')
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')

    return `${day}/${month}/${now.getUTCFullYear()}`
  }
}
