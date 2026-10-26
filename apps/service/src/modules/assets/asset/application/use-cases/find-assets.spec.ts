import { makeAsset } from '@test/factories/make-asset'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { FindAssetsParams } from '../../domain/dto/find-assets-params.dto'
import { FindAssetsUseCase } from './find-assets'

describe('FindAssetsUseCase', () => {
  let assetRepository: InMemoryAssetRepository
  let sut: FindAssetsUseCase

  beforeEach(() => {
    const categoryRepository = new InMemoryCategoryRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)
    sut = new FindAssetsUseCase(assetRepository)

    categoryRepository.items.push(
      makeCategory({ id: 'category-1', userId: 'user-1', name: 'Ações' }),
      makeCategory({ id: 'category-2', userId: 'user-2' })
    )
  })

  function seed(
    ticker: string,
    prices: {
      currentClosePrice?: number | null
      lastMonthClosePrice?: number | null
    } = {},
    categoryId = 'category-1'
  ) {
    assetRepository.items.push(makeAsset({ categoryId, ticker, ...prices }))
  }

  async function tickers(params: FindAssetsParams) {
    const result = await sut.execute(params)

    return (result.value as { ticker: string }[]).map((asset) => asset.ticker)
  }

  it('should return the assets of the user with their category', async () => {
    seed('WEGE3')
    seed('OTHER', {}, 'category-2')

    const result = await sut.execute({ userId: 'user-1' })

    expect(result.isRight()).toBe(true)
    expect(result.value).toHaveLength(1)
    expect(result.value).toMatchObject([
      { ticker: 'WEGE3', category: { id: 'category-1', name: 'Ações' } }
    ])
  })

  it('should keep the repository order without sort', async () => {
    seed('BBBB')
    seed('AAAA')

    expect(await tickers({ userId: 'user-1' })).toEqual(['BBBB', 'AAAA'])
  })

  describe('sort=monthChange', () => {
    beforeEach(() => {
      seed('UP', { currentClosePrice: 110, lastMonthClosePrice: 100 })
      seed('NONE', { currentClosePrice: 50, lastMonthClosePrice: null })
      seed('DOWN', { currentClosePrice: 90, lastMonthClosePrice: 100 })
      seed('ZERO', { currentClosePrice: 50, lastMonthClosePrice: 0 })
    })

    it('should put the biggest drop first with order=asc', async () => {
      expect(
        await tickers({ userId: 'user-1', sort: 'monthChange', order: 'asc' })
      ).toEqual(['DOWN', 'UP', 'NONE', 'ZERO'])
    })

    it('should put the biggest gain first with order=desc', async () => {
      expect(
        await tickers({ userId: 'user-1', sort: 'monthChange', order: 'desc' })
      ).toEqual(['UP', 'DOWN', 'NONE', 'ZERO'])
    })
  })
})
