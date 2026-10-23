import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'

import { CategoryRepository } from '../../domain/category.repository'
import { UpdateCategoryPayload } from '../../domain/dto/update-category.dto'
import { CategoryNotFoundError } from '../errors/category-not-found.error'

type UpdateCategoryResponse = Either<CategoryNotFoundError | PayloadError, void>

@Injectable()
export class UpdateCategoryUseCase {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(
    userId: string,
    id: string,
    data: UpdateCategoryPayload
  ): Promise<UpdateCategoryResponse> {
    const existingCategory = await this.categoryRepository.findById(id, userId)

    if (!existingCategory) {
      return left(new CategoryNotFoundError())
    }

    try {
      existingCategory.update(data)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }

    await this.categoryRepository.save(existingCategory)

    return right(void 0)
  }
}
