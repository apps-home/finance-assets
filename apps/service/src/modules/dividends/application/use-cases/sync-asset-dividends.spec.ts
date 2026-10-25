import { makeAsset } from '@test/factories/make-asset'
import { makeBudget } from '@test/factories/make-budget'
import { makeCategory } from '@test/factories/make-category'
import { makeDividend } from '@test/factories/make-dividend'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryBudgetRepository } from '@test/repositories/in-memory-budget.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { InMemoryDividendRepository } from '@test/repositories/in-memory-dividend.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DividendDataGateway } from '@/core/http/external/market-data/dividend-data.gateway'
import {
  DividendDataProvider,
  ExternalDividend
} from '@/core/http/external/market-data/dividend-data.provider'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { DividendSource, DividendType } from '../../domain/dividend.entity'
import { SyncAssetDividendsUseCase } from './sync-asset-dividends'

class FakeDividendDataGateway extends DividendDataGateway {
  public dividends: ExternalDividend[] | null = []

  getProvider(): DividendDataProvider {
    return { fetchDividends: async () => this.dividends }
  }
}

const day = (value: string) => new Date(`${value}T00:00:00.000Z`)

describe('SyncAssetDividendsUseCase', () => {
  let dividendRepository: InMemoryDividendRepository
  let categoryRepository: InMemoryCategoryRepository
  let assetRepository: InMemoryAssetRepository
  let budgetRepository: InMemoryBudgetRepository
  let gateway: FakeDividendDataGateway
  let sut: SyncAssetDividendsUseCase

  beforeEach(() => {
    dividendRepository = new InMemoryDividendRepository()
    categoryRepository = new InMemoryCategoryRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)
    budgetRepository = new InMemoryBudgetRepository(categoryRepository)
    gateway = new FakeDividendDataGateway()
    sut = new SyncAssetDividendsUseCase(
      dividendRepository,
      assetRepository,
      budgetRepository,
      gateway
    )
  })

  async function seed(currency = 'BRL') {
    const category = makeCategory({
      userId: 'user-1',
      currency,
      type: currency === 'BRL' ? CategoryType.FII : CategoryType.VARIABLE_US
    })
    const asset = makeAsset({
      categoryId: category.id,
      ticker: 'MXRF11',
      quantity: 100,
      createdAt: day('2020-01-01')
    })

    await categoryRepository.save(category)
    await assetRepository.save(asset)

    return {
      category,
      asset,
      payload: {
        ticker: 'MXRF11',
        categoryType: category.type,
        targets: [
          {
            assetId: asset.id,
            userId: 'user-1',
            categoryId: category.id,
            currency
          }
        ]
      }
    }
  }

  it('should create synced dividends from the quantity held', async () => {
    const { payload } = await seed()
    gateway.dividends = [
      {
        type: 'INCOME',
        rateAmount: 0.1,
        comDate: day('2026-02-25'),
        paymentDate: day('2026-03-10')
      }
    ]

    const result = await sut.execute(payload)

    expect(result.value).toEqual({ created: 1, updated: 0 })
    expect(dividendRepository.items[0]).toMatchObject({
      amount: 10,
      rateAmount: 0.1,
      source: DividendSource.SYNC
    })
  })

  it('should be idempotent when run twice', async () => {
    const { payload } = await seed()
    gateway.dividends = [
      {
        type: 'INCOME',
        rateAmount: 0.1,
        comDate: null,
        paymentDate: day('2026-03-10')
      }
    ]

    await sut.execute(payload)
    const second = await sut.execute(payload)

    expect(second.value).toEqual({ created: 0, updated: 0 })
    expect(dividendRepository.items).toHaveLength(1)
  })

  it('should never overwrite a manual dividend', async () => {
    const { asset, payload } = await seed()
    const future = new Date()
    future.setUTCFullYear(future.getUTCFullYear() + 1)

    const manual = makeDividend({
      userId: 'user-1',
      assetId: asset.id,
      type: undefined,
      amount: 77,
      paymentDate: future
    })
    dividendRepository.items.push(manual)

    gateway.dividends = [
      {
        type: 'DIVIDEND',
        rateAmount: 1,
        comDate: null,
        paymentDate: future
      }
    ]

    await sut.execute(payload)

    expect(dividendRepository.items).toHaveLength(1)
    expect(manual.amount).toBe(77)
  })

  it('should skip dividends whose COM date is before the asset was registered', async () => {
    const { payload } = await seed()
    gateway.dividends = [
      {
        type: 'INCOME',
        rateAmount: 0.1,
        comDate: day('2019-06-01'),
        paymentDate: day('2019-06-10')
      }
    ]

    const result = await sut.execute(payload)

    expect(result.value).toEqual({ created: 0, updated: 0 })
  })

  describe('backfill mode (since)', () => {
    const history: ExternalDividend[] = [
      {
        type: 'INCOME',
        rateAmount: 0.1,
        comDate: day('2019-06-01'),
        paymentDate: day('2019-06-10')
      },
      {
        type: 'INCOME',
        rateAmount: 0.1,
        comDate: day('2020-06-01'),
        paymentDate: day('2020-06-10')
      },
      {
        type: 'INCOME',
        rateAmount: 0.1,
        comDate: day('2020-09-01'),
        paymentDate: day('2020-09-10')
      }
    ]

    it('should mark the asset as imported, even when the ticker has no dividends', async () => {
      const { asset, payload } = await seed()
      gateway.dividends = []

      await sut.execute({ ...payload, since: '2020-01-01T00:00:00.000Z' })

      expect(asset.dividendsImportedAt).toBeInstanceOf(Date)
    })

    it('should not mark the asset as imported when the provider fails', async () => {
      const { asset, payload } = await seed()
      gateway.dividends = null

      await sut.execute({ ...payload, since: '2020-01-01T00:00:00.000Z' })

      expect(asset.dividendsImportedAt).toBeNull()
    })

    it('should not mark the asset as imported by the regular (non-backfill) sync', async () => {
      const { asset, payload } = await seed()
      gateway.dividends = history

      await sut.execute(payload)

      expect(asset.dividendsImportedAt).toBeNull()
    })

    it('should import payments made after "since" even if before the asset registration', async () => {
      const { payload } = await seed()
      gateway.dividends = history

      // o ativo foi cadastrado em 2020-01-01, mas "since" abrange 2019-12
      const result = await sut.execute({
        ...payload,
        since: day('2019-12-01').toISOString()
      })

      expect(result.value).toEqual({ created: 2, updated: 0 })
      expect(
        dividendRepository.items.map((d) => d.paymentDate.toISOString())
      ).toEqual(['2020-06-10T00:00:00.000Z', '2020-09-10T00:00:00.000Z'])
    })

    it('should ignore payments before "since"', async () => {
      const { payload } = await seed()
      gateway.dividends = history

      const result = await sut.execute({
        ...payload,
        since: day('2020-08-01').toISOString()
      })

      expect(result.value).toEqual({ created: 1, updated: 0 })
    })

    it('should be idempotent and keep manual dividends', async () => {
      const { asset, payload } = await seed()
      gateway.dividends = history
      const manual = makeDividend({
        userId: 'user-1',
        assetId: asset.id,
        type: DividendType.INCOME,
        amount: 77,
        paymentDate: day('2020-06-10')
      })
      dividendRepository.items.push(manual)
      const backfill = { ...payload, since: day('2019-12-01').toISOString() }

      await sut.execute(backfill)
      const second = await sut.execute(backfill)

      expect(second.value).toEqual({ created: 0, updated: 0 })
      expect(dividendRepository.items).toHaveLength(2)
      expect(manual.amount).toBe(77)
    })
  })

  it('should use the latest budget exchange rate for foreign assets', async () => {
    const { category, payload } = await seed('USD')
    await budgetRepository.save(
      makeBudget({ categoryId: category.id, exchangeRate: 5.2 })
    )
    gateway.dividends = [
      {
        type: 'DIVIDEND',
        rateAmount: 0.25,
        comDate: null,
        paymentDate: day('2026-03-10')
      }
    ]

    await sut.execute(payload)

    expect(dividendRepository.items[0].exchangeRate).toBe(5.2)
    expect(dividendRepository.items[0].amount).toBe(25)
  })

  it('should skip foreign assets without any known exchange rate', async () => {
    const { payload } = await seed('USD')
    gateway.dividends = [
      {
        type: 'DIVIDEND',
        rateAmount: 0.25,
        comDate: null,
        paymentDate: day('2026-03-10')
      }
    ]

    await sut.execute(payload)

    expect(dividendRepository.items).toHaveLength(0)
  })
})
