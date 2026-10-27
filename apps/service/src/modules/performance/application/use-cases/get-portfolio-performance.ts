import { Injectable } from '@nestjs/common'

import { BenchmarkType } from '@/core/http/external/benchmark/benchmark-data.gateway'
import { Either, right } from '@/core/utils/Either'
import { type MonthRef, monthIndex } from '@/core/utils/month'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'
import { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'
import { Budget } from '@/modules/budgets/domain/budget.entity'
import { BudgetRepository } from '@/modules/budgets/domain/budget.repository'

import { BenchmarkReturnRepository } from '../../domain/benchmark-return.repository'
import { CATEGORY_BENCHMARK } from '../../domain/category-benchmark'
import {
  type BenchmarkedPeriod,
  buildPerformance,
  buildPortfolioReturns,
  type MonthlyReturn,
  type PerformanceResult,
  summarizeAgainstBenchmark
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

export interface CategoryPerformance {
  categoryId: string
  name: string
  type: CategoryType
  /** Saldo do mês mais recente da categoria, em R$ */
  latestAmount: number
  benchmark: BenchmarkType
  periods: BenchmarkedPeriod[]
}

export interface PortfolioPerformance extends PerformanceResult {
  /** Uma linha por categoria do escopo, da maior para a menor */
  byCategory: CategoryPerformance[]
}

type GetPortfolioPerformanceResponse = Either<Error, PortfolioPerformance>

function toReturns(budgets: Budget[]): MonthlyReturn[] {
  // Valores já estão em R$ (amount é convertido na gravação). Aporte e
  // proventos são informados em R$ pelo usuário.
  return buildPortfolioReturns(
    budgets.map((budget) => ({
      categoryId: budget.categoryId,
      year: budget.year,
      month: budget.month,
      amount: budget.amount,
      contribution: budget.contributionAmount ?? 0,
      dividends: budget.dividendAmount ?? 0
    }))
  )
}

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
    const [allBudgets, allCategories] = await Promise.all([
      this.budgetRepository.list({ userId }),
      this.categoryRepository.list({ userId })
    ])

    const categories = allCategories.filter((category) =>
      isCategoryInScope(category.type, scope)
    )
    const categoryIds = new Set(categories.map((category) => category.id))
    const budgets = allBudgets.filter((budget) =>
      categoryIds.has(budget.categoryId)
    )

    const inRange = (item: MonthRef) =>
      (!from || monthIndex(item) >= monthIndex(from)) &&
      (!to || monthIndex(item) <= monthIndex(to))

    const portfolioReturns = toReturns(budgets).filter(inRange)

    // Cada categoria sozinha: um mês descartado na carteira consolidada (falta
    // registro de outra categoria) continua valendo para a própria categoria
    const categoryReturns = categories.flatMap((category) => {
      const own = budgets.filter((budget) => budget.categoryId === category.id)
      const returns = toReturns(own).filter(inRange)

      if (returns.length === 0) {
        return []
      }

      const latest = own.reduce((a, b) =>
        monthIndex(a) >= monthIndex(b) ? a : b
      )

      return [{ category, returns, latestAmount: latest.amount }]
    })

    const allMonths = [
      ...portfolioReturns,
      ...categoryReturns.flatMap((item) => item.returns)
    ]

    if (allMonths.length === 0) {
      return right({
        ...buildPerformance([], emptyBenchmarks()),
        byCategory: []
      })
    }

    const first = allMonths.reduce((a, b) =>
      monthIndex(a) <= monthIndex(b) ? a : b
    )
    const last = allMonths.reduce((a, b) =>
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

    const byCategory = categoryReturns
      .map(({ category, returns, latestAmount }) => {
        const benchmark = CATEGORY_BENCHMARK[category.type]

        return {
          categoryId: category.id,
          name: category.name,
          type: category.type,
          latestAmount,
          benchmark,
          periods: summarizeAgainstBenchmark(
            returns,
            byBenchmark(benchmark),
            last
          )
        }
      })
      .sort((a, b) => b.latestAmount - a.latestAmount)

    return right({
      ...buildPerformance(portfolioReturns, {
        cdi: byBenchmark(BenchmarkType.CDI),
        ibov: byBenchmark(BenchmarkType.IBOV),
        sp500: byBenchmark(BenchmarkType.SP500_BRL)
      }),
      byCategory
    })
  }
}

function emptyBenchmarks() {
  return { cdi: [], ibov: [], sp500: [] }
}
