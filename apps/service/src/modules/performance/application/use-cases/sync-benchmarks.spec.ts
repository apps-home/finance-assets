import { InMemoryBenchmarkReturnRepository } from '@test/repositories/in-memory-benchmark-return.repository'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  type BenchmarkDataGateway,
  type BenchmarkMonthlyReturn,
  BenchmarkType
} from '@/core/http/external/benchmark/benchmark-data.gateway'

import { SyncBenchmarksUseCase } from './sync-benchmarks'

const HOUR = 60 * 60 * 1000
const BENCHMARKS = Object.values(BenchmarkType).length

function monthly(months: number[], returnPct = 1): BenchmarkMonthlyReturn[] {
  return months.map((month) => ({ year: 2026, month, returnPct }))
}

describe('SyncBenchmarksUseCase', () => {
  let repository: InMemoryBenchmarkReturnRepository
  let fetchMonthlyReturns: ReturnType<typeof vi.fn>
  let useCase: SyncBenchmarksUseCase

  beforeEach(() => {
    // Mês corrente: outubro/2026 -> último mês fechado: setembro
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-25T12:00:00Z'))

    repository = new InMemoryBenchmarkReturnRepository()
    fetchMonthlyReturns = vi.fn(async () => monthly([7, 8, 9]))
    useCase = new SyncBenchmarksUseCase(repository, {
      fetchMonthlyReturns
    } as unknown as BenchmarkDataGateway)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('execute', () => {
    it('should store the returns of every benchmark', async () => {
      await useCase.execute({ year: 2026, month: 7 })

      expect(fetchMonthlyReturns).toHaveBeenCalledTimes(BENCHMARKS)
      expect(repository.items).toHaveLength(BENCHMARKS * 3)
      expect(repository.items.map((item) => item.benchmark)).toEqual(
        expect.arrayContaining(Object.values(BenchmarkType))
      )
    })

    it('should be idempotent', async () => {
      await useCase.execute({ year: 2026, month: 7 })
      await useCase.execute({ year: 2026, month: 7 })

      expect(repository.items).toHaveLength(BENCHMARKS * 3)
    })

    it('should skip a benchmark whose provider failed', async () => {
      fetchMonthlyReturns.mockImplementation(async (benchmark) =>
        benchmark === BenchmarkType.IBOV ? null : monthly([7, 8, 9])
      )

      await useCase.execute({ year: 2026, month: 7 })

      expect(repository.items).toHaveLength((BENCHMARKS - 1) * 3)
      expect(
        repository.items.some((item) => item.benchmark === BenchmarkType.IBOV)
      ).toBe(false)
    })
  })

  describe('ensureCovered', () => {
    it('should backfill when nothing is stored', async () => {
      await useCase.ensureCovered({ year: 2026, month: 7 })

      expect(fetchMonthlyReturns).toHaveBeenCalledTimes(BENCHMARKS)
      expect(repository.items).toHaveLength(BENCHMARKS * 3)
    })

    it('should not call the providers when the range is covered', async () => {
      await useCase.execute({ year: 2026, month: 7 })
      fetchMonthlyReturns.mockClear()

      await useCase.ensureCovered({ year: 2026, month: 7 })

      expect(fetchMonthlyReturns).not.toHaveBeenCalled()
    })

    it('should only fetch the benchmarks that have gaps', async () => {
      await repository.upsertMany(
        Object.values(BenchmarkType)
          .filter((benchmark) => benchmark !== BenchmarkType.SP500_BRL)
          .flatMap((benchmark) =>
            monthly([7, 8, 9]).map((item) => ({ ...item, benchmark }))
          )
      )

      await useCase.ensureCovered({ year: 2026, month: 7 })

      expect(fetchMonthlyReturns).toHaveBeenCalledTimes(1)
      expect(fetchMonthlyReturns).toHaveBeenCalledWith(
        BenchmarkType.SP500_BRL,
        { year: 2026, month: 7 }
      )
    })

    it('should do nothing when the start is after the last closed month', async () => {
      await useCase.ensureCovered({ year: 2026, month: 10 })

      expect(fetchMonthlyReturns).not.toHaveBeenCalled()
    })

    it('should wait for the cooldown before retrying a failed provider', async () => {
      fetchMonthlyReturns.mockResolvedValue(null)
      const now = Date.now()

      await useCase.ensureCovered({ year: 2026, month: 7 }, now)
      expect(fetchMonthlyReturns).toHaveBeenCalledTimes(BENCHMARKS)

      await useCase.ensureCovered({ year: 2026, month: 7 }, now + 10 * 60_000)
      expect(fetchMonthlyReturns).toHaveBeenCalledTimes(BENCHMARKS)

      await useCase.ensureCovered({ year: 2026, month: 7 }, now + HOUR + 1)
      expect(fetchMonthlyReturns).toHaveBeenCalledTimes(BENCHMARKS * 2)
    })

    it('should not throw when the repository fails', async () => {
      vi.spyOn(repository, 'upsertMany').mockRejectedValue(new Error('db down'))

      await expect(
        useCase.ensureCovered({ year: 2026, month: 7 })
      ).resolves.toBeUndefined()
    })
  })
})
