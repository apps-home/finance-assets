import { makeDividend } from '@test/factories/make-dividend'
import { InMemoryDividendRepository } from '@test/repositories/in-memory-dividend.repository'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { Dividend } from '../../domain/dividend.entity'
import { DividendWithAsset } from '../../domain/dividend.repository'
import { GetUpcomingDividendsUseCase } from './get-upcoming-dividends'

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

const day = (value: string) => new Date(`${value}T00:00:00.000Z`)

function withAsset(dividend: Dividend): DividendWithAsset {
  return { dividend, asset, category }
}

describe('GetUpcomingDividendsUseCase', () => {
  let repository: InMemoryDividendRepository
  let sut: GetUpcomingDividendsUseCase

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(day('2025-06-15'))

    repository = new InMemoryDividendRepository()
    sut = new GetUpcomingDividendsUseCase(repository)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function paymentOn(value: string) {
    return makeDividend({
      userId: 'user-1',
      assetId: asset.id,
      paymentDate: day(value)
    })
  }

  it('should query the repository from now for the user', async () => {
    const listSpy = vi.spyOn(repository, 'list')

    await sut.execute('user-1')

    expect(listSpy).toHaveBeenCalledWith({
      userId: 'user-1',
      from: new Date('2025-06-15T00:00:00.000Z')
    })
  })

  it('should return only future payments ordered by payment date', async () => {
    const later = paymentOn('2025-08-10')
    const sooner = paymentOn('2025-07-01')
    const past = paymentOn('2025-05-10')
    vi.spyOn(repository, 'list').mockResolvedValue([
      withAsset(later),
      withAsset(past),
      withAsset(sooner)
    ])

    const result = await sut.execute('user-1')

    expect(result.isRight()).toBe(true)
    expect(
      (result.value as { dividend: { id: string } }[]).map(
        ({ dividend }) => dividend.id
      )
    ).toEqual([sooner.id, later.id])
  })

  it('should not include a payment that is exactly now', async () => {
    vi.spyOn(repository, 'list').mockResolvedValue([
      withAsset(paymentOn('2025-06-15'))
    ])

    const result = await sut.execute('user-1')

    expect(result.value).toEqual([])
  })

  it('should return an empty list when there is nothing upcoming', async () => {
    const result = await sut.execute('user-1')

    expect(result.value).toEqual([])
  })
})
