import { makeCategory } from '@test/factories/make-category'
import { makeWishlist } from '@test/factories/make-wishlist'
import { makeMarketAssetUseCases } from '@test/market-asset/make-market-asset-use-cases'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { InMemoryWishlistRepository } from '@test/repositories/in-memory-wishlist.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { WishlistNotFoundError } from '../errors/wishlist-not-found.error'
import { UpdateWishlistUseCase } from './update-wishlist'

describe('UpdateWishlistUseCase', () => {
  let repository: InMemoryWishlistRepository
  let market: ReturnType<typeof makeMarketAssetUseCases>
  let sut: UpdateWishlistUseCase

  beforeEach(() => {
    repository = new InMemoryWishlistRepository()
    market = makeMarketAssetUseCases()
    const categoryRepository = new InMemoryCategoryRepository()
    categoryRepository.items.push(
      makeCategory({
        id: 'category-1',
        userId: 'user-1',
        type: CategoryType.VARIABLE_BR
      })
    )
    sut = new UpdateWishlistUseCase(
      repository,
      categoryRepository,
      market.resolveWithQuote
    )
  })

  it('should point to the catalog of the new ticker when it changes', async () => {
    market.gateway.withQuote({ currentPrice: 30, lastMonthPrice: 31 })
    const item = makeWishlist({
      userId: 'user-1',
      categoryId: 'category-1',
      ticker: 'WEGE3'
    })
    repository.items.push(item)

    await sut.execute('user-1', item.id, { ticker: 'PETR4' })

    const [marketAsset] = market.marketAssetRepository.items
    expect(marketAsset.ticker).toBe('PETR4')
    expect(repository.items[0]).toMatchObject({
      marketAssetId: marketAsset.id,
      currentClosePrice: 30,
      lastMonthClosePrice: 31
    })
  })

  it('should update the given fields only', async () => {
    const item = makeWishlist({
      userId: 'user-1',
      categoryId: 'category-1',
      name: 'Weg',
      ticker: 'WEGE3',
      targetPrice: 40
    })
    repository.items.push(item)

    const result = await sut.execute('user-1', item.id, { targetPrice: 35 })

    expect(result.isRight()).toBe(true)
    expect(repository.items[0].targetPrice).toBe(35)
    expect(repository.items[0].name).toBe('Weg')
    expect(repository.items[0].ticker).toBe('WEGE3')
  })

  it('should normalize the ticker when it changes', async () => {
    const item = makeWishlist({
      userId: 'user-1',
      categoryId: 'category-1',
      ticker: 'WEGE3'
    })
    repository.items.push(item)

    const result = await sut.execute('user-1', item.id, { ticker: ' petr4 ' })

    expect(result.isRight()).toBe(true)
    expect(repository.items[0].ticker).toBe('PETR4')
  })

  it('should reject a ticker already in the wishlist of the user', async () => {
    const item = makeWishlist({
      userId: 'user-1',
      categoryId: 'category-1',
      ticker: 'WEGE3'
    })
    const duplicate = makeWishlist({
      userId: 'user-1',
      categoryId: 'category-1',
      ticker: 'PETR4'
    })
    repository.items.push(item, duplicate)

    const result = await sut.execute('user-1', item.id, { ticker: 'petr4' })

    expect(result.value).toBeInstanceOf(PayloadError)
    expect(repository.items[0].ticker).toBe('WEGE3')
  })

  it('should allow resending the same ticker with different casing', async () => {
    const item = makeWishlist({
      userId: 'user-1',
      categoryId: 'category-1',
      ticker: 'WEGE3'
    })
    repository.items.push(item)

    const result = await sut.execute('user-1', item.id, { ticker: 'wege3' })

    expect(result.isRight()).toBe(true)
  })

  it('should return a payload error for an invalid name', async () => {
    const item = makeWishlist({ userId: 'user-1', categoryId: 'category-1' })
    repository.items.push(item)

    const result = await sut.execute('user-1', item.id, { name: 'a' })

    expect(result.value).toBeInstanceOf(PayloadError)
  })

  it('should return not found for an unknown item', async () => {
    const result = await sut.execute('user-1', 'unknown', { name: 'Novo' })

    expect(result.value).toBeInstanceOf(WishlistNotFoundError)
  })
})
