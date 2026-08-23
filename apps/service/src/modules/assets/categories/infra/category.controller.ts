import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Query,
  Req
} from '@nestjs/common'

import { DomainError } from '@/core/domain/errors/domain-error'

import { CategoryNotFoundError } from '../application/errors/category-not-found.error'
import { CreateCategoryUseCase } from '../application/use-cases/create-category'
import { DeleteCategoryUseCase } from '../application/use-cases/delete-category'
import { FindAllCategoriesUseCase } from '../application/use-cases/find-all-categories'
import { FindCategoryByIdUseCase } from '../application/use-cases/find-category-by-id'
import { UpdateCategoryUseCase } from '../application/use-cases/update-category'
import {
  CreateCategoryDTO,
  FindAllCategoriesParamsDTO,
  UpdateCategoryDTO
} from './category.dto'

@Controller('categories')
export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly findAllCategoriesUseCase: FindAllCategoriesUseCase,
    private readonly findCategoryByIdUseCase: FindCategoryByIdUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase
  ) {}

  @Post()
  async create(@Body() data: CreateCategoryDTO, @Req() request: any) {
    const result = await this.createCategoryUseCase.execute({
      ...data,
      userId: request.headers['user-id']
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case DomainError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return { message: 'Category created successfully' }
  }

  @Get()
  async findAll(
    @Query() params: FindAllCategoriesParamsDTO,
    @Req() request: any
  ) {
    const result = await this.findAllCategoriesUseCase.execute({
      ...params,
      userId: request.headers['user-id']
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case Error:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return result.value
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.findCategoryByIdUseCase.execute(id)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case CategoryNotFoundError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return result.value
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateCategoryDTO) {
    const result = await this.updateCategoryUseCase.execute(id, data)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case CategoryNotFoundError:
        case DomainError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return { message: 'Category updated successfully' }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.deleteCategoryUseCase.execute(id)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case CategoryNotFoundError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return { message: 'Category deleted successfully' }
  }
}
