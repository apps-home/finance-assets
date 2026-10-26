import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

import { CategoryType } from '../../domain/category.entity'
import { CreateCategoryUseCase } from './create-category'

describe('CreateCategoryUseCase', () => {
  let repository: InMemoryCategoryRepository
  let sut: CreateCategoryUseCase

  beforeEach(() => {
    repository = new InMemoryCategoryRepository()
    sut = new CreateCategoryUseCase(repository)
  })

  const payload = {
    name: 'Ações BR',
    type: CategoryType.VARIABLE_BR,
    currency: 'BRL',
    userId: 'user-1',
    years: [2025]
  }

  it('should create a category for the user', async () => {
    const result = await sut.execute({ ...payload, targetPercentage: 40 })

    expect(result.isRight()).toBe(true)
    expect(repository.items).toHaveLength(1)
    expect(repository.items[0]).toMatchObject({
      name: 'Ações BR',
      type: CategoryType.VARIABLE_BR,
      currency: 'BRL',
      userId: 'user-1',
      years: [2025],
      targetPercentage: 40
    })
  })

  it('should default the type to FIXED', async () => {
    await sut.execute({ ...payload, type: undefined })

    expect(repository.items[0].type).toBe(CategoryType.FIXED)
  })

  it.each([
    ['a short name', { name: 'a' }],
    ['a short currency', { currency: 'BR' }],
    ['no years', { years: [] }],
    ['a target percentage above 100', { targetPercentage: 101 }],
    ['a negative target percentage', { targetPercentage: -1 }]
  ])('should return a payload error for %s', async (_, override) => {
    const result = await sut.execute({ ...payload, ...override })

    expect(result.value).toBeInstanceOf(PayloadError)
    expect(repository.items).toHaveLength(0)
  })
})
