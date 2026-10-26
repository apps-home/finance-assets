import { makeCategory } from '@test/factories/make-category'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

import { CategoryNotFoundError } from '../errors/category-not-found.error'
import { UpdateCategoryUseCase } from './update-category'

describe('UpdateCategoryUseCase', () => {
  let repository: InMemoryCategoryRepository
  let sut: UpdateCategoryUseCase
  let categoryId: string

  beforeEach(() => {
    repository = new InMemoryCategoryRepository()
    sut = new UpdateCategoryUseCase(repository)

    const category = makeCategory({
      userId: 'user-1',
      name: 'Ações BR',
      currency: 'BRL',
      years: [2025]
    })
    repository.items.push(category)
    categoryId = category.id
  })

  it('should update the given fields and keep the others', async () => {
    const result = await sut.execute('user-1', categoryId, {
      name: 'Renda Variável',
      years: [2025, 2026]
    })

    expect(result.isRight()).toBe(true)
    expect(repository.items[0]).toMatchObject({
      name: 'Renda Variável',
      years: [2025, 2026],
      currency: 'BRL',
      userId: 'user-1'
    })
  })

  it('should ignore undefined fields', async () => {
    await sut.execute('user-1', categoryId, { name: undefined })

    expect(repository.items[0].name).toBe('Ações BR')
  })

  it('should clear the target percentage with null', async () => {
    await sut.execute('user-1', categoryId, { targetPercentage: 30 })
    await sut.execute('user-1', categoryId, { targetPercentage: null })

    expect(repository.items[0].targetPercentage).toBeNull()
  })

  it('should return a payload error for invalid data and keep the category', async () => {
    const result = await sut.execute('user-1', categoryId, {
      targetPercentage: 150
    })

    expect(result.value).toBeInstanceOf(PayloadError)
    expect(repository.items[0].targetPercentage).toBeUndefined()
  })

  it('should return not found for another user', async () => {
    const result = await sut.execute('user-2', categoryId, { name: 'Invasor' })

    expect(result.value).toBeInstanceOf(CategoryNotFoundError)
    expect(repository.items[0].name).toBe('Ações BR')
  })
})
