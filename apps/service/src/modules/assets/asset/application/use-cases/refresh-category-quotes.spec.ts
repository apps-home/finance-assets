import { FakeEventPublisher } from '@test/events/fake-event-publisher'
import { makeAsset } from '@test/factories/make-asset'
import { makeCategory } from '@test/factories/make-category'
import { FakeMarketDataGateway } from '@test/market-asset/fake-market-data-gateway'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { InMemoryMarketAssetRepository } from '@test/repositories/in-memory-market-asset.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'
import { RefreshMarketAssetQuoteUseCase } from '@/modules/assets/market-asset/application/use-cases/refresh-market-asset-quote'
import { MarketAsset } from '@/modules/assets/market-asset/domain/market-asset.entity'

import { RefreshCategoryQuotesUseCase } from './refresh-category-quotes'

describe('RefreshCategoryQuotesUseCase', () => {
  let categoryRepository: InMemoryCategoryRepository
  let assetRepository: InMemoryAssetRepository
  let marketAssetRepository: InMemoryMarketAssetRepository
  let gateway: FakeMarketDataGateway
  let sut: RefreshCategoryQuotesUseCase

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)
    marketAssetRepository = new InMemoryMarketAssetRepository()
    gateway = new FakeMarketDataGateway()
    sut = new RefreshCategoryQuotesUseCase(
      assetRepository,
      categoryRepository,
      new RefreshMarketAssetQuoteUseCase(
        marketAssetRepository,
        gateway,
        new FakeEventPublisher()
      )
    )
  })

  async function seedCategory(userId = 'user-1') {
    const category = makeCategory({
      userId,
      type: CategoryType.VARIABLE_US,
      currency: 'USD'
    })
    await categoryRepository.save(category)
    return category
  }

  async function seedAsset(
    categoryId: string,
    ticker: string,
    { isActive = true, priceUpdatedAt = null as Date | null } = {}
  ) {
    const marketAsset =
      marketAssetRepository.items.find((item) => item.ticker === ticker) ??
      MarketAsset.create({
        ticker,
        type: CategoryType.VARIABLE_US,
        name: ticker
      })

    if (priceUpdatedAt) marketAsset.updateQuote(30, 20, priceUpdatedAt)
    await marketAssetRepository.save(marketAsset)

    await assetRepository.save(
      makeAsset({
        categoryId,
        ticker,
        isActive,
        marketAssetId: marketAsset.id
      })
    )

    return marketAsset
  }

  it('should fetch the quotes of the active assets of the category', async () => {
    const category = await seedCategory()
    await seedAsset(category.id, 'XP')
    await seedAsset(category.id, 'AAPL')
    await seedAsset(category.id, 'MSFT', { isActive: false })
    gateway.withQuote({ currentPrice: 15.7, lastMonthPrice: 20.99 })

    const result = await sut.execute('user-1', category.id)

    expect(result.value).toEqual({ updated: 2, skipped: 0, failedTickers: [] })
    expect(gateway.fetchQuote).toHaveBeenCalledTimes(2)
    expect(gateway.fetchQuote).not.toHaveBeenCalledWith('MSFT')
  })

  it('should refresh quotes updated more than 5 minutes ago, even within 12h', async () => {
    const category = await seedCategory()
    const marketAsset = await seedAsset(category.id, 'XP', {
      priceUpdatedAt: new Date(Date.now() - 60 * 60 * 1000)
    })
    gateway.withQuote({ currentPrice: 15.7, lastMonthPrice: 20.99 })

    const result = await sut.execute('user-1', category.id)

    expect(result.value).toMatchObject({ updated: 1 })
    expect(marketAssetRepository.items[0].id).toBe(marketAsset.id)
    expect(marketAssetRepository.items[0].currentClosePrice).toBe(15.7)
  })

  it('should skip quotes updated less than 5 minutes ago', async () => {
    const category = await seedCategory()
    await seedAsset(category.id, 'XP', {
      priceUpdatedAt: new Date(Date.now() - 60 * 1000)
    })

    const result = await sut.execute('user-1', category.id)

    expect(result.value).toEqual({ updated: 0, skipped: 1, failedTickers: [] })
    expect(gateway.fetchQuote).not.toHaveBeenCalled()
  })

  it('should fetch a ticker shared by two assets only once', async () => {
    const category = await seedCategory()
    await seedAsset(category.id, 'XP')
    await seedAsset(category.id, 'XP')
    gateway.withQuote({ currentPrice: 15.7, lastMonthPrice: 20.99 })

    const result = await sut.execute('user-1', category.id)

    expect(result.value).toMatchObject({ updated: 1 })
    expect(gateway.fetchQuote).toHaveBeenCalledTimes(1)
  })

  it('should report the tickers whose provider returned nothing', async () => {
    const category = await seedCategory()
    await seedAsset(category.id, 'XP')
    gateway.withQuote(null)

    const result = await sut.execute('user-1', category.id)

    expect(result.value).toEqual({
      updated: 0,
      skipped: 0,
      failedTickers: ['XP']
    })
  })

  it('should return not found for a category of another user', async () => {
    const category = await seedCategory('user-2')
    await seedAsset(category.id, 'XP')

    const result = await sut.execute('user-1', category.id)

    expect(result.value).toBeInstanceOf(CategoryNotFoundError)
    expect(gateway.fetchQuote).not.toHaveBeenCalled()
  })
})
