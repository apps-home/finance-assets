import { monthIndex } from '@/core/utils/month'
import type {
  BenchmarkReturnRecord,
  BenchmarkReturnRepository
} from '@/modules/performance/domain/benchmark-return.repository'

export class InMemoryBenchmarkReturnRepository
  implements BenchmarkReturnRepository
{
  public items: BenchmarkReturnRecord[] = []

  async list({
    from,
    to
  }: {
    from: { year: number; month: number }
    to: { year: number; month: number }
  }): Promise<BenchmarkReturnRecord[]> {
    return this.items.filter(
      (item) =>
        monthIndex(item) >= monthIndex(from) &&
        monthIndex(item) <= monthIndex(to)
    )
  }

  async upsertMany(records: BenchmarkReturnRecord[]): Promise<void> {
    for (const record of records) {
      const index = this.items.findIndex(
        (item) =>
          item.benchmark === record.benchmark &&
          item.year === record.year &&
          item.month === record.month
      )

      if (index >= 0) {
        this.items[index] = record
      } else {
        this.items.push(record)
      }
    }
  }
}
