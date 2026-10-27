import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

import {
  EconomicIndicator,
  IndicatorDataGateway,
  IndicatorRate
} from '@/core/http/external/indicators/indicator-data.gateway'

interface BcbSeriesItem {
  /** dd/MM/yyyy */
  data: string
  valor: string
}

/** Intervalo sem dado: o SGS responde 200 com `{ erro: { statusCode: 404 } }` */
interface BcbErrorResponse {
  erro?: { statusCode?: number }
}

const SERIES: Record<EconomicIndicator, number> = {
  [EconomicIndicator.CDI]: 12,
  [EconomicIndicator.IPCA]: 433
}

/**
 * Séries do SGS do Banco Central, gratuitas e sem chave: CDI diário (12) e
 * IPCA mensal (433). A API é lenta e instável em intervalos longos, então o
 * chamador busca por partes e guarda o resultado.
 */
@Injectable()
export class BcbIndicatorProvider implements IndicatorDataGateway {
  private readonly logger = new Logger(BcbIndicatorProvider.name)

  constructor(private readonly httpService: HttpService) {}

  async fetchRates(
    indicator: EconomicIndicator,
    from: Date,
    to: Date
  ): Promise<IndicatorRate[] | null> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<BcbSeriesItem[] | BcbErrorResponse>(
          `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${SERIES[indicator]}/dados`,
          {
            params: {
              formato: 'json',
              dataInicial: formatDate(from),
              dataFinal: formatDate(to)
            }
          }
        )
      )

      if (!Array.isArray(data)) {
        if (data?.erro?.statusCode === 404) return []

        this.logger.warn(
          `Unexpected BCB response for ${indicator}: ${JSON.stringify(data)}`
        )
        return null
      }

      return data.flatMap((item) => {
        const [day, month, year] = item.data.split('/').map(Number)
        const ratePct = Number(item.valor)

        if (!day || !month || !year || !Number.isFinite(ratePct)) {
          return []
        }

        return [{ date: new Date(Date.UTC(year, month - 1, day)), ratePct }]
      })
    } catch (error) {
      this.logger.error(
        `Failed to fetch ${indicator} from BCB`,
        error instanceof Error ? error.message : error
      )
      return null
    }
  }
}

function formatDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')

  return `${day}/${month}/${date.getUTCFullYear()}`
}
