import { FakeMarketDataGateway } from '@test/market-asset/fake-market-data-gateway'
import { InMemoryMarketAssetRepository } from '@test/repositories/in-memory-market-asset.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { MarketAsset } from '../../domain/market-asset.entity'
import { MarketAssetNotFoundError } from '../errors/market-asset-not-found.error'
import { RefreshMarketAssetQuoteUseCase } from './refresh-market-asset-quote'

describe('RefreshMarketAssetQuoteUseCase', () => {
  let repository: InMemoryMarketAssetRepository
  let gateway: FakeMarketDataGateway
  let sut: RefreshMarketAssetQuoteUseCase

  beforeEach(() => {
    repository = new InMemoryMarketAssetRepository()
    gateway = new FakeMarketDataGateway()
    sut = new RefreshMarketAssetQuoteUseCase(repository, gateway)
  })

  function seed() {
    const marketAsset = MarketAsset.create({
      ticker: 'WEGE3',
      type: CategoryType.VARIABLE_BR,
      name: 'Weg'
    })
    repository.items.push(marketAsset)
    return marketAsset
  }

  it('should save the quote with the update time', async () => {
    const marketAsset = seed()
    gateway.withQuote({ currentPrice: 40, lastMonthPrice: 38 })

    const result = await sut.execute(marketAsset.id)

    expect(result.isRight()).toBe(true)
    expect(gateway.fetchQuote).toHaveBeenCalledWith('WEGE3')
    expect(repository.items[0]).toMatchObject({
      currentClosePrice: 40,
      lastMonthClosePrice: 38
    })
    expect(repository.items[0].priceUpdatedAt).toBeInstanceOf(Date)
  })

  it('should not call the provider when the quote is fresh', async () => {
    const marketAsset = seed()
    marketAsset.updateQuote(40, 38)

    await sut.execute(marketAsset.id)

    expect(gateway.fetchQuote).not.toHaveBeenCalled()
  })

  it('should fetch a fresh quote again when forced (daily cron)', async () => {
    const marketAsset = seed()
    marketAsset.updateQuote(40, 38)
    gateway.withQuote({ currentPrice: 42, lastMonthPrice: 38 })

    await sut.execute(marketAsset.id, { force: true })

    expect(repository.items[0].currentClosePrice).toBe(42)
  })

  it('should keep the previous quote when the provider returns nothing', async () => {
    const marketAsset = seed()
    marketAsset.updateQuote(40, 38, new Date('2020-01-01'))
    gateway.withQuote(null)

    await sut.execute(marketAsset.id)

    expect(repository.items[0].currentClosePrice).toBe(40)
  })

  it('should return not found for an unknown market asset', async () => {
    const result = await sut.execute(crypto.randomUUID())

    expect(result.value).toBeInstanceOf(MarketAssetNotFoundError)
  })
})
