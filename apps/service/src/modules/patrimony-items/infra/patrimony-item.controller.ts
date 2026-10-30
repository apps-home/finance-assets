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

import { CreatePatrimonyItemUseCase } from '../application/use-cases/create-patrimony-item'
import { DeletePatrimonyItemUseCase } from '../application/use-cases/delete-patrimony-item'
import { FindAllPatrimonyItemsUseCase } from '../application/use-cases/find-all-patrimony-items'
import { UpdatePatrimonyItemUseCase } from '../application/use-cases/update-patrimony-item'
import {
  CreatePatrimonyItemDTO,
  FindAllPatrimonyItemsParamsDTO,
  UpdatePatrimonyItemDTO
} from './patrimony-item.dto'

@Controller('patrimony-items')
export class PatrimonyItemController {
  constructor(
    private readonly createPatrimonyItemUseCase: CreatePatrimonyItemUseCase,
    private readonly findAllPatrimonyItemsUseCase: FindAllPatrimonyItemsUseCase,
    private readonly updatePatrimonyItemUseCase: UpdatePatrimonyItemUseCase,
    private readonly deletePatrimonyItemUseCase: DeletePatrimonyItemUseCase
  ) {}

  @Post()
  async create(
    @Body() data: CreatePatrimonyItemDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.createPatrimonyItemUseCase.execute({
      ...data,
      userId
    })

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Patrimony item created successfully' }
  }

  @Get()
  async findAll(
    @Query() params: FindAllPatrimonyItemsParamsDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.findAllPatrimonyItemsUseCase.execute({
      ...params,
      userId
    })

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdatePatrimonyItemDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.updatePatrimonyItemUseCase.execute(
      userId,
      id,
      data
    )

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Patrimony item updated successfully' }
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.deletePatrimonyItemUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Patrimony item deleted successfully' }
  }
}
