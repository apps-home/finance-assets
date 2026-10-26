import { makeDividend } from '@test/factories/make-dividend'
import { InMemoryDividendRepository } from '@test/repositories/in-memory-dividend.repository'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { Dividend } from '../../domain/dividend.entity'
import { DividendWithAsset } from '../../domain/dividend.repository'
import { GetDividendsSummaryUseCase } from './get-dividends-summary'

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

describe('GetDividendsSummaryUseCase', () => {
  let repository: InMemoryDividendRepository
  let sut: GetDividendsSummaryUseCase

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(day('2025-06-15'))

    repository = new InMemoryDividendRepository()
    sut = new GetDividendsSummaryUseCase(repository)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should default to the current year', async () => {
    const result = await sut.execute('user-1')

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({ year: 2025, totalYear: 0 })
  })

  it('should load the whole history, whatever the queried year', async () => {
    const listSpy = vi.spyOn(repository, 'list')

    await sut.execute('user-1', 2022)

    expect(listSpy).toHaveBeenCalledWith({ userId: 'user-1' })
  })

  it('should total the history by year regardless of the queried year', async () => {
    const old = makeDividend({
      userId: 'user-1',
      assetId: asset.id,
      amount: 40,
      paymentDate: day('2022-03-10')
    })
    const recent = makeDividend({
      userId: 'user-1',
      assetId: asset.id,
      amount: 60,
      paymentDate: day('2025-03-10')
    })
    vi.spyOn(repository, 'list').mockResolvedValue([
      withAsset(recent),
      withAsset(old)
    ])

    const result = await sut.execute('user-1', 2025)

    expect(result.isRight() && result.value.byYear).toMatchObject([
      { year: 2022, total: 40 },
      { year: 2025, total: 60 }
    ])
  })

  it('should sum only received dividends of the year', async () => {
    const received = makeDividend({
      userId: 'user-1',
      assetId: asset.id,
      amount: 100,
      paymentDate: day('2025-03-10')
    })
    const future = makeDividend({
      userId: 'user-1',
      assetId: asset.id,
      amount: 50,
      paymentDate: day('2025-09-10')
    })
    vi.spyOn(repository, 'list').mockResolvedValue([
      withAsset(received),
      withAsset(future)
    ])

    const result = await sut.execute('user-1', 2025)

    expect(result.value).toMatchObject({
      year: 2025,
      totalYear: 100,
      totalCurrentMonth: 0,
      byCategoryType: [{ type: CategoryType.VARIABLE_BR, total: 100 }]
    })
  })

  it('should use the net amount in BRL', async () => {
    const dividend = makeDividend({
      userId: 'user-1',
      assetId: asset.id,
      amount: 100,
      taxAmount: 30,
      exchangeRate: 5,
      paymentDate: day('2025-06-10')
    })
    vi.spyOn(repository, 'list').mockResolvedValue([withAsset(dividend)])

    const result = await sut.execute('user-1', 2025)

    expect(result.value).toMatchObject({
      totalYear: 350,
      totalCurrentMonth: 350
    })
  })
})
