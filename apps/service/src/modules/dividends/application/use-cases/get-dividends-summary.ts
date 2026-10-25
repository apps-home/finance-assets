import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'

import { DividendRepository } from '../../domain/dividend.repository'
import {
  buildDividendsSummary,
  DividendsSummary
} from '../../domain/dividends-summary'

type GetDividendsSummaryResponse = Either<Error, DividendsSummary>

@Injectable()
export class GetDividendsSummaryUseCase {
  constructor(private readonly dividendRepository: DividendRepository) {}

  async execute(
    userId: string,
    year: number = new Date().getUTCFullYear()
  ): Promise<GetDividendsSummaryResponse> {
    // Janela mínima: do início do ano consultado ou dos últimos 12 meses
    // (o que for mais antigo), para alimentar o gráfico e o Yield on Cost.
    const now = new Date()
    const from = new Date(
      Math.min(
        Date.UTC(year, 0, 1),
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1)
      )
    )

    const items = await this.dividendRepository.list({ userId, from })

    return right(buildDividendsSummary(items, year, now))
  }
}
