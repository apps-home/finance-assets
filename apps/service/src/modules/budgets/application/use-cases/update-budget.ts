import { Injectable } from '@nestjs/common'

import { DomainError } from '@/core/domain/errors/domain-error'
import { Either, left, right } from '@/core/utils/Either'

import { BudgetRepository } from '../../domain/budget.repository'
import { UpdateBudgetPayload } from '../../domain/dto/update-budget.dto'
import { BudgetNotFoundError } from '../errors/budget-not-found.error'

type UpdateBudgetResponse = Either<BudgetNotFoundError | DomainError, void>

@Injectable()
export class UpdateBudgetUseCase {
  constructor(private budgetRepository: BudgetRepository) {}

  async execute(
    id: string,
    data: UpdateBudgetPayload
  ): Promise<UpdateBudgetResponse> {
    const existingBudget = await this.budgetRepository.findById(id)

    if (!existingBudget) {
      return left(new BudgetNotFoundError('Budget not found'))
    }

    try {
      existingBudget.updateAmountWithExchangeRate(data.exchangeRate || 1)
      existingBudget.update(data)
    } catch (error) {
      if (error instanceof DomainError) {
        return left(error)
      }

      throw error
    }

    await this.budgetRepository.save(existingBudget)

    return right(void 0)
  }
}
