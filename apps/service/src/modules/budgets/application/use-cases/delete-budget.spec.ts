import { makeBudget } from '@test/factories/make-budget'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryBudgetRepository } from '@test/repositories/in-memory-budget.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { BudgetNotFoundError } from '../errors/budget-not-found.error'
import { DeleteBudgetUseCase } from './delete-budget'

describe('DeleteBudgetUseCase', () => {
  let budgetRepository: InMemoryBudgetRepository
  let sut: DeleteBudgetUseCase

  beforeEach(() => {
    const categoryRepository = new InMemoryCategoryRepository()
    budgetRepository = new InMemoryBudgetRepository(categoryRepository)
    sut = new DeleteBudgetUseCase(budgetRepository)

    categoryRepository.items.push(
      makeCategory({ id: 'category-1', userId: 'user-1' })
    )
  })

  it('should delete only the requested budget', async () => {
    const target = makeBudget({ categoryId: 'category-1' })
    const other = makeBudget({ categoryId: 'category-1' })
    budgetRepository.items.push(target, other)

    const result = await sut.execute('user-1', target.id)

    expect(result.isRight()).toBe(true)
    expect(budgetRepository.items).toEqual([other])
  })

  it('should return not found for an unknown budget', async () => {
    const result = await sut.execute('user-1', 'unknown')

    expect(result.value).toBeInstanceOf(BudgetNotFoundError)
  })
})
