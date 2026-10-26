import { makeCategory } from '@test/factories/make-category'
import { makeWishlist } from '@test/factories/make-wishlist'
import { makeMarketAssetUseCases } from '@test/market-asset/make-market-asset-use-cases'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { InMemoryWishlistRepository } from '@test/repositories/in-memory-wishlist.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'
import { MarketAsset } from '@/modules/assets/market-asset/domain/market-asset.entity'

import { CreateWishlistUseCase } from './create-wishlist'

describe('CreateWishlistUseCase', () => {
  let wishlistRepository: InMemoryWishlistRepository
  let categoryRepository: InMemoryCategoryRepository
  let market: ReturnType<typeof makeMarketAssetUseCases>
  let sut: CreateWishlistUseCase

  beforeEach(() => {
    wishlistRepository = new InMemoryWishlistRepository()
    categoryRepository = new InMemoryCategoryRepository()
    market = makeMarketAssetUseCases()
    sut = new CreateWishlistUseCase(
      wishlistRepository,
      categoryRepository,
      market.resolveWithQuote
    )

    categoryRepository.items.push(
      makeCategory({
        id: 'category-1',
        userId: 'user-1',
        type: CategoryType.VARIABLE_BR
      })
    )
  })

  const payload = {
    userId: 'user-1',
    categoryId: 'category-1',
    name: 'Weg',
    ticker: 'wege3'
  }

  it('should create the item with the initial quote', async () => {
    market.gateway.withQuote({ currentPrice: 40, lastMonthPrice: 38 })

    const result = await sut.execute(payload)

    expect(result.isRight()).toBe(true)
    expect(wishlistRepository.items).toHaveLength(1)
    expect(wishlistRepository.items[0]).toMatchObject({
      ticker: 'WEGE3',
      marketAssetId: market.marketAssetRepository.items[0].id,
      currentClosePrice: 40,
      lastMonthClosePrice: 38
    })
  })

  it('should reuse a fresh quote of the catalog without calling the provider', async () => {
    const existing = MarketAsset.create({
      ticker: 'WEGE3',
      type: CategoryType.VARIABLE_BR,
      name: 'Weg'
    })
    existing.updateQuote(41, 39)
    market.marketAssetRepository.items.push(existing)

    await sut.execute(payload)

    expect(market.gateway.fetchQuote).not.toHaveBeenCalled()
    expect(wishlistRepository.items[0]).toMatchObject({
      marketAssetId: existing.id,
      currentClosePrice: 41
    })
  })

  it('should create the item without prices when there is no provider', async () => {
    market.gateway.provider = null

    const result = await sut.execute(payload)

    expect(result.isRight()).toBe(true)
    expect(wishlistRepository.items[0].currentClosePrice).toBeNull()
  })

  it('should create the item without prices when the quote is unavailable', async () => {
    market.gateway.withQuote(null)

    const result = await sut.execute(payload)

    expect(result.isRight()).toBe(true)
    expect(wishlistRepository.items[0].currentClosePrice).toBeNull()
  })

  it('should still create the item when fetching the quote fails', async () => {
    market.gateway.fetchQuote.mockRejectedValue(new Error('provider down'))

    const result = await sut.execute(payload)

    expect(result.isRight()).toBe(true)
    expect(wishlistRepository.items).toHaveLength(1)
  })

  it('should not create when the category belongs to another user', async () => {
    const result = await sut.execute({ ...payload, userId: 'user-2' })

    expect(result.value).toBeInstanceOf(CategoryNotFoundError)
    expect(wishlistRepository.items).toHaveLength(0)
  })

  it('should not create a duplicated ticker for the same user', async () => {
    wishlistRepository.items.push(
      makeWishlist({
        userId: 'user-1',
        categoryId: 'category-1',
        ticker: 'WEGE3'
      })
    )

    const result = await sut.execute(payload)

    expect(result.value).toBeInstanceOf(PayloadError)
    expect(wishlistRepository.items).toHaveLength(1)
  })

  it('should allow the same ticker for different users', async () => {
    categoryRepository.items.push(
      makeCategory({
        id: 'category-2',
        userId: 'user-2',
        type: CategoryType.VARIABLE_BR
      })
    )
    wishlistRepository.items.push(
      makeWishlist({
        userId: 'user-1',
        categoryId: 'category-1',
        ticker: 'WEGE3'
      })
    )

    const result = await sut.execute({
      ...payload,
      userId: 'user-2',
      categoryId: 'category-2'
    })

    expect(result.isRight()).toBe(true)
    expect(wishlistRepository.items).toHaveLength(2)
  })

  it('should return a payload error for an invalid name', async () => {
    const result = await sut.execute({ ...payload, name: 'a' })

    expect(result.value).toBeInstanceOf(PayloadError)
    expect(wishlistRepository.items).toHaveLength(0)
  })
})
