import { makeWishlist } from '@test/factories/make-wishlist'
import { InMemoryWishlistRepository } from '@test/repositories/in-memory-wishlist.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { WishlistWithCategory } from '../../domain/wishlist.repository'
import { FindAllWishlistUseCase } from './find-all-wishlist'

const category = {
  id: 'category-1',
  name: 'Ações',
  type: CategoryType.VARIABLE_BR,
  currency: 'BRL'
}

function item(
  ticker: string,
  prices: {
    currentClosePrice?: number | null
    lastMonthClosePrice?: number | null
    targetPrice?: number | null
  }
): WishlistWithCategory {
  return {
    wishlist: makeWishlist({
      userId: 'user-1',
      categoryId: category.id,
      ticker,
      ...prices
    }),
    category
  }
}

describe('FindAllWishlistUseCase', () => {
  let repository: InMemoryWishlistRepository
  let sut: FindAllWishlistUseCase

  beforeEach(() => {
    repository = new InMemoryWishlistRepository()
    sut = new FindAllWishlistUseCase(repository)
  })

  function seed(records: WishlistWithCategory[]) {
    vi.spyOn(repository, 'list').mockResolvedValue(records)
  }

  async function tickers(params: Parameters<typeof sut.execute>[0]) {
    const result = await sut.execute(params)

    return (result.value as { wishlist: { ticker: string } }[]).map(
      (entry) => entry.wishlist.ticker
    )
  }

  it('should pass the params to the repository and map category data', async () => {
    seed([item('AAAA', { currentClosePrice: 10 })])

    const result = await sut.execute({ userId: 'user-1', search: 'aaa' })

    expect(repository.list).toHaveBeenCalledWith({
      userId: 'user-1',
      search: 'aaa'
    })
    expect(result.value).toHaveLength(1)
    expect(result.value).toMatchObject([
      { wishlist: { ticker: 'AAAA' }, category }
    ])
  })

  it('should keep the repository order without sort', async () => {
    seed([item('BBBB', {}), item('AAAA', {})])

    expect(await tickers({ userId: 'user-1' })).toEqual(['BBBB', 'AAAA'])
  })

  describe('targetStatus', () => {
    const records = () => [
      item('BELOW', { currentClosePrice: 8, targetPrice: 10 }),
      item('EQUAL', { currentClosePrice: 10, targetPrice: 10 }),
      item('ABOVE', { currentClosePrice: 12, targetPrice: 10 }),
      item('NOTARGET', { currentClosePrice: 12, targetPrice: null }),
      item('ZERO', { currentClosePrice: 12, targetPrice: 0 }),
      item('NOPRICE', { currentClosePrice: null, targetPrice: 10 })
    ]

    it('should filter BELOW_OR_AT_TARGET', async () => {
      seed(records())

      expect(
        await tickers({ userId: 'user-1', targetStatus: 'BELOW_OR_AT_TARGET' })
      ).toEqual(['BELOW', 'EQUAL'])
    })

    it('should filter ABOVE_TARGET', async () => {
      seed(records())

      expect(
        await tickers({ userId: 'user-1', targetStatus: 'ABOVE_TARGET' })
      ).toEqual(['ABOVE'])
    })

    it('should filter NO_TARGET, treating a zero target as none', async () => {
      seed(records())

      expect(
        await tickers({ userId: 'user-1', targetStatus: 'NO_TARGET' })
      ).toEqual(['NOTARGET', 'ZERO'])
    })
  })

  describe('sort=monthChange', () => {
    const records = () => [
      item('UP', { currentClosePrice: 110, lastMonthClosePrice: 100 }),
      item('NONE', { currentClosePrice: 50, lastMonthClosePrice: null }),
      item('DOWN', { currentClosePrice: 90, lastMonthClosePrice: 100 }),
      item('ZERO', { currentClosePrice: 50, lastMonthClosePrice: 0 })
    ]

    it('should put the biggest drop first with order=asc', async () => {
      seed(records())

      expect(
        await tickers({ userId: 'user-1', sort: 'monthChange', order: 'asc' })
      ).toEqual(['DOWN', 'UP', 'NONE', 'ZERO'])
    })

    it('should put the biggest gain first with order=desc', async () => {
      seed(records())

      expect(
        await tickers({ userId: 'user-1', sort: 'monthChange', order: 'desc' })
      ).toEqual(['UP', 'DOWN', 'NONE', 'ZERO'])
    })
  })
})
