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

import { BackfillDividendsUseCase } from '../application/use-cases/backfill-dividends'
import { CreateDividendUseCase } from '../application/use-cases/create-dividend'
import { DeleteDividendUseCase } from '../application/use-cases/delete-dividend'
import { FindAllDividendsUseCase } from '../application/use-cases/find-all-dividends'
import { FindDividendByIdUseCase } from '../application/use-cases/find-dividend-by-id'
import { GetDividendsSummaryUseCase } from '../application/use-cases/get-dividends-summary'
import { GetUpcomingDividendsUseCase } from '../application/use-cases/get-upcoming-dividends'
import { UpdateDividendUseCase } from '../application/use-cases/update-dividend'
import {
  BackfillDividendsDTO,
  CreateDividendDTO,
  DividendsSummaryParamsDTO,
  FindAllDividendsParamsDTO,
  UpdateDividendDTO
} from './dividend.dto'

@Controller('dividends')
export class DividendController {
  constructor(
    private readonly backfillDividendsUseCase: BackfillDividendsUseCase,
    private readonly createDividendUseCase: CreateDividendUseCase,
    private readonly findAllDividendsUseCase: FindAllDividendsUseCase,
    private readonly findDividendByIdUseCase: FindDividendByIdUseCase,
    private readonly updateDividendUseCase: UpdateDividendUseCase,
    private readonly deleteDividendUseCase: DeleteDividendUseCase,
    private readonly getDividendsSummaryUseCase: GetDividendsSummaryUseCase,
    private readonly getUpcomingDividendsUseCase: GetUpcomingDividendsUseCase
  ) {}

  @Post()
  async create(
    @Body() data: CreateDividendDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.createDividendUseCase.execute({
      ...data,
      userId
    })

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Dividend created successfully' }
  }

  // Importa o histórico recente de proventos em segundo plano (fila)
  @Post('backfill')
  async backfill(
    @Body() { months }: BackfillDividendsDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.backfillDividendsUseCase.execute(userId, months)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return {
      message: 'Dividends import started',
      enqueued: result.value.enqueued
    }
  }

  @Get()
  async findAll(
    @Query() { year, ...params }: FindAllDividendsParamsDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.findAllDividendsUseCase.execute({
      ...params,
      userId,
      ...(year && {
        from: new Date(Date.UTC(year, 0, 1)),
        to: new Date(Date.UTC(year, 11, 31))
      })
    })

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  // Rotas fixas antes de ':id' para não serem capturadas pelo parâmetro
  @Get('summary')
  async summary(
    @Query() { year }: DividendsSummaryParamsDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.getDividendsSummaryUseCase.execute(userId, year)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Get('upcoming')
  async upcoming(@CurrentUserId() userId: string) {
    const result = await this.getUpcomingDividendsUseCase.execute(userId)

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
    const result = await this.findDividendByIdUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateDividendDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.updateDividendUseCase.execute(userId, id, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Dividend updated successfully' }
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.deleteDividendUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Dividend deleted successfully' }
  }
}
