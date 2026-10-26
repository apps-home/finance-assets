import { makeWishlist } from '@test/factories/make-wishlist'
import { InMemoryWishlistRepository } from '@test/repositories/in-memory-wishlist.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { WishlistNotFoundError } from '../errors/wishlist-not-found.error'
import { FindWishlistByIdUseCase } from './find-wishlist-by-id'

describe('FindWishlistByIdUseCase', () => {
  let repository: InMemoryWishlistRepository
  let sut: FindWishlistByIdUseCase

  beforeEach(() => {
    repository = new InMemoryWishlistRepository()
    sut = new FindWishlistByIdUseCase(repository)
  })

  it('should return the item as a plain object', async () => {
    const item = makeWishlist({
      userId: 'user-1',
      categoryId: 'category-1',
      name: 'Weg',
      ticker: 'wege3',
      targetPrice: 40
    })
    repository.items.push(item)

    const result = await sut.execute('user-1', item.id)

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      id: item.id,
      name: 'Weg',
      ticker: 'WEGE3',
      targetPrice: 40
    })
  })

  it('should return not found for an unknown item', async () => {
    const result = await sut.execute('user-1', 'unknown')

    expect(result.value).toBeInstanceOf(WishlistNotFoundError)
  })
})
