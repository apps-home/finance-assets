import { makeBudget } from '@test/factories/make-budget'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryBudgetRepository } from '@test/repositories/in-memory-budget.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'

import { BudgetNotFoundError } from '../errors/budget-not-found.error'
import { CreateBudgetUseCase } from './create-budget'
import { DeleteBudgetUseCase } from './delete-budget'
import { FindAllBudgetsUseCase } from './find-all-budgets'
import { FindBudgetByIdUseCase } from './find-budget-by-id'

describe('Budget use cases ownership', () => {
  let categoryRepository: InMemoryCategoryRepository
  let budgetRepository: InMemoryBudgetRepository
  let categoryId: string
  let budgetId: string

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository()
    budgetRepository = new InMemoryBudgetRepository(categoryRepository)

    const category = makeCategory({ userId: 'user-1' })
    const budget = makeBudget({ categoryId: category.id })

    categoryRepository.items.push(category)
    budgetRepository.items.push(budget)
    categoryId = category.id
    budgetId = budget.id
  })

  it('should not create a budget in a category owned by another user', async () => {
    const sut = new CreateBudgetUseCase(budgetRepository, categoryRepository)

    const result = await sut.execute('user-2', {
      categoryId,
      month: 1,
      year: new Date().getFullYear(),
      amount: 100
    })

    expect(result.value).toBeInstanceOf(CategoryNotFoundError)
  })

  it('should find a budget that belongs to the user', async () => {
    const sut = new FindBudgetByIdUseCase(budgetRepository)

    const result = await sut.execute('user-1', budgetId)

    expect(result.isRight()).toBe(true)
  })

  it('should not find a budget that belongs to another user', async () => {
    const sut = new FindBudgetByIdUseCase(budgetRepository)

    const result = await sut.execute('user-2', budgetId)

    expect(result.value).toBeInstanceOf(BudgetNotFoundError)
  })

  it('should not delete a budget that belongs to another user', async () => {
    const sut = new DeleteBudgetUseCase(budgetRepository)

    const result = await sut.execute('user-2', budgetId)

    expect(result.value).toBeInstanceOf(BudgetNotFoundError)
    expect(budgetRepository.items).toHaveLength(1)
  })

  it('should list only the budgets of the user', async () => {
    const sut = new FindAllBudgetsUseCase(budgetRepository)

    const own = await sut.execute({ userId: 'user-1' })
    const other = await sut.execute({ userId: 'user-2' })

    expect(own.value).toHaveLength(1)
    expect(other.value).toHaveLength(0)
  })
})
