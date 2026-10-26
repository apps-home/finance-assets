import { makeCategory } from '@test/factories/make-category'
import { makeWishlist } from '@test/factories/make-wishlist'
import { makeMarketAssetUseCases } from '@test/market-asset/make-market-asset-use-cases'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { InMemoryWishlistRepository } from '@test/repositories/in-memory-wishlist.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { WishlistNotFoundError } from '../errors/wishlist-not-found.error'
import { DeleteWishlistUseCase } from './delete-wishlist'
import { FindWishlistByIdUseCase } from './find-wishlist-by-id'
import { UpdateWishlistUseCase } from './update-wishlist'

describe('Wishlist use cases ownership', () => {
  let wishlistRepository: InMemoryWishlistRepository
  let itemId: string

  beforeEach(() => {
    wishlistRepository = new InMemoryWishlistRepository()

    const category = makeCategory({ userId: 'user-1' })
    const item = makeWishlist({ userId: 'user-1', categoryId: category.id })

    wishlistRepository.items.push(item)
    itemId = item.id
  })

  it('should find an item that belongs to the user', async () => {
    const sut = new FindWishlistByIdUseCase(wishlistRepository)

    const result = await sut.execute('user-1', itemId)

    expect(result.isRight()).toBe(true)
  })

  it('should not find an item that belongs to another user', async () => {
    const sut = new FindWishlistByIdUseCase(wishlistRepository)

    const result = await sut.execute('user-2', itemId)

    expect(result.value).toBeInstanceOf(WishlistNotFoundError)
  })

  it('should not update an item that belongs to another user', async () => {
    const sut = new UpdateWishlistUseCase(
      wishlistRepository,
      new InMemoryCategoryRepository(),
      makeMarketAssetUseCases().resolveWithQuote
    )

    const result = await sut.execute('user-2', itemId, { name: 'Invasor' })

    expect(result.value).toBeInstanceOf(WishlistNotFoundError)
    expect(wishlistRepository.items[0].name).not.toBe('Invasor')
  })

  it('should not delete an item that belongs to another user', async () => {
    const sut = new DeleteWishlistUseCase(wishlistRepository)

    const result = await sut.execute('user-2', itemId)

    expect(result.value).toBeInstanceOf(WishlistNotFoundError)
    expect(wishlistRepository.items).toHaveLength(1)
  })

  it('should delete an item that belongs to the user', async () => {
    const sut = new DeleteWishlistUseCase(wishlistRepository)

    const result = await sut.execute('user-1', itemId)

    expect(result.isRight()).toBe(true)
    expect(wishlistRepository.items).toHaveLength(0)
  })
})
