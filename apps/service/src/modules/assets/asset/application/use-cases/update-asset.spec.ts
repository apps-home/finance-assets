import { FakeEventPublisher } from '@test/events/fake-event-publisher'
import { makeAsset } from '@test/factories/make-asset'
import { makeCategory } from '@test/factories/make-category'
import { makeMarketAssetUseCases } from '@test/market-asset/make-market-asset-use-cases'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { AssetNotFoundError } from '../errors/asset-not-found.error'
import { UpdateAssetUseCase } from './update-asset'

describe('UpdateAssetUseCase', () => {
  let assetRepository: InMemoryAssetRepository
  let market: ReturnType<typeof makeMarketAssetUseCases>
  let eventPublisher: FakeEventPublisher
  let sut: UpdateAssetUseCase

  beforeEach(() => {
    const categoryRepository = new InMemoryCategoryRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)
    market = makeMarketAssetUseCases()
    eventPublisher = new FakeEventPublisher()
    sut = new UpdateAssetUseCase(
      assetRepository,
      categoryRepository,
      market.resolve,
      eventPublisher
    )

    categoryRepository.items.push(
      makeCategory({ id: 'category-1', userId: 'user-1' }),
      makeCategory({
        id: 'category-br',
        userId: 'user-1',
        type: CategoryType.VARIABLE_BR
      })
    )
  })

  function seed(override: Parameters<typeof makeAsset>[0]) {
    const asset = makeAsset(override)
    assetRepository.items.push(asset)

    return asset
  }

  it('should update the given fields and keep the others', async () => {
    const asset = seed({
      categoryId: 'category-1',
      name: 'Weg',
      ticker: 'WEGE3',
      quantity: 10
    })

    const result = await sut.execute('user-1', asset.id, { quantity: 20 })

    expect(result.isRight()).toBe(true)
    expect(assetRepository.items[0]).toMatchObject({
      name: 'Weg',
      ticker: 'WEGE3',
      quantity: 20
    })
  })

  it('should follow the average price while there is no market price', async () => {
    const asset = seed({
      categoryId: 'category-1',
      currentClosePrice: null,
      averagePrice: 10
    })

    await sut.execute('user-1', asset.id, { averagePrice: 12 })

    expect(assetRepository.items[0].currentClosePrice).toBe(12)
  })

  it('should follow the average price while the current price equals it', async () => {
    const asset = seed({
      categoryId: 'category-1',
      currentClosePrice: 10,
      averagePrice: 10
    })

    await sut.execute('user-1', asset.id, { averagePrice: 15 })

    expect(assetRepository.items[0].currentClosePrice).toBe(15)
  })

  it('should keep the market price when it differs from the average price', async () => {
    const asset = seed({
      categoryId: 'category-1',
      currentClosePrice: 20,
      averagePrice: 10
    })

    await sut.execute('user-1', asset.id, { averagePrice: 15 })

    expect(assetRepository.items[0].currentClosePrice).toBe(20)
  })

  it('should respect an explicit current price', async () => {
    const asset = seed({
      categoryId: 'category-1',
      currentClosePrice: null,
      averagePrice: 10
    })

    await sut.execute('user-1', asset.id, {
      averagePrice: 12,
      currentClosePrice: 18
    })

    expect(assetRepository.items[0].currentClosePrice).toBe(18)
  })

  it('should clear the imported dividends mark when the ticker changes', async () => {
    const asset = seed({
      categoryId: 'category-1',
      ticker: 'WEGE3',
      dividendsImportedAt: new Date()
    })

    await sut.execute('user-1', asset.id, { ticker: 'PETR4' })

    expect(assetRepository.items[0].dividendsImportedAt).toBeNull()
  })

  it('should point to the catalog of the new ticker when it changes', async () => {
    const asset = seed({ categoryId: 'category-br', ticker: 'WEGE3' })

    await sut.execute('user-1', asset.id, { ticker: 'PETR4' })

    const [marketAsset] = market.marketAssetRepository.items
    expect(marketAsset.ticker).toBe('PETR4')
    expect(assetRepository.items[0].marketAssetId).toBe(marketAsset.id)
    // Ticker novo no catálogo: cotação buscada em background
    expect(eventPublisher.published).toHaveLength(1)
  })

  it('should ignore a manual price when the asset has a market quote', async () => {
    const asset = seed({
      categoryId: 'category-br',
      ticker: 'WEGE3',
      marketAssetId: crypto.randomUUID(),
      currentClosePrice: 40
    })

    await sut.execute('user-1', asset.id, { currentClosePrice: 1 })

    expect(assetRepository.items[0].currentClosePrice).toBe(40)
  })

  it('should return a payload error for an invalid name', async () => {
    const asset = seed({ categoryId: 'category-1', name: 'Weg' })

    const result = await sut.execute('user-1', asset.id, { name: 'a' })

    expect(result.value).toBeInstanceOf(PayloadError)
    expect(assetRepository.items[0].name).toBe('Weg')
  })

  it('should return not found for an unknown asset', async () => {
    const result = await sut.execute('user-1', 'unknown', { quantity: 1 })

    expect(result.value).toBeInstanceOf(AssetNotFoundError)
  })
})
