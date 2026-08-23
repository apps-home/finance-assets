import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { BudgetProps } from '../../domain/budget.entity'
import { BudgetMapper } from '../../domain/budget.mapper'
import { BudgetRepository } from '../../domain/budget.repository'
import { BudgetNotFoundError } from '../errors/budget-not-found.error'

type FindBudgetByIdResponse = Either<BudgetNotFoundError, BudgetProps>

@Injectable()
export class FindBudgetByIdUseCase {
  constructor(private budgetRepository: BudgetRepository) {}

  async execute(id: string): Promise<FindBudgetByIdResponse> {
    const budget = await this.budgetRepository.findById(id)

    if (!budget) {
      return left(new BudgetNotFoundError('Budget not found'))
    }

    return right(BudgetMapper.toHTTP(budget))
  }
}
