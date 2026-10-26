import { makeBudget } from '@test/factories/make-budget'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryBudgetRepository } from '@test/repositories/in-memory-budget.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

import { BudgetNotFoundError } from '../errors/budget-not-found.error'
import { UpdateBudgetUseCase } from './update-budget'

describe('UpdateBudgetUseCase', () => {
  let budgetRepository: InMemoryBudgetRepository
  let sut: UpdateBudgetUseCase
  let budgetId: string

  beforeEach(() => {
    const categoryRepository = new InMemoryCategoryRepository()
    budgetRepository = new InMemoryBudgetRepository(categoryRepository)
    sut = new UpdateBudgetUseCase(budgetRepository)

    categoryRepository.items.push(
      makeCategory({ id: 'category-1', userId: 'user-1' })
    )

    // 100 (original) * 5 = 500 (stored)
    const budget = makeBudget({
      categoryId: 'category-1',
      month: 1,
      year: 2025,
      amount: 500,
      exchangeRate: 5
    })
    budgetRepository.items.push(budget)
    budgetId = budget.id
  })

  it('should convert the new amount by the current exchange rate', async () => {
    const result = await sut.execute('user-1', budgetId, { amount: 200 })

    expect(result.isRight()).toBe(true)
    expect(budgetRepository.items[0].amount).toBe(1000)
    expect(budgetRepository.items[0].exchangeRate).toBe(5)
  })

  it('should keep the original amount when only the exchange rate changes', async () => {
    await sut.execute('user-1', budgetId, { exchangeRate: 6 })

    // original 100 * 6
    expect(budgetRepository.items[0].amount).toBe(600)
    expect(budgetRepository.items[0].exchangeRate).toBe(6)
  })

  it('should update the dividend amount without touching the amount', async () => {
    await sut.execute('user-1', budgetId, { dividendAmount: 30 })

    expect(budgetRepository.items[0].dividendAmount).toBe(30)
    expect(budgetRepository.items[0].amount).toBe(500)
  })

  it('should reject an invalid exchange rate and keep the budget unchanged', async () => {
    const result = await sut.execute('user-1', budgetId, { exchangeRate: -1 })

    expect(result.value).toBeInstanceOf(PayloadError)
    expect(budgetRepository.items[0].amount).toBe(500)
  })

  it('should reject a negative dividend amount', async () => {
    const result = await sut.execute('user-1', budgetId, {
      dividendAmount: -5
    })

    expect(result.value).toBeInstanceOf(PayloadError)
  })

  it('should return not found for another user', async () => {
    const result = await sut.execute('user-2', budgetId, { amount: 1 })

    expect(result.value).toBeInstanceOf(BudgetNotFoundError)
  })

  it('should return not found for an unknown budget', async () => {
    const result = await sut.execute('user-1', 'unknown', { amount: 1 })

    expect(result.value).toBeInstanceOf(BudgetNotFoundError)
  })
})
