import { CurrentUserId } from '@lib/auth/nest'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query
} from '@nestjs/common'

import { toHttpException } from '@/infra/http/to-http-exception'

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
  async create(
    @Body() data: CreateCategoryDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.createCategoryUseCase.execute({
      ...data,
      userId
    })

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Category created successfully' }
  }

  @Get()
  async findAll(
    @Query() params: FindAllCategoriesParamsDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.findAllCategoriesUseCase.execute({
      ...params,
      userId
    })

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.findCategoryByIdUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateCategoryDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.updateCategoryUseCase.execute(userId, id, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Category updated successfully' }
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.deleteCategoryUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Category deleted successfully' }
  }
}
