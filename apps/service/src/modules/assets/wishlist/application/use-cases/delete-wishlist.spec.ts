import { makeWishlist } from '@test/factories/make-wishlist'
import { InMemoryWishlistRepository } from '@test/repositories/in-memory-wishlist.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { WishlistNotFoundError } from '../errors/wishlist-not-found.error'
import { DeleteWishlistUseCase } from './delete-wishlist'

describe('DeleteWishlistUseCase', () => {
  let repository: InMemoryWishlistRepository
  let sut: DeleteWishlistUseCase

  beforeEach(() => {
    repository = new InMemoryWishlistRepository()
    sut = new DeleteWishlistUseCase(repository)
  })

  it('should delete only the requested item', async () => {
    const target = makeWishlist({ userId: 'user-1', categoryId: 'category-1' })
    const other = makeWishlist({ userId: 'user-1', categoryId: 'category-1' })
    repository.items.push(target, other)

    const result = await sut.execute('user-1', target.id)

    expect(result.isRight()).toBe(true)
    expect(repository.items).toEqual([other])
  })

  it('should return not found for an unknown item', async () => {
    const result = await sut.execute('user-1', 'unknown')

    expect(result.value).toBeInstanceOf(WishlistNotFoundError)
  })
})
