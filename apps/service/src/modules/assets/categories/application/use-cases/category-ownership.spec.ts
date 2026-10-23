import { makeCategory } from '@test/factories/make-category'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CategoryNotFoundError } from '../errors/category-not-found.error'
import { DeleteCategoryUseCase } from './delete-category'
import { FindCategoryByIdUseCase } from './find-category-by-id'
import { UpdateCategoryUseCase } from './update-category'

describe('Category use cases ownership', () => {
  let categoryRepository: InMemoryCategoryRepository
  let categoryId: string

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository()

    const category = makeCategory({ userId: 'user-1' })

    categoryRepository.items.push(category)
    categoryId = category.id
  })

  it('should find a category that belongs to the user', async () => {
    const sut = new FindCategoryByIdUseCase(categoryRepository)

    const result = await sut.execute('user-1', categoryId)

    expect(result.isRight()).toBe(true)
  })

  it('should not find a category that belongs to another user', async () => {
    const sut = new FindCategoryByIdUseCase(categoryRepository)

    const result = await sut.execute('user-2', categoryId)

    expect(result.value).toBeInstanceOf(CategoryNotFoundError)
  })

  it('should not update a category that belongs to another user', async () => {
    const sut = new UpdateCategoryUseCase(categoryRepository)

    const result = await sut.execute('user-2', categoryId, { name: 'Invasor' })

    expect(result.value).toBeInstanceOf(CategoryNotFoundError)
    expect(categoryRepository.items[0].name).not.toBe('Invasor')
  })

  it('should not delete a category that belongs to another user', async () => {
    const sut = new DeleteCategoryUseCase(categoryRepository)

    const result = await sut.execute('user-2', categoryId)

    expect(result.value).toBeInstanceOf(CategoryNotFoundError)
    expect(categoryRepository.items).toHaveLength(1)
  })
})
