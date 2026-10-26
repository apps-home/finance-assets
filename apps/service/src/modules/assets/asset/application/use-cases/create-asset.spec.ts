import { FakeEventPublisher } from '@test/events/fake-event-publisher'
import { makeCategory } from '@test/factories/make-category'
import { makeMarketAssetUseCases } from '@test/market-asset/make-market-asset-use-cases'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { AssetEvent } from '@/core/domain/events/asset.event'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'
import { MarketAsset } from '@/modules/assets/market-asset/domain/market-asset.entity'

import { CreateAssetUseCase } from './create-asset'

describe('CreateAssetUseCase', () => {
  let categoryRepository: InMemoryCategoryRepository
  let assetRepository: InMemoryAssetRepository
  let market: ReturnType<typeof makeMarketAssetUseCases>
  let eventPublisher: FakeEventPublisher
  let sut: CreateAssetUseCase

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)
    market = makeMarketAssetUseCases()
    eventPublisher = new FakeEventPublisher()
    sut = new CreateAssetUseCase(
      assetRepository,
      categoryRepository,
      market.resolve,
      eventPublisher
    )
  })

  function stockCategory(userId = 'user-1') {
    const category = makeCategory({ userId, type: CategoryType.VARIABLE_BR })
    categoryRepository.items.push(category)
    return category
  }

  it('should create an asset in a category owned by the user', async () => {
    const category = makeCategory({ userId: 'user-1' })
    categoryRepository.items.push(category)

    const result = await sut.execute('user-1', {
      name: 'Tesouro Selic',
      categoryId: category.id
    })

    expect(result.isRight()).toBe(true)
    expect(assetRepository.items).toHaveLength(1)
  })

  it('should keep fixed income out of the market catalog', async () => {
    const category = makeCategory({ userId: 'user-1' })
    categoryRepository.items.push(category)

    await sut.execute('user-1', {
      name: 'Tesouro Selic',
      categoryId: category.id,
      averagePrice: 100
    })

    expect(market.marketAssetRepository.items).toHaveLength(0)
    expect(assetRepository.items[0]).toMatchObject({
      marketAssetId: null,
      currentClosePrice: 100
    })
    expect(eventPublisher.published).toHaveLength(0)
  })

  it('should add a new ticker to the catalog and request its quote', async () => {
    const category = stockCategory()

    await sut.execute('user-1', {
      name: 'Weg',
      ticker: 'wege3',
      categoryId: category.id
    })

    const [marketAsset] = market.marketAssetRepository.items
    expect(marketAsset).toMatchObject({
      ticker: 'WEGE3',
      type: CategoryType.VARIABLE_BR
    })
    expect(assetRepository.items[0].marketAssetId).toBe(marketAsset.id)
    expect(eventPublisher.published).toEqual([
      {
        event: AssetEvent.CREATED,
        payload: expect.objectContaining({ marketAssetId: marketAsset.id })
      }
    ])
  })

  it('should reuse a ticker already in the catalog with its fresh quote', async () => {
    const existing = MarketAsset.create({
      ticker: 'WEGE3',
      type: CategoryType.VARIABLE_BR,
      name: 'Weg'
    })
    existing.updateQuote(40, 38)
    market.marketAssetRepository.items.push(existing)
    const category = stockCategory('user-2')

    await sut.execute('user-2', {
      name: 'WEG ON',
      ticker: 'WEGE3',
      categoryId: category.id
    })

    expect(market.marketAssetRepository.items).toHaveLength(1)
    expect(assetRepository.items[0]).toMatchObject({
      marketAssetId: existing.id,
      currentClosePrice: 40,
      lastMonthClosePrice: 38
    })
    // Cotação recente: nenhuma busca externa
    expect(eventPublisher.published).toHaveLength(0)
  })

  it('should not create an asset in a category owned by another user', async () => {
    const category = makeCategory({ userId: 'user-1' })
    categoryRepository.items.push(category)

    const result = await sut.execute('user-2', {
      name: 'Tesouro Selic',
      categoryId: category.id
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(CategoryNotFoundError)
    expect(assetRepository.items).toHaveLength(0)
  })

  it('should not create an asset in a category that does not exist', async () => {
    const result = await sut.execute('user-1', {
      name: 'Tesouro Selic',
      categoryId: crypto.randomUUID()
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(CategoryNotFoundError)
  })
})
