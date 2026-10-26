import { makeBudget } from '@test/factories/make-budget'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryBudgetRepository } from '@test/repositories/in-memory-budget.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { BudgetNotFoundError } from '../errors/budget-not-found.error'
import { FindBudgetByIdUseCase } from './find-budget-by-id'

describe('FindBudgetByIdUseCase', () => {
  let budgetRepository: InMemoryBudgetRepository
  let sut: FindBudgetByIdUseCase

  beforeEach(() => {
    const categoryRepository = new InMemoryCategoryRepository()
    budgetRepository = new InMemoryBudgetRepository(categoryRepository)
    sut = new FindBudgetByIdUseCase(budgetRepository)

    categoryRepository.items.push(
      makeCategory({ id: 'category-1', userId: 'user-1' })
    )
  })

  it('should return the budget as a plain object', async () => {
    const budget = makeBudget({
      categoryId: 'category-1',
      month: 2,
      year: 2025,
      amount: 750
    })
    budgetRepository.items.push(budget)

    const result = await sut.execute('user-1', budget.id)

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      id: budget.id,
      categoryId: 'category-1',
      month: 2,
      year: 2025,
      amount: 750
    })
  })

  it('should return not found for an unknown budget', async () => {
    const result = await sut.execute('user-1', 'unknown')

    expect(result.value).toBeInstanceOf(BudgetNotFoundError)
  })
})
