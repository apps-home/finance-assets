import { makeCategory } from '@test/factories/make-category'
import { InMemoryBudgetRepository } from '@test/repositories/in-memory-budget.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CreateBudgetUseCase } from './create-budget'
import { UpdateBudgetUseCase } from './update-budget'

describe('Budget contribution', () => {
  const year = new Date().getFullYear()

  let budgetRepository: InMemoryBudgetRepository
  let createBudget: CreateBudgetUseCase
  let updateBudget: UpdateBudgetUseCase

  beforeEach(() => {
    const categoryRepository = new InMemoryCategoryRepository()
    budgetRepository = new InMemoryBudgetRepository(categoryRepository)
    createBudget = new CreateBudgetUseCase(budgetRepository, categoryRepository)
    updateBudget = new UpdateBudgetUseCase(budgetRepository)

    categoryRepository.items.push(
      makeCategory({ id: 'category-1', userId: 'user-1', years: [year] })
    )
  })

  it('should store the contribution when creating', async () => {
    const result = await createBudget.execute('user-1', {
      categoryId: 'category-1',
      month: 1,
      year,
      amount: 1000,
      contributionAmount: 250
    })

    expect(result.isRight()).toBe(true)
    expect(budgetRepository.items[0].contributionAmount).toBe(250)
  })

  it('should not convert the contribution by the exchange rate', async () => {
    await createBudget.execute('user-1', {
      categoryId: 'category-1',
      month: 1,
      year,
      amount: 1000,
      exchangeRate: 5,
      contributionAmount: 250
    })

    expect(budgetRepository.items[0].amount).toBe(5000)
    expect(budgetRepository.items[0].contributionAmount).toBe(250)
  })

  it('should update only the contribution and keep the amount', async () => {
    await createBudget.execute('user-1', {
      categoryId: 'category-1',
      month: 1,
      year,
      amount: 1000
    })
    const budget = budgetRepository.items[0]

    const result = await updateBudget.execute('user-1', budget.id, {
      contributionAmount: 400
    })

    expect(result.isRight()).toBe(true)
    expect(budgetRepository.items[0].contributionAmount).toBe(400)
    expect(budgetRepository.items[0].amount).toBe(1000)
  })

  it('should keep the contribution when it is not sent on update', async () => {
    await createBudget.execute('user-1', {
      categoryId: 'category-1',
      month: 1,
      year,
      amount: 1000,
      contributionAmount: 300
    })
    const budget = budgetRepository.items[0]

    await updateBudget.execute('user-1', budget.id, { amount: 1200 })

    expect(budgetRepository.items[0].contributionAmount).toBe(300)
  })

  it('should clear the contribution with null', async () => {
    await createBudget.execute('user-1', {
      categoryId: 'category-1',
      month: 1,
      year,
      amount: 1000,
      contributionAmount: 300
    })
    const budget = budgetRepository.items[0]

    await updateBudget.execute('user-1', budget.id, {
      contributionAmount: null
    })

    expect(budgetRepository.items[0].contributionAmount).toBeNull()
  })
})
