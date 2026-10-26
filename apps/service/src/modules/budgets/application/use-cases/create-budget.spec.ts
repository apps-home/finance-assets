import { makeCategory } from '@test/factories/make-category'
import { InMemoryBudgetRepository } from '@test/repositories/in-memory-budget.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'

import { CreateBudgetUseCase } from './create-budget'

describe('CreateBudgetUseCase', () => {
  const year = new Date().getFullYear()

  let budgetRepository: InMemoryBudgetRepository
  let categoryRepository: InMemoryCategoryRepository
  let sut: CreateBudgetUseCase

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository()
    budgetRepository = new InMemoryBudgetRepository(categoryRepository)
    sut = new CreateBudgetUseCase(budgetRepository, categoryRepository)

    categoryRepository.items.push(
      makeCategory({ id: 'category-1', userId: 'user-1', years: [year] })
    )
  })

  const payload = { categoryId: 'category-1', month: 3, year, amount: 1000 }

  it('should create a budget with the amount as is when there is no exchange rate', async () => {
    const result = await sut.execute('user-1', payload)

    expect(result.isRight()).toBe(true)
    expect(budgetRepository.items).toHaveLength(1)
    expect(budgetRepository.items[0]).toMatchObject({
      categoryId: 'category-1',
      month: 3,
      year,
      amount: 1000,
      exchangeRate: 1
    })
  })

  it('should store the amount converted by the exchange rate', async () => {
    await sut.execute('user-1', { ...payload, amount: 100, exchangeRate: 5.25 })

    expect(budgetRepository.items[0].amount).toBe(525)
    expect(budgetRepository.items[0].exchangeRate).toBe(5.25)
  })

  it('should return not found when the category belongs to another user', async () => {
    const result = await sut.execute('user-2', payload)

    expect(result.value).toBeInstanceOf(CategoryNotFoundError)
    expect(budgetRepository.items).toHaveLength(0)
  })

  it('should reject a year the category is not active for', async () => {
    const result = await sut.execute('user-1', { ...payload, year: year - 5 })

    expect(result.value).toBeInstanceOf(PayloadError)
    expect(budgetRepository.items).toHaveLength(0)
  })

  it('should reject an invalid month', async () => {
    const result = await sut.execute('user-1', { ...payload, month: 13 })

    expect(result.value).toBeInstanceOf(PayloadError)
    expect(budgetRepository.items).toHaveLength(0)
  })

  it('should reject a non positive exchange rate', async () => {
    const result = await sut.execute('user-1', { ...payload, exchangeRate: 0 })

    expect(result.value).toBeInstanceOf(PayloadError)
    expect(budgetRepository.items).toHaveLength(0)
  })

  it('should reject a negative dividend amount', async () => {
    const result = await sut.execute('user-1', {
      ...payload,
      dividendAmount: -1
    })

    expect(result.value).toBeInstanceOf(PayloadError)
  })
})
