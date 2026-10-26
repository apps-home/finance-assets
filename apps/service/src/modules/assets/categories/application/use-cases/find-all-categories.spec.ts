import { makeCategory } from '@test/factories/make-category'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { FindAllCategoriesUseCase } from './find-all-categories'

describe('FindAllCategoriesUseCase', () => {
  let repository: InMemoryCategoryRepository
  let sut: FindAllCategoriesUseCase

  beforeEach(() => {
    repository = new InMemoryCategoryRepository()
    sut = new FindAllCategoriesUseCase(repository)
  })

  it('should return the categories as plain objects', async () => {
    const category = makeCategory({ userId: 'user-1', name: 'Cripto' })
    repository.items.push(category)

    const result = await sut.execute({ userId: 'user-1' })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual([
      {
        id: category.id,
        name: 'Cripto',
        type: category.type,
        targetPercentage: category.targetPercentage,
        currency: category.currency,
        userId: 'user-1',
        years: category.years,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    ])
  })

  it('should return an empty list when there are no categories', async () => {
    const result = await sut.execute({ userId: 'user-1' })

    expect(result.value).toEqual([])
  })
})
