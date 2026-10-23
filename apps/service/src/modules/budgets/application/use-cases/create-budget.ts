import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'
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

  async execute(
    userId: string,
    data: CreateBudgetPayload
  ): Promise<CreateBudgetResponse> {
    try {
      const category = await this.categoryRepository.findById(
        data.categoryId,
        userId
      )

      if (!category) {
        return left(new CategoryNotFoundError())
      }

      if (!category.years.includes(data.year)) {
        return left(
          new PayloadError(
            `Category "${category.name}" is not active for year ${data.year}`
          )
        )
      }

      const budget = BudgetMapper.toDomain(data)

      budget.changeAmount(data.amount, data.exchangeRate ?? 1)

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
