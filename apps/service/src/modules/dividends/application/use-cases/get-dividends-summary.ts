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
    // Histórico completo: alimenta o gráfico por ano, além do ano consultado
    // e dos últimos 12 meses.
    const items = await this.dividendRepository.list({ userId })

    const now = new Date()
    return right(buildDividendsSummary(items, year, now))
  }
}
