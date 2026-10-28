import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query
} from '@nestjs/common'

import { CurrentUserId } from '@/infra/auth/current-user-id.decorator'
import { toHttpException } from '@/infra/http/to-http-exception'

import { CreatePriceAlertUseCase } from '../application/use-cases/create-price-alert'
import { DeletePriceAlertUseCase } from '../application/use-cases/delete-price-alert'
import { ListPriceAlertsUseCase } from '../application/use-cases/list-price-alerts'
import { PriceAlertMapper } from '../domain/price-alert.mapper'
import {
  CreatePriceAlertDTO,
  ListPriceAlertsParamsDTO
} from './price-alert.dto'

@Controller('price-alerts')
export class PriceAlertController {
  constructor(
    private readonly createPriceAlertUseCase: CreatePriceAlertUseCase,
    private readonly listPriceAlertsUseCase: ListPriceAlertsUseCase,
    private readonly deletePriceAlertUseCase: DeletePriceAlertUseCase
  ) {}

  @Post()
  async create(
    @Body() data: CreatePriceAlertDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.createPriceAlertUseCase.execute(userId, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Price alert created successfully' }
  }

  @Get()
  async list(
    @Query() params: ListPriceAlertsParamsDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.listPriceAlertsUseCase.execute(userId, params)

    return result.value.map(PriceAlertMapper.toHTTP)
  }

  @Delete(':id')
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.deletePriceAlertUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Price alert deleted successfully' }
  }
}
