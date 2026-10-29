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

import { CreateBudgetUseCase } from '../application/use-cases/create-budget'
import { DeleteBudgetUseCase } from '../application/use-cases/delete-budget'
import { FindAllBudgetsUseCase } from '../application/use-cases/find-all-budgets'
import { FindBudgetByIdUseCase } from '../application/use-cases/find-budget-by-id'
import { UpdateBudgetUseCase } from '../application/use-cases/update-budget'
import {
  CreateBudgetDTO,
  FindAllBudgetsParamsDTO,
  UpdateBudgetDTO
} from './budget.dto'

@Controller('budgets')
export class BudgetController {
  constructor(
    private readonly createBudgetUseCase: CreateBudgetUseCase,
    private readonly findAllBudgetsUseCase: FindAllBudgetsUseCase,
    private readonly findBudgetByIdUseCase: FindBudgetByIdUseCase,
    private readonly updateBudgetUseCase: UpdateBudgetUseCase,
    private readonly deleteBudgetUseCase: DeleteBudgetUseCase
  ) {}

  @Post()
  async create(@Body() data: CreateBudgetDTO, @CurrentUserId() userId: string) {
    const result = await this.createBudgetUseCase.execute(userId, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Budget created successfully' }
  }

  @Get()
  async findAll(
    @Query() params: FindAllBudgetsParamsDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.findAllBudgetsUseCase.execute({
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
    const result = await this.findBudgetByIdUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateBudgetDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.updateBudgetUseCase.execute(userId, id, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Budget updated successfully' }
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.deleteBudgetUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Budget deleted successfully' }
  }
}
