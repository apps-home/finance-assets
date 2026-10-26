import { makeDividend } from '@test/factories/make-dividend'
import { InMemoryDividendRepository } from '@test/repositories/in-memory-dividend.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

import { DividendSource, DividendType } from '../../domain/dividend.entity'
import { UpdateDividendUseCase } from './update-dividend'

describe('UpdateDividendUseCase', () => {
  let dividendRepository: InMemoryDividendRepository
  let sut: UpdateDividendUseCase

  beforeEach(() => {
    dividendRepository = new InMemoryDividendRepository()
    sut = new UpdateDividendUseCase(dividendRepository)
  })

  it('should recalculate the amount when the rate changes', async () => {
    const dividend = makeDividend({
      userId: 'user-1',
      assetId: 'asset-1',
      amount: 10,
      rateAmount: 0.1,
      quantity: 100
    })
    dividendRepository.items.push(dividend)

    const result = await sut.execute('user-1', dividend.id, {
      rateAmount: 0.25
    })

    expect(result.isRight()).toBe(true)
    expect(dividend.amount).toBe(25)
  })

  it('should set the tax and scale it with the recalculated gross amount', async () => {
    const dividend = makeDividend({
      userId: 'user-1',
      assetId: 'asset-1',
      amount: 10,
      rateAmount: 0.1,
      quantity: 100
    })
    dividendRepository.items.push(dividend)

    await sut.execute('user-1', dividend.id, { taxAmount: 3 })
    await sut.execute('user-1', dividend.id, { rateAmount: 0.2 })

    expect(dividend.amount).toBe(20)
    expect(dividend.taxAmount).toBe(6)
    expect(dividend.netAmount).toBe(14)
  })

  it('should keep the tax proportional when the amount is recalculated', async () => {
    const dividend = makeDividend({
      userId: 'user-1',
      assetId: 'asset-1',
      amount: 10,
      taxAmount: 3,
      rateAmount: 0.1,
      quantity: 100
    })
    dividendRepository.items.push(dividend)

    await sut.execute('user-1', dividend.id, { quantity: 200 })

    expect(dividend.amount).toBe(20)
    expect(dividend.taxAmount).toBe(6)
  })

  it('should turn a synced dividend into a manual one when edited', async () => {
    const dividend = makeDividend({
      userId: 'user-1',
      assetId: 'asset-1',
      source: DividendSource.SYNC
    })
    dividendRepository.items.push(dividend)

    await sut.execute('user-1', dividend.id, { amount: 42 })

    expect(dividend.source).toBe(DividendSource.MANUAL)
  })

  it('should reject moving a dividend onto an existing one', async () => {
    const date = new Date('2026-03-10T00:00:00.000Z')
    const first = makeDividend({
      userId: 'user-1',
      assetId: 'asset-1',
      type: DividendType.DIVIDEND,
      paymentDate: date
    })
    const second = makeDividend({
      userId: 'user-1',
      assetId: 'asset-1',
      type: DividendType.DIVIDEND,
      paymentDate: new Date('2026-04-10T00:00:00.000Z')
    })
    dividendRepository.items.push(first, second)

    const result = await sut.execute('user-1', second.id, {
      paymentDate: date
    })

    expect(result.value).toBeInstanceOf(PayloadError)
  })

  it('should return a PayloadError for an invalid amount', async () => {
    const dividend = makeDividend({ userId: 'user-1', assetId: 'asset-1' })
    dividendRepository.items.push(dividend)

    const result = await sut.execute('user-1', dividend.id, { amount: -5 })

    expect(result.value).toBeInstanceOf(PayloadError)
  })
})
