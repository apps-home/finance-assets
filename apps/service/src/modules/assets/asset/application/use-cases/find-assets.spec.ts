import { makeAsset } from '@test/factories/make-asset'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { FindAssetsParams } from '../../domain/dto/find-assets-params.dto'
import { FindAssetsUseCase } from './find-assets'

describe('FindAssetsUseCase', () => {
  let categoryRepository: InMemoryCategoryRepository
  let assetRepository: InMemoryAssetRepository
  let sut: FindAssetsUseCase

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository()
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

  it('should keep the repository order within the same category type without sort', async () => {
    seed('BBBB')
    seed('AAAA')

    expect(await tickers({ userId: 'user-1' })).toEqual(['BBBB', 'AAAA'])
  })

  it('should sort assets by category type order (VARIABLE_BR, FII, VARIABLE_US, CRYPTO, FIXED)', async () => {
    categoryRepository.items.push(
      makeCategory({
        id: 'cat-fixed',
        userId: 'user-1',
        type: CategoryType.FIXED
      }),
      makeCategory({
        id: 'cat-crypto',
        userId: 'user-1',
        type: CategoryType.CRYPTO
      }),
      makeCategory({
        id: 'cat-us',
        userId: 'user-1',
        type: CategoryType.VARIABLE_US
      }),
      makeCategory({
        id: 'cat-fii',
        userId: 'user-1',
        type: CategoryType.FII
      }),
      makeCategory({
        id: 'cat-br',
        userId: 'user-1',
        type: CategoryType.VARIABLE_BR
      })
    )

    seed('CDB', {}, 'cat-fixed')
    seed('BTC', {}, 'cat-crypto')
    seed('AAPL', {}, 'cat-us')
    seed('HGLG11', {}, 'cat-fii')
    seed('WEGE3', {}, 'cat-br')

    expect(await tickers({ userId: 'user-1' })).toEqual([
      'WEGE3',
      'HGLG11',
      'AAPL',
      'BTC',
      'CDB'
    ])
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
