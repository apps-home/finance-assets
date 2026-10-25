import { Injectable } from '@nestjs/common'

import { BenchmarkType } from '@/core/http/external/benchmark/benchmark-data.gateway'
import { Either, right } from '@/core/utils/Either'
import { type MonthRef, monthIndex } from '@/core/utils/month'
import { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'
import { BudgetRepository } from '@/modules/budgets/domain/budget.repository'

import { BenchmarkReturnRepository } from '../../domain/benchmark-return.repository'
import {
  buildPerformance,
  buildPortfolioReturns,
  type MonthlyReturn,
  type PerformanceResult
} from '../../domain/performance-calculator'
import {
  isCategoryInScope,
  type PerformanceScope
} from '../../domain/performance-scope'
import { SyncBenchmarksUseCase } from './sync-benchmarks'

export interface PortfolioPerformanceParams {
  from?: MonthRef
  to?: MonthRef
  /** Padrão: todas as categorias */
  scope?: PerformanceScope
}

type GetPortfolioPerformanceResponse = Either<Error, PerformanceResult>

@Injectable()
export class GetPortfolioPerformanceUseCase {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly benchmarkRepository: BenchmarkReturnRepository,
    private readonly syncBenchmarks: SyncBenchmarksUseCase
  ) {}

  async execute(
    userId: string,
    { from, to, scope = 'all' }: PortfolioPerformanceParams = {}
  ): Promise<GetPortfolioPerformanceResponse> {
    const [allBudgets, categories] = await Promise.all([
      this.budgetRepository.list({ userId }),
      this.categoryRepository.list({ userId })
    ])

    const categoryIdsInScope = new Set(
      categories
        .filter((category) => isCategoryInScope(category.type, scope))
        .map((category) => category.id)
    )
    const budgets = allBudgets.filter((budget) =>
      categoryIdsInScope.has(budget.categoryId)
    )

    // Valores já estão em R$ (amount é convertido na gravação). Aporte e
    // proventos são informados em R$ pelo usuário.
    const portfolioReturns = buildPortfolioReturns(
      budgets.map((budget) => ({
        categoryId: budget.categoryId,
        year: budget.year,
        month: budget.month,
        amount: budget.amount,
        contribution: budget.contributionAmount ?? 0,
        dividends: budget.dividendAmount ?? 0
      }))
    ).filter(
      (item) =>
        (!from || monthIndex(item) >= monthIndex(from)) &&
        (!to || monthIndex(item) <= monthIndex(to))
    )

    if (portfolioReturns.length === 0) {
      return right(buildPerformance([], { cdi: [], ibov: [], sp500: [] }))
    }

    const first = portfolioReturns.reduce((a, b) =>
      monthIndex(a) <= monthIndex(b) ? a : b
    )
    const last = portfolioReturns.reduce((a, b) =>
      monthIndex(a) >= monthIndex(b) ? a : b
    )

    await this.syncBenchmarks.ensureCovered({
      year: first.year,
      month: first.month
    })

    const stored = await this.benchmarkRepository.list({
      from: first,
      to: last
    })

    const byBenchmark = (benchmark: BenchmarkType): MonthlyReturn[] =>
      stored
        .filter((item) => item.benchmark === benchmark)
        .map((item) => ({
          year: item.year,
          month: item.month,
          value: item.returnPct
        }))

    return right(
      buildPerformance(portfolioReturns, {
        cdi: byBenchmark(BenchmarkType.CDI),
        ibov: byBenchmark(BenchmarkType.IBOV),
        sp500: byBenchmark(BenchmarkType.SP500_BRL)
      })
    )
  }
}
