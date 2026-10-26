import { makeDividend } from '@test/factories/make-dividend'
import { InMemoryDividendRepository } from '@test/repositories/in-memory-dividend.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DividendNotFoundError } from '../errors/dividend-not-found.error'
import { FindDividendByIdUseCase } from './find-dividend-by-id'

describe('FindDividendByIdUseCase', () => {
  let repository: InMemoryDividendRepository
  let sut: FindDividendByIdUseCase

  beforeEach(() => {
    repository = new InMemoryDividendRepository()
    sut = new FindDividendByIdUseCase(repository)
  })

  it('should return the dividend with the amount converted to BRL', async () => {
    const dividend = makeDividend({
      userId: 'user-1',
      assetId: 'asset-1',
      amount: 10,
      exchangeRate: 5
    })
    repository.items.push(dividend)

    const result = await sut.execute('user-1', dividend.id)

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      id: dividend.id,
      assetId: 'asset-1',
      amount: 10,
      exchangeRate: 5,
      amountInBRL: 50
    })
  })

  it('should return not found for another user', async () => {
    const dividend = makeDividend({ userId: 'user-1', assetId: 'asset-1' })
    repository.items.push(dividend)

    const result = await sut.execute('user-2', dividend.id)

    expect(result.value).toBeInstanceOf(DividendNotFoundError)
  })

  it('should return not found for an unknown dividend', async () => {
    const result = await sut.execute('user-1', 'unknown')

    expect(result.value).toBeInstanceOf(DividendNotFoundError)
  })
})
