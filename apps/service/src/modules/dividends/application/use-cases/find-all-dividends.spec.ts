import { makeDividend } from '@test/factories/make-dividend'
import { InMemoryDividendRepository } from '@test/repositories/in-memory-dividend.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { DividendWithAsset } from '../../domain/dividend.repository'
import { FindAllDividendsUseCase } from './find-all-dividends'

const asset = {
  id: 'asset-1',
  name: 'Weg',
  ticker: 'WEGE3',
  quantity: 100,
  averagePrice: 30
}

const category = {
  id: 'category-1',
  name: 'Ações',
  type: CategoryType.VARIABLE_BR,
  currency: 'BRL'
}

describe('FindAllDividendsUseCase', () => {
  let repository: InMemoryDividendRepository
  let sut: FindAllDividendsUseCase

  beforeEach(() => {
    repository = new InMemoryDividendRepository()
    sut = new FindAllDividendsUseCase(repository)
  })

  it('should return the dividends with asset, category and BRL amount', async () => {
    const dividend = makeDividend({
      userId: 'user-1',
      assetId: asset.id,
      amount: 20,
      exchangeRate: 5
    })
    const items: DividendWithAsset[] = [{ dividend, asset, category }]
    vi.spyOn(repository, 'list').mockResolvedValue(items)

    const result = await sut.execute({ userId: 'user-1' })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual([
      {
        dividend: expect.objectContaining({
          id: dividend.id,
          amountInBRL: 100
        }),
        asset,
        category
      }
    ])
  })

  it('should forward the filters to the repository', async () => {
    const listSpy = vi.spyOn(repository, 'list')
    const params = {
      userId: 'user-1',
      assetId: asset.id,
      categoryType: CategoryType.FII,
      from: new Date('2025-01-01T00:00:00.000Z')
    }

    await sut.execute(params)

    expect(listSpy).toHaveBeenCalledWith(params)
  })

  it('should return an empty list when there are no dividends', async () => {
    const result = await sut.execute({ userId: 'user-1' })

    expect(result.value).toEqual([])
  })
})
