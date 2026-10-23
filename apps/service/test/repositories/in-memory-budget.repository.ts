import type { Budget } from '@/modules/budgets/domain/budget.entity'
import type { BudgetRepository } from '@/modules/budgets/domain/budget.repository'
import type { FindAllBudgetsParams } from '@/modules/budgets/domain/dto/find-all-budgets-params.dto'

import type { InMemoryCategoryRepository } from './in-memory-category.repository'

export class InMemoryBudgetRepository implements BudgetRepository {
  public items: Budget[] = []

  constructor(private categoryRepository: InMemoryCategoryRepository) {}

  private belongsToUser(budget: Budget, userId: string) {
    const category = this.categoryRepository.items.find(
      (item) => item.id === budget.categoryId
    )

    return category?.userId === userId
  }

  async list(params: FindAllBudgetsParams): Promise<Budget[]> {
    return this.items.filter((budget) =>
      this.belongsToUser(budget, params.userId)
    )
  }

  async save(budget: Budget): Promise<void> {
    const index = this.items.findIndex((item) => item.id === budget.id)

    if (index >= 0) {
      this.items[index] = budget
    } else {
      this.items.push(budget)
    }
  }

  async findById(id: string, userId: string): Promise<Budget | null> {
    const budget = this.items.find((item) => item.id === id)

    return budget && this.belongsToUser(budget, userId) ? budget : null
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id)
  }
}
