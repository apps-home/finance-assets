import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'

import { BudgetProps } from '../../domain/budget.entity'
import { BudgetMapper } from '../../domain/budget.mapper'
import { BudgetRepository } from '../../domain/budget.repository'
import { FindAllBudgetsParams } from '../../domain/dto/find-all-budgets-params.dto'

type FindAllBudgetsResponse = Either<Error, BudgetProps[]>

@Injectable()
export class FindAllBudgetsUseCase {
  constructor(private budgetRepository: BudgetRepository) {}

  async execute(params: FindAllBudgetsParams): Promise<FindAllBudgetsResponse> {
    const budgets = await this.budgetRepository.list(params)

    return right(budgets.map(BudgetMapper.toHTTP))
  }
}
