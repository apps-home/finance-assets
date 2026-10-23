import { FakeEventPublisher } from '@test/events/fake-event-publisher'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'

import { CreateAssetUseCase } from './create-asset'

describe('CreateAssetUseCase', () => {
  let categoryRepository: InMemoryCategoryRepository
  let assetRepository: InMemoryAssetRepository
  let eventPublisher: FakeEventPublisher
  let sut: CreateAssetUseCase

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)
    eventPublisher = new FakeEventPublisher()
    sut = new CreateAssetUseCase(
      assetRepository,
      categoryRepository,
      eventPublisher
    )
  })

  it('should create an asset in a category owned by the user', async () => {
    const category = makeCategory({ userId: 'user-1' })
    categoryRepository.items.push(category)

    const result = await sut.execute('user-1', {
      name: 'Tesouro Selic',
      categoryId: category.id
    })

    expect(result.isRight()).toBe(true)
    expect(assetRepository.items).toHaveLength(1)
  })

  it('should not create an asset in a category owned by another user', async () => {
    const category = makeCategory({ userId: 'user-1' })
    categoryRepository.items.push(category)

    const result = await sut.execute('user-2', {
      name: 'Tesouro Selic',
      categoryId: category.id
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(CategoryNotFoundError)
    expect(assetRepository.items).toHaveLength(0)
  })

  it('should not create an asset in a category that does not exist', async () => {
    const result = await sut.execute('user-1', {
      name: 'Tesouro Selic',
      categoryId: crypto.randomUUID()
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(CategoryNotFoundError)
  })
})
