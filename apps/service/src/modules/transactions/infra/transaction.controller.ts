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

import { CurrentUserId } from '@/infra/auth/current-user-id.decorator'
import { toHttpException } from '@/infra/http/to-http-exception'

import { CreateTransactionUseCase } from '../application/use-cases/create-transaction'
import { DeleteTransactionUseCase } from '../application/use-cases/delete-transaction'
import { FindAllTransactionsUseCase } from '../application/use-cases/find-all-transactions'
import { GetMonthlyContributionsUseCase } from '../application/use-cases/get-monthly-contributions'
import { UpdateTransactionUseCase } from '../application/use-cases/update-transaction'
import {
  CreateTransactionDTO,
  FindAllTransactionsParamsDTO,
  MonthlyContributionsParamsDTO,
  UpdateTransactionDTO
} from './transaction.dto'

@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly findAllTransactionsUseCase: FindAllTransactionsUseCase,
    private readonly updateTransactionUseCase: UpdateTransactionUseCase,
    private readonly deleteTransactionUseCase: DeleteTransactionUseCase,
    private readonly getMonthlyContributionsUseCase: GetMonthlyContributionsUseCase
  ) {}

  @Post()
  async create(
    @Body() data: CreateTransactionDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.createTransactionUseCase.execute(userId, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return {
      message: 'Transaction created successfully',
      openingCreated: result.value.openingCreated
    }
  }

  @Get()
  async findAll(
    @Query() params: FindAllTransactionsParamsDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.findAllTransactionsUseCase.execute({
      ...params,
      userId
    })

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  // Rota fixa antes de ':id' para não ser capturada pelo parâmetro
  @Get('contributions')
  async contributions(
    @Query() { year, month }: MonthlyContributionsParamsDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.getMonthlyContributionsUseCase.execute(
      userId,
      year,
      month
    )

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateTransactionDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.updateTransactionUseCase.execute(userId, id, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Transaction updated successfully' }
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.deleteTransactionUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Transaction deleted successfully' }
  }
}
