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

import { CreateWishlistUseCase } from '../application/use-cases/create-wishlist'
import { DeleteWishlistUseCase } from '../application/use-cases/delete-wishlist'
import { FindAllWishlistUseCase } from '../application/use-cases/find-all-wishlist'
import { FindWishlistByIdUseCase } from '../application/use-cases/find-wishlist-by-id'
import { UpdateWishlistUseCase } from '../application/use-cases/update-wishlist'
import {
  CreateWishlistDTO,
  FindAllWishlistParamsDTO,
  UpdateWishlistDTO
} from './wishlist.dto'

@Controller('wishlist')
export class WishlistController {
  constructor(
    private readonly createWishlistUseCase: CreateWishlistUseCase,
    private readonly findAllWishlistUseCase: FindAllWishlistUseCase,
    private readonly findWishlistByIdUseCase: FindWishlistByIdUseCase,
    private readonly updateWishlistUseCase: UpdateWishlistUseCase,
    private readonly deleteWishlistUseCase: DeleteWishlistUseCase
  ) {}

  @Post()
  async create(
    @Body() data: CreateWishlistDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.createWishlistUseCase.execute({
      ...data,
      userId
    })

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Wishlist item created successfully' }
  }

  @Get()
  async findAll(
    @Query() params: FindAllWishlistParamsDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.findAllWishlistUseCase.execute({
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
    const result = await this.findWishlistByIdUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateWishlistDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.updateWishlistUseCase.execute(userId, id, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Wishlist item updated successfully' }
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.deleteWishlistUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Wishlist item deleted successfully' }
  }
}
