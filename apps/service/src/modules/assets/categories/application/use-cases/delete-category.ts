import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { CategoryRepository } from '../../domain/category.repository'
import { CategoryNotFoundError } from '../errors/category-not-found.error'

type DeleteCategoryResponse = Either<CategoryNotFoundError, void>

@Injectable()
export class DeleteCategoryUseCase {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(id: string): Promise<DeleteCategoryResponse> {
    const category = await this.categoryRepository.findById(id)

    if (!category) {
      return left(new CategoryNotFoundError())
    }

    await this.categoryRepository.delete(id)

    return right(void 0)
  }
}
