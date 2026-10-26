import { makeCategory } from '@test/factories/make-category'
import { makeWishlist } from '@test/factories/make-wishlist'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { InMemoryWishlistRepository } from '@test/repositories/in-memory-wishlist.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  PriceHistoryGateway,
  PricePoint
} from '@/core/http/external/market-data/price-history.gateway'
import { PriceHistoryUnavailableError } from '@/modules/assets/asset/application/errors/price-history-unavailable.error'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { WishlistNotFoundError } from '../errors/wishlist-not-found.error'
import { GetWishlistPriceHistoryUseCase } from './get-wishlist-price-history'

class FakePriceHistoryGateway extends PriceHistoryGateway {
  public points: PricePoint[] | null = []

  async fetchHistory(): Promise<PricePoint[] | null> {
    return this.points
  }
}

const day = (value: string) => new Date(`${value}T00:00:00.000Z`)

describe('GetWishlistPriceHistoryUseCase', () => {
  let categoryRepository: InMemoryCategoryRepository
  let wishlistRepository: InMemoryWishlistRepository
  let gateway: FakePriceHistoryGateway
  let sut: GetWishlistPriceHistoryUseCase

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository()
    wishlistRepository = new InMemoryWishlistRepository()
    gateway = new FakePriceHistoryGateway()
    sut = new GetWishlistPriceHistoryUseCase(
      wishlistRepository,
      categoryRepository,
      gateway
    )
  })

  async function seed(userId = 'user-1') {
    const category = makeCategory({
      userId,
      type: CategoryType.VARIABLE_BR,
      currency: 'BRL'
    })
    const item = makeWishlist({
      userId,
      categoryId: category.id,
      ticker: 'WEGE3'
    })

    await categoryRepository.save(category)
    await wishlistRepository.save(item)

    return item
  }

  it('should return the points with the variation of the period', async () => {
    const item = await seed()
    gateway.points = [
      { date: day('2026-01-02'), close: 40 },
      { date: day('2026-06-01'), close: 50 }
    ]

    const result = await sut.execute('user-1', item.id, '1y')

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      ticker: 'WEGE3',
      currency: 'BRL',
      range: '1y',
      change: 10,
      changePercent: 25
    })
  })

  it('should be unavailable when the provider returns nothing', async () => {
    const item = await seed()
    gateway.points = null

    const result = await sut.execute('user-1', item.id, '1m')

    expect(result.value).toBeInstanceOf(PriceHistoryUnavailableError)
  })

  it('should treat an item from another user as not found', async () => {
    const item = await seed('user-2')
    gateway.points = [{ date: day('2026-01-02'), close: 1 }]

    const result = await sut.execute('user-1', item.id, '1m')

    expect(result.value).toBeInstanceOf(WishlistNotFoundError)
  })
})
