import { makeBudget } from '@test/factories/make-budget'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryBudgetRepository } from '@test/repositories/in-memory-budget.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { FindAllBudgetsUseCase } from './find-all-budgets'

describe('FindAllBudgetsUseCase', () => {
  let budgetRepository: InMemoryBudgetRepository
  let sut: FindAllBudgetsUseCase

  beforeEach(() => {
    const categoryRepository = new InMemoryCategoryRepository()
    budgetRepository = new InMemoryBudgetRepository(categoryRepository)
    sut = new FindAllBudgetsUseCase(budgetRepository)

    categoryRepository.items.push(
      makeCategory({ id: 'category-1', userId: 'user-1' }),
      makeCategory({ id: 'category-2', userId: 'user-2' })
    )
  })

  it('should return only the budgets of the user as plain objects', async () => {
    const mine = makeBudget({ categoryId: 'category-1', amount: 100 })
    const theirs = makeBudget({ categoryId: 'category-2', amount: 200 })
    budgetRepository.items.push(mine, theirs)

    const result = await sut.execute({ userId: 'user-1' })

    expect(result.isRight()).toBe(true)
    expect(result.value).toHaveLength(1)
    expect(result.value).toMatchObject([{ id: mine.id, amount: 100 }])
  })

  it('should return an empty list when the user has no budgets', async () => {
    const result = await sut.execute({ userId: 'user-3' })

    expect(result.value).toEqual([])
  })
})
