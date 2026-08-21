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
import { BudgetNotFoundError } from '../application/errors/budget-not-found.error'
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
  async create(@Body() data: CreateBudgetDTO) {
    const result = await this.createBudgetUseCase.execute(data)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case DomainError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return { message: 'Budget created successfully' }
  }

  @Get()
  async findAll(@Query() params: FindAllBudgetsParamsDTO, @Req() request: any) {
    const result = await this.findAllBudgetsUseCase.execute({
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
    const result = await this.findBudgetByIdUseCase.execute(id)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case BudgetNotFoundError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return result.value
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateBudgetDTO) {
    const result = await this.updateBudgetUseCase.execute(id, data)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case BudgetNotFoundError:
        case DomainError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return { message: 'Budget updated successfully' }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.deleteBudgetUseCase.execute(id)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case BudgetNotFoundError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return { message: 'Budget deleted successfully' }
  }
}
