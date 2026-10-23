import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { BudgetRepository } from '../../domain/budget.repository'
import { BudgetNotFoundError } from '../errors/budget-not-found.error'

type DeleteBudgetResponse = Either<BudgetNotFoundError, void>

@Injectable()
export class DeleteBudgetUseCase {
  constructor(private budgetRepository: BudgetRepository) {}

  async execute(userId: string, id: string): Promise<DeleteBudgetResponse> {
    const budget = await this.budgetRepository.findById(id, userId)

    if (!budget) {
      return left(new BudgetNotFoundError())
    }

    await this.budgetRepository.delete(id)

    return right(void 0)
  }
}
