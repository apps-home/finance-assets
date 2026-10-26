import { makeCategory } from '@test/factories/make-category'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CategoryNotFoundError } from '../errors/category-not-found.error'
import { FindCategoryByIdUseCase } from './find-category-by-id'

describe('FindCategoryByIdUseCase', () => {
  let repository: InMemoryCategoryRepository
  let sut: FindCategoryByIdUseCase

  beforeEach(() => {
    repository = new InMemoryCategoryRepository()
    sut = new FindCategoryByIdUseCase(repository)
  })

  it('should return the category as a plain object', async () => {
    const category = makeCategory({ userId: 'user-1', name: 'Cripto' })
    repository.items.push(category)

    const result = await sut.execute('user-1', category.id)

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      id: category.id,
      name: 'Cripto',
      userId: 'user-1'
    })
  })

  it('should return not found for another user', async () => {
    const category = makeCategory({ userId: 'user-1' })
    repository.items.push(category)

    const result = await sut.execute('user-2', category.id)

    expect(result.value).toBeInstanceOf(CategoryNotFoundError)
  })

  it('should return not found for an unknown category', async () => {
    const result = await sut.execute('user-1', 'unknown')

    expect(result.value).toBeInstanceOf(CategoryNotFoundError)
  })
})
