import { makeBudget } from '@test/factories/make-budget'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryBenchmarkReturnRepository } from '@test/repositories/in-memory-benchmark-return.repository'
import { InMemoryBudgetRepository } from '@test/repositories/in-memory-budget.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  type BenchmarkDataGateway,
  BenchmarkType
} from '@/core/http/external/benchmark/benchmark-data.gateway'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { GetPortfolioPerformanceUseCase } from './get-portfolio-performance'
import { SyncBenchmarksUseCase } from './sync-benchmarks'

describe('GetPortfolioPerformanceUseCase', () => {
  let categoryRepository: InMemoryCategoryRepository
  let budgetRepository: InMemoryBudgetRepository
  let benchmarkRepository: InMemoryBenchmarkReturnRepository
  let fetchMonthlyReturns: ReturnType<typeof vi.fn>
  let useCase: GetPortfolioPerformanceUseCase

  function addBudget(
    userId: string,
    categoryId: string,
    month: number,
    amount: number,
    extra: { contributionAmount?: number; dividendAmount?: number } = {}
  ) {
    budgetRepository.items.push(
      makeBudget({ categoryId, year: 2026, month, amount, ...extra })
    )
    return userId
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-25T12:00:00Z'))

    categoryRepository = new InMemoryCategoryRepository()
    budgetRepository = new InMemoryBudgetRepository(categoryRepository)
    benchmarkRepository = new InMemoryBenchmarkReturnRepository()
    // Providers fora do ar: a consulta deve seguir com o que há no banco
    fetchMonthlyReturns = vi.fn(async () => null)

    useCase = new GetPortfolioPerformanceUseCase(
      budgetRepository,
      categoryRepository,
      benchmarkRepository,
      new SyncBenchmarksUseCase(benchmarkRepository, {
        fetchMonthlyReturns
      } as unknown as BenchmarkDataGateway)
    )

    categoryRepository.items.push(
      makeCategory({ id: 'cat-1', userId: 'user-1', years: [2026] }),
      makeCategory({ id: 'cat-2', userId: 'user-2', years: [2026] })
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return an empty result when there are no records', async () => {
    const result = await useCase.execute('user-1')

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({ series: [], periods: [], betaIbov: null })
  })

  it('should not count contributions as return', async () => {
    addBudget('user-1', 'cat-1', 1, 1000)
    // 1000 -> 1600 com 500 de aporte: ganho de 100 sobre 1250 = 8%
    addBudget('user-1', 'cat-1', 2, 1600, { contributionAmount: 500 })

    const result = await useCase.execute('user-1')
    const { series, periods } = result.value as {
      series: Array<{ month: number; portfolio: number }>
      periods: Array<{ period: string; portfolio: number }>
    }

    expect(series.map((point) => point.month)).toEqual([1, 2])
    expect(series[1].portfolio).toBeCloseTo(8)
    expect(periods.find((p) => p.period === 'all')?.portfolio).toBeCloseTo(8)
  })

  it('should add the dividends to the return', async () => {
    addBudget('user-1', 'cat-1', 1, 1000)
    addBudget('user-1', 'cat-1', 2, 1000, { dividendAmount: 10 })

    const result = await useCase.execute('user-1')

    expect(
      (result.value as { series: Array<{ portfolio: number }> }).series[1]
        .portfolio
    ).toBeCloseTo(1)
  })

  it('should ignore the records of other users', async () => {
    addBudget('user-2', 'cat-2', 1, 1000)
    addBudget('user-2', 'cat-2', 2, 5000)

    const result = await useCase.execute('user-1')

    expect((result.value as { series: unknown[] }).series).toEqual([])
  })

  it('should compare against the stored benchmarks and compute the alpha', async () => {
    addBudget('user-1', 'cat-1', 1, 1000)
    addBudget('user-1', 'cat-1', 2, 1100)
    await benchmarkRepository.upsertMany([
      { benchmark: BenchmarkType.CDI, year: 2026, month: 2, returnPct: 1 },
      { benchmark: BenchmarkType.IBOV, year: 2026, month: 2, returnPct: -2 }
    ])

    const result = await useCase.execute('user-1')
    const { series, periods } = result.value as {
      series: Array<{
        cdi: number | null
        ibov: number | null
        sp500: number | null
      }>
      periods: Array<{
        period: string
        alphaCdi: number | null
        alphaIbov: number | null
        alphaSp500: number | null
      }>
    }

    expect(series[1].cdi).toBeCloseTo(1)
    expect(series[1].ibov).toBeCloseTo(-2)
    expect(series[1].sp500).toBeNull()

    const all = periods.find((p) => p.period === 'all')

    expect(all?.alphaCdi).toBeCloseTo(9)
    expect(all?.alphaIbov).toBeCloseTo(12)
    expect(all?.alphaSp500).toBeNull()
  })

  it('should backfill the missing benchmarks on demand', async () => {
    addBudget('user-1', 'cat-1', 1, 1000)
    addBudget('user-1', 'cat-1', 2, 1100)

    await useCase.execute('user-1')

    expect(fetchMonthlyReturns).toHaveBeenCalledTimes(3)
    expect(fetchMonthlyReturns).toHaveBeenCalledWith(BenchmarkType.CDI, {
      year: 2026,
      month: 2
    })
  })

  describe('scope', () => {
    beforeEach(() => {
      categoryRepository.items.push(
        makeCategory({
          id: 'cat-fixed',
          userId: 'user-1',
          type: CategoryType.FIXED,
          years: [2026]
        }),
        makeCategory({
          id: 'cat-stocks',
          userId: 'user-1',
          type: CategoryType.VARIABLE_BR,
          years: [2026]
        })
      )

      // Renda fixa rende 1%/mês e renda variável 10%/mês
      for (const [month, fixed, stocks] of [
        [1, 1000, 1000],
        [2, 1010, 1100]
      ] as const) {
        addBudget('user-1', 'cat-fixed', month, fixed)
        addBudget('user-1', 'cat-stocks', month, stocks)
      }
    })

    function portfolioOf(result: { value: unknown }) {
      return (result.value as { series: Array<{ portfolio: number }> })
        .series[1].portfolio
    }

    it('should use every category by default', async () => {
      // 2000 -> 2110: 5,5%
      expect(portfolioOf(await useCase.execute('user-1'))).toBeCloseTo(5.5)
    })

    it('should consider only variable income', async () => {
      expect(
        portfolioOf(await useCase.execute('user-1', { scope: 'variable' }))
      ).toBeCloseTo(10)
    })

    it('should consider only fixed income', async () => {
      expect(
        portfolioOf(await useCase.execute('user-1', { scope: 'fixed' }))
      ).toBeCloseTo(1)
    })

    it('should return an empty result when the scope has no records', async () => {
      categoryRepository.items = categoryRepository.items.filter(
        (category) => category.type !== CategoryType.FIXED
      )
      budgetRepository.items = budgetRepository.items.filter(
        (budget) => budget.categoryId !== 'cat-fixed'
      )

      const result = await useCase.execute('user-1', { scope: 'fixed' })

      expect((result.value as { series: unknown[] }).series).toEqual([])
    })
  })

  it('should respect the from and to filters', async () => {
    addBudget('user-1', 'cat-1', 1, 1000)
    addBudget('user-1', 'cat-1', 2, 1100)
    addBudget('user-1', 'cat-1', 3, 1210)

    const result = await useCase.execute('user-1', {
      from: { year: 2026, month: 3 },
      to: { year: 2026, month: 3 }
    })
    const { series } = result.value as { series: Array<{ month: number }> }

    // Ponto base (fev) + março
    expect(series.map((point) => point.month)).toEqual([2, 3])
  })
})
