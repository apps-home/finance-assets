import type {
  EconomicIndicator,
  IndicatorRate
} from '@/core/http/external/indicators/indicator-data.gateway'
import type { IndicatorRateRepository } from '@/modules/indicators/domain/indicator-rate.repository'

export class InMemoryIndicatorRateRepository
  implements IndicatorRateRepository
{
  public items: Array<IndicatorRate & { indicator: EconomicIndicator }> = []

  async list(
    indicator: EconomicIndicator,
    from: Date,
    to: Date
  ): Promise<IndicatorRate[]> {
    return this.items
      .filter(
        (item) =>
          item.indicator === indicator && item.date >= from && item.date <= to
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ date, ratePct }) => ({ date, ratePct }))
  }

  async bounds(
    indicator: EconomicIndicator
  ): Promise<{ first: Date; last: Date } | null> {
    const dates = this.items
      .filter((item) => item.indicator === indicator)
      .map((item) => item.date.getTime())

    if (dates.length === 0) return null

    return {
      first: new Date(Math.min(...dates)),
      last: new Date(Math.max(...dates))
    }
  }

  async saveMany(
    indicator: EconomicIndicator,
    rates: IndicatorRate[]
  ): Promise<void> {
    for (const rate of rates) {
      const exists = this.items.some(
        (item) =>
          item.indicator === indicator &&
          item.date.getTime() === rate.date.getTime()
      )

      if (!exists) this.items.push({ ...rate, indicator })
    }
  }
}
