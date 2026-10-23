import { makeCategory } from '@test/factories/make-category'
import { InMemoryBudgetRepository } from '@test/repositories/in-memory-budget.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CreateBudgetUseCase } from './create-budget'
import { UpdateBudgetUseCase } from './update-budget'

describe('Budget exchange rate', () => {
  const year = new Date().getFullYear()

  let categoryRepository: InMemoryCategoryRepository
  let budgetRepository: InMemoryBudgetRepository
  let createBudget: CreateBudgetUseCase
  let updateBudget: UpdateBudgetUseCase

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository()
    budgetRepository = new InMemoryBudgetRepository(categoryRepository)
    createBudget = new CreateBudgetUseCase(budgetRepository, categoryRepository)
    updateBudget = new UpdateBudgetUseCase(budgetRepository)

    categoryRepository.items.push(
      makeCategory({ id: 'category-1', userId: 'user-1', years: [year] })
    )
  })

  it('should convert the amount by the exchange rate when creating', async () => {
    const result = await createBudget.execute('user-1', {
      categoryId: 'category-1',
      month: 1,
      year,
      amount: 1000,
      exchangeRate: 5
    })

    expect(result.isRight()).toBe(true)
    expect(budgetRepository.items[0].amount).toBe(5000)
  })

  it('should default the exchange rate to 1 when it is not sent', async () => {
    const result = await createBudget.execute('user-1', {
      categoryId: 'category-1',
      month: 1,
      year,
      amount: 1000
    })

    expect(result.isRight()).toBe(true)
    expect(budgetRepository.items[0].amount).toBe(1000)
    expect(budgetRepository.items[0].exchangeRate).toBe(1)
  })

  it('should not compound the rate when the stored value is updated again', async () => {
    await createBudget.execute('user-1', {
      categoryId: 'category-1',
      month: 1,
      year,
      amount: 1000,
      exchangeRate: 5
    })

    const budget = budgetRepository.items[0]

    await updateBudget.execute('user-1', budget.id, {
      amount: budget.originalAmount,
      exchangeRate: 5
    })
    await updateBudget.execute('user-1', budget.id, {
      amount: budget.originalAmount,
      exchangeRate: 5
    })

    expect(budgetRepository.items[0].amount).toBe(5000)
  })

  it('should recalculate from the original amount when only the rate changes', async () => {
    await createBudget.execute('user-1', {
      categoryId: 'category-1',
      month: 1,
      year,
      amount: 1000,
      exchangeRate: 5
    })

    const budget = budgetRepository.items[0]

    await updateBudget.execute('user-1', budget.id, { exchangeRate: 6 })

    expect(budgetRepository.items[0].amount).toBe(6000)
    expect(budgetRepository.items[0].originalAmount).toBe(1000)
  })
})
