import { makeAsset } from '@test/factories/make-asset'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { InMemoryIndicatorRateRepository } from '@test/repositories/in-memory-indicator-rate.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  EconomicIndicator,
  type IndicatorDataGateway,
  type IndicatorRate
} from '@/core/http/external/indicators/indicator-data.gateway'
import { addDaysUtc } from '@/core/utils/utc-date'
import { SyncIndicatorRatesUseCase } from '@/modules/indicators/application/use-cases/sync-indicator-rates'

import type { AssetProps } from '../../domain/asset.entity'
import { FixedIncomeIndexer } from '../../domain/fixed-income-valuation'
import { RevalueFixedIncomeUseCase } from './revalue-fixed-income'

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

describe('RevalueFixedIncomeUseCase', () => {
  let categoryRepository: InMemoryCategoryRepository
  let assetRepository: InMemoryAssetRepository
  let indicatorRepository: InMemoryIndicatorRateRepository
  let fetchRates: ReturnType<typeof vi.fn>
  let sut: RevalueFixedIncomeUseCase
  const now = new Date('2026-10-12T15:00:00Z')

  beforeEach(async () => {
    categoryRepository = new InMemoryCategoryRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)
    indicatorRepository = new InMemoryIndicatorRateRepository()
    // O banco já tem o CDI: o provider não deve ser necessário
    fetchRates = vi.fn(async () => [])
    sut = new RevalueFixedIncomeUseCase(
      assetRepository,
      indicatorRepository,
      new SyncIndicatorRatesUseCase(indicatorRepository, {
        fetchRates
      } as unknown as IndicatorDataGateway)
    )

    // CDI de 0,05% ao dia nos dias úteis de 01/10 a 09/10
    const rates: IndicatorRate[] = []
    for (
      let date = day('2026-10-01');
      date <= day('2026-10-09');
      date = addDaysUtc(date, 1)
    ) {
      if (date.getUTCDay() % 6 !== 0) rates.push({ date, ratePct: 0.05 })
    }
    await indicatorRepository.saveMany(EconomicIndicator.CDI, rates)
  })

  async function seedFixedIncome(overrides: Partial<AssetProps>) {
    const category = makeCategory({ userId: 'user-1' })
    await categoryRepository.save(category)

    const asset = makeAsset({
      categoryId: category.id,
      ticker: '',
      quantity: 1,
      averagePrice: 1000,
      currentClosePrice: 1000,
      ...overrides
    })
    await assetRepository.save(asset)

    return asset
  }

  it('should value a CDB at a percentage of the CDI', async () => {
    const asset = await seedFixedIncome({
      indexer: FixedIncomeIndexer.CDI,
      indexerRate: 100,
      investedAt: day('2026-10-05')
    })

    const result = await sut.execute([asset], now)

    expect(result).toEqual({ updated: 1, skipped: 0 })
    // 5 dias úteis (05 a 09/10) a 0,05%
    expect(assetRepository.items[0].currentClosePrice).toBeCloseTo(
      1000 * 1.0005 ** 5,
      4
    )
  })

  it('should keep the previous balance without CDI coverage', async () => {
    const asset = await seedFixedIncome({
      indexer: FixedIncomeIndexer.CDI,
      indexerRate: 100,
      investedAt: day('2026-08-03')
    })

    const result = await sut.execute([asset], now)

    expect(result).toEqual({ updated: 0, skipped: 1 })
    expect(assetRepository.items[0].currentClosePrice).toBe(1000)
  })

  it('should ignore fixed income with a manual balance', async () => {
    const asset = await seedFixedIncome({ currentClosePrice: 1234 })

    const result = await sut.execute([asset], now)

    expect(result).toEqual({ updated: 0, skipped: 0 })
    expect(fetchRates).not.toHaveBeenCalled()
  })

  it('should revalue every active indexed asset for the cron', async () => {
    await seedFixedIncome({
      indexer: FixedIncomeIndexer.PRE,
      indexerRate: 12,
      investedAt: day('2026-10-05')
    })
    await seedFixedIncome({
      indexer: FixedIncomeIndexer.CDI,
      indexerRate: 100,
      investedAt: day('2026-10-05'),
      isActive: false
    })

    const result = await sut.executeForAll(now)

    expect(result).toEqual({ updated: 1, skipped: 0 })
  })
})
