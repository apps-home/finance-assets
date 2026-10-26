import { makeCategory } from '@test/factories/make-category'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CategoryNotFoundError } from '../errors/category-not-found.error'
import { DeleteCategoryUseCase } from './delete-category'

describe('DeleteCategoryUseCase', () => {
  let repository: InMemoryCategoryRepository
  let sut: DeleteCategoryUseCase

  beforeEach(() => {
    repository = new InMemoryCategoryRepository()
    sut = new DeleteCategoryUseCase(repository)
  })

  it('should delete only the requested category', async () => {
    const target = makeCategory({ userId: 'user-1' })
    const other = makeCategory({ userId: 'user-1' })
    repository.items.push(target, other)

    const result = await sut.execute('user-1', target.id)

    expect(result.isRight()).toBe(true)
    expect(repository.items).toEqual([other])
  })

  it('should return not found for an unknown category', async () => {
    const result = await sut.execute('user-1', 'unknown')

    expect(result.value).toBeInstanceOf(CategoryNotFoundError)
  })
})
