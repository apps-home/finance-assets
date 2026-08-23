import { Injectable } from '@nestjs/common'

import { DomainError } from '@/core/domain/errors/domain-error'
import { Either, left, right } from '@/core/utils/Either'

import { CategoryMapper } from '../../domain/category.mapper'
import { CategoryRepository } from '../../domain/category.repository'
import { CreateCategoryPayload } from '../../domain/dto/create-category.dto'

type CreateCategoryResponse = Either<DomainError, void>

@Injectable()
export class CreateCategoryUseCase {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(data: CreateCategoryPayload): Promise<CreateCategoryResponse> {
    try {
      const category = CategoryMapper.toDomain(data)

      await this.categoryRepository.save(category)

      return right(void 0)
    } catch (error) {
      if (error instanceof DomainError) {
        return left(error)
      }

      throw error
    }
  }
}
