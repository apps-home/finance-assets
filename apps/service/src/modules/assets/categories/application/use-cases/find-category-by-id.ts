import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { CategoryProps } from '../../domain/category.entity'
import { CategoryMapper } from '../../domain/category.mapper'
import { CategoryRepository } from '../../domain/category.repository'
import { CategoryNotFoundError } from '../errors/category-not-found.error'

type FindCategoryByIdResponse = Either<CategoryNotFoundError, CategoryProps>

@Injectable()
export class FindCategoryByIdUseCase {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(id: string): Promise<FindCategoryByIdResponse> {
    const category = await this.categoryRepository.findById(id)

    if (!category) {
      return left(new CategoryNotFoundError())
    }

    return right(CategoryMapper.toHTTP(category))
  }
}
