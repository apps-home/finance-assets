import { Module } from '@nestjs/common'

import { CreateCategoryUseCase } from './application/use-cases/create-category'
import { DeleteCategoryUseCase } from './application/use-cases/delete-category'
import { FindAllCategoriesUseCase } from './application/use-cases/find-all-categories'
import { FindCategoryByIdUseCase } from './application/use-cases/find-category-by-id'
import { UpdateCategoryUseCase } from './application/use-cases/update-category'
import { CategoryRepository } from './domain/category.repository'
import { CategoryController } from './infra/category.controller'
import { PrismaCategoryRepository } from './infra/repositories/prisma.category.repository'

@Module({
  controllers: [CategoryController],
  providers: [
    { provide: CategoryRepository, useClass: PrismaCategoryRepository },
    CreateCategoryUseCase,
    FindAllCategoriesUseCase,
    FindCategoryByIdUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase
  ],
  exports: [CategoryRepository]
})
export class CategoryModule {}
