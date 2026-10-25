import {
  BenchmarkMonthlyReturn,
  BenchmarkType
} from '@/core/http/external/benchmark/benchmark-data.gateway'
import { MonthRef } from '@/core/utils/month'

export interface BenchmarkReturnRecord extends BenchmarkMonthlyReturn {
  benchmark: BenchmarkType
}

export abstract class BenchmarkReturnRepository {
  /** Retornos entre `from` e `to` (inclusive), de todos os benchmarks */
  abstract list(range: {
    from: MonthRef
    to: MonthRef
  }): Promise<BenchmarkReturnRecord[]>
  abstract upsertMany(records: BenchmarkReturnRecord[]): Promise<void>
}
