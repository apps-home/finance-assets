import { makeDividend } from '@test/factories/make-dividend'
import { InMemoryDividendRepository } from '@test/repositories/in-memory-dividend.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DividendNotFoundError } from '../errors/dividend-not-found.error'
import { DeleteDividendUseCase } from './delete-dividend'
import { FindDividendByIdUseCase } from './find-dividend-by-id'
import { UpdateDividendUseCase } from './update-dividend'

describe('Dividend use cases ownership', () => {
  let dividendRepository: InMemoryDividendRepository
  let dividendId: string

  beforeEach(() => {
    dividendRepository = new InMemoryDividendRepository()

    const dividend = makeDividend({ userId: 'user-1', assetId: 'asset-1' })

    dividendRepository.items.push(dividend)
    dividendId = dividend.id
  })

  it('should find a dividend that belongs to the user', async () => {
    const sut = new FindDividendByIdUseCase(dividendRepository)

    const result = await sut.execute('user-1', dividendId)

    expect(result.isRight()).toBe(true)
  })

  it('should not find a dividend that belongs to another user', async () => {
    const sut = new FindDividendByIdUseCase(dividendRepository)

    const result = await sut.execute('user-2', dividendId)

    expect(result.value).toBeInstanceOf(DividendNotFoundError)
  })

  it('should not update a dividend that belongs to another user', async () => {
    const sut = new UpdateDividendUseCase(dividendRepository)

    const result = await sut.execute('user-2', dividendId, { amount: 999 })

    expect(result.value).toBeInstanceOf(DividendNotFoundError)
    expect(dividendRepository.items[0].amount).not.toBe(999)
  })

  it('should not delete a dividend that belongs to another user', async () => {
    const sut = new DeleteDividendUseCase(dividendRepository)

    const result = await sut.execute('user-2', dividendId)

    expect(result.value).toBeInstanceOf(DividendNotFoundError)
    expect(dividendRepository.items).toHaveLength(1)
  })

  it('should delete a dividend that belongs to the user', async () => {
    const sut = new DeleteDividendUseCase(dividendRepository)

    const result = await sut.execute('user-1', dividendId)

    expect(result.isRight()).toBe(true)
    expect(dividendRepository.items).toHaveLength(0)
  })
})
