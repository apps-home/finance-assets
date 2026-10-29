import type { FinanceAssets } from '@lib/finance-assets-db'
import { Inject, Injectable } from '@nestjs/common'

import type {
  EconomicIndicator,
  IndicatorRate
} from '@/core/http/external/indicators/indicator-data.gateway'

import { IndicatorRateRepository } from '../../domain/indicator-rate.repository'

@Injectable()
export class PrismaIndicatorRateRepository implements IndicatorRateRepository {
  constructor(@Inject('prismaFinanceAssets') private prisma: FinanceAssets) {}

  async list(
    indicator: EconomicIndicator,
    from: Date,
    to: Date
  ): Promise<IndicatorRate[]> {
    const rows = await this.prisma.indicatorRate.findMany({
      where: { indicator, date: { gte: from, lte: to } },
      orderBy: { date: 'asc' }
    })

    return rows.map((row) => ({
      date: row.date,
      ratePct: Number(row.ratePct)
    }))
  }

  async bounds(
    indicator: EconomicIndicator
  ): Promise<{ first: Date; last: Date } | null> {
    const { _min, _max } = await this.prisma.indicatorRate.aggregate({
      where: { indicator },
      _min: { date: true },
      _max: { date: true }
    })

    if (!_min.date || !_max.date) return null

    return { first: _min.date, last: _max.date }
  }

  async saveMany(
    indicator: EconomicIndicator,
    rates: IndicatorRate[]
  ): Promise<void> {
    if (rates.length === 0) return

    await this.prisma.indicatorRate.createMany({
      data: rates.map((rate) => ({
        indicator,
        date: rate.date,
        ratePct: rate.ratePct
      })),
      skipDuplicates: true
    })
  }
}
