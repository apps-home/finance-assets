import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'

import { BudgetMapper } from '../../domain/budget.mapper'
import { BudgetRepository } from '../../domain/budget.repository'
import { CreateBudgetPayload } from '../../domain/dto/create-budget.dto'

type CreateBudgetResponse = Either<Error, void>

@Injectable()
export class CreateBudgetUseCase {
  constructor(
    private budgetRepository: BudgetRepository,
    private categoryRepository: CategoryRepository
  ) {}

  async execute(data: CreateBudgetPayload): Promise<CreateBudgetResponse> {
    try {
      const category = await this.categoryRepository.findById(data.categoryId)

      if (!category) {
        return left(new PayloadError('Category not found'))
      }

      if (!category.years.includes(data.year)) {
        return left(
          new PayloadError(
            `Category "${category.name}" is not active for year ${data.year}`
          )
        )
      }

      const budget = BudgetMapper.toDomain(data)

      budget.updateAmountWithExchangeRate(data.exchangeRate || 1)

      await this.budgetRepository.save(budget)

      return right(void 0)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }
  }
}
