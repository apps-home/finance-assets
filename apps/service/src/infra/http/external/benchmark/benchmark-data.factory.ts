import { Injectable } from '@nestjs/common'

import {
  BenchmarkDataGateway,
  BenchmarkMonthlyReturn,
  BenchmarkType,
  MonthKey
} from '@/core/http/external/benchmark/benchmark-data.gateway'

import { BcbCdiBenchmarkProvider } from './bcb-cdi-benchmark.provider'
import { YahooBenchmarkProvider } from './yahoo-benchmark.provider'

@Injectable()
export class BenchmarkDataFactory implements BenchmarkDataGateway {
  constructor(
    private readonly bcbProvider: BcbCdiBenchmarkProvider,
    private readonly yahooProvider: YahooBenchmarkProvider
  ) {}

  fetchMonthlyReturns(
    benchmark: BenchmarkType,
    since: MonthKey
  ): Promise<BenchmarkMonthlyReturn[] | null> {
    switch (benchmark) {
      case BenchmarkType.CDI:
        return this.bcbProvider.fetchMonthlyReturns(since)

      case BenchmarkType.IBOV:
      case BenchmarkType.SP500_BRL:
        return this.yahooProvider.fetchMonthlyReturns(benchmark, since)
    }
  }
}
