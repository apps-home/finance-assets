import { makeAsset } from '@test/factories/make-asset'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  PriceHistoryGateway,
  PricePoint
} from '@/core/http/external/market-data/price-history.gateway'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { AssetNotFoundError } from '../errors/asset-not-found.error'
import { PriceHistoryUnavailableError } from '../errors/price-history-unavailable.error'
import { GetAssetPriceHistoryUseCase } from './get-asset-price-history'

class FakePriceHistoryGateway extends PriceHistoryGateway {
  public points: PricePoint[] | null = []

  async fetchHistory(): Promise<PricePoint[] | null> {
    return this.points
  }
}

const day = (value: string) => new Date(`${value}T00:00:00.000Z`)

describe('GetAssetPriceHistoryUseCase', () => {
  let categoryRepository: InMemoryCategoryRepository
  let assetRepository: InMemoryAssetRepository
  let gateway: FakePriceHistoryGateway
  let sut: GetAssetPriceHistoryUseCase

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)
    gateway = new FakePriceHistoryGateway()
    sut = new GetAssetPriceHistoryUseCase(
      assetRepository,
      categoryRepository,
      gateway
    )
  })

  async function seed(ticker = 'WEGE3', userId = 'user-1') {
    const category = makeCategory({
      userId,
      type: CategoryType.VARIABLE_BR,
      currency: 'BRL'
    })
    const asset = makeAsset({ categoryId: category.id, ticker })

    await categoryRepository.save(category)
    await assetRepository.save(asset)

    return asset
  }

  it('should return the points with the variation of the period', async () => {
    const asset = await seed()
    gateway.points = [
      { date: day('2026-01-02'), close: 40 },
      { date: day('2026-06-01'), close: 50 }
    ]

    const result = await sut.execute('user-1', asset.id, 'ytd')

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      ticker: 'WEGE3',
      currency: 'BRL',
      range: 'ytd',
      change: 10,
      changePercent: 25
    })
  })

  it('should return null percent when the first close is zero', async () => {
    const asset = await seed()
    gateway.points = [
      { date: day('2026-01-02'), close: 0 },
      { date: day('2026-06-01'), close: 5 }
    ]

    const result = await sut.execute('user-1', asset.id, '1y')

    expect(result.value).toMatchObject({ change: 5, changePercent: null })
  })

  it('should be unavailable when the provider returns nothing', async () => {
    const asset = await seed()
    gateway.points = null

    const result = await sut.execute('user-1', asset.id, '1m')

    expect(result.value).toBeInstanceOf(PriceHistoryUnavailableError)
  })

  it('should be unavailable for assets without ticker', async () => {
    const asset = await seed('')
    gateway.points = [{ date: day('2026-01-02'), close: 1 }]

    const result = await sut.execute('user-1', asset.id, '1m')

    expect(result.value).toBeInstanceOf(PriceHistoryUnavailableError)
  })

  it('should treat an asset from another user as not found', async () => {
    const asset = await seed('WEGE3', 'user-2')
    gateway.points = [{ date: day('2026-01-02'), close: 1 }]

    const result = await sut.execute('user-1', asset.id, '1m')

    expect(result.value).toBeInstanceOf(AssetNotFoundError)
  })
})
