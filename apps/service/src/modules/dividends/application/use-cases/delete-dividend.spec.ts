import { makeDividend } from '@test/factories/make-dividend'
import { InMemoryDividendRepository } from '@test/repositories/in-memory-dividend.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DividendNotFoundError } from '../errors/dividend-not-found.error'
import { DeleteDividendUseCase } from './delete-dividend'

describe('DeleteDividendUseCase', () => {
  let repository: InMemoryDividendRepository
  let sut: DeleteDividendUseCase

  beforeEach(() => {
    repository = new InMemoryDividendRepository()
    sut = new DeleteDividendUseCase(repository)
  })

  it('should delete only the requested dividend', async () => {
    const target = makeDividend({ userId: 'user-1', assetId: 'asset-1' })
    const other = makeDividend({ userId: 'user-1', assetId: 'asset-1' })
    repository.items.push(target, other)

    const result = await sut.execute('user-1', target.id)

    expect(result.isRight()).toBe(true)
    expect(repository.items).toEqual([other])
  })

  it('should not delete a dividend of another user', async () => {
    const dividend = makeDividend({ userId: 'user-1', assetId: 'asset-1' })
    repository.items.push(dividend)

    const result = await sut.execute('user-2', dividend.id)

    expect(result.value).toBeInstanceOf(DividendNotFoundError)
    expect(repository.items).toHaveLength(1)
  })

  it('should return not found for an unknown dividend', async () => {
    const result = await sut.execute('user-1', 'unknown')

    expect(result.value).toBeInstanceOf(DividendNotFoundError)
  })
})
