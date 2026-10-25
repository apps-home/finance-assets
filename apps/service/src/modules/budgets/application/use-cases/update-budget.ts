import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'

import { BudgetRepository } from '../../domain/budget.repository'
import { UpdateBudgetPayload } from '../../domain/dto/update-budget.dto'
import { BudgetNotFoundError } from '../errors/budget-not-found.error'

type UpdateBudgetResponse = Either<BudgetNotFoundError | PayloadError, void>

@Injectable()
export class UpdateBudgetUseCase {
  constructor(private budgetRepository: BudgetRepository) {}

  async execute(
    userId: string,
    id: string,
    data: UpdateBudgetPayload
  ): Promise<UpdateBudgetResponse> {
    const existingBudget = await this.budgetRepository.findById(id, userId)

    if (!existingBudget) {
      return left(new BudgetNotFoundError())
    }

    try {
      const { amount, exchangeRate, dividendAmount, contributionAmount } = data

      existingBudget.update({ dividendAmount, contributionAmount })

      if (amount !== undefined || exchangeRate !== undefined) {
        existingBudget.changeAmount(
          amount ?? existingBudget.originalAmount,
          exchangeRate ?? existingBudget.exchangeRate ?? 1
        )
      }
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }

    await this.budgetRepository.save(existingBudget)

    return right(void 0)
  }
}
