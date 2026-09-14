import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException
} from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'

import { WishlistNotFoundError } from '../application/errors/wishlist-not-found.error'
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
  async create(@Body() data: CreateWishlistDTO, @Req() request: any) {
    const userId = request.headers['user-id']

    if (!userId) {
      throw new UnauthorizedException('User ID is missing from headers')
    }

    const result = await this.createWishlistUseCase.execute({
      ...data,
      userId
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case CategoryNotFoundError:
          throw new NotFoundException(error.message)
        case PayloadError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return { message: 'Wishlist item created successfully' }
  }

  @Get()
  async findAll(
    @Query() params: FindAllWishlistParamsDTO,
    @Req() request: any
  ) {
    const userId = request.headers['user-id']

    if (!userId) {
      throw new UnauthorizedException('User ID is missing from headers')
    }

    const result = await this.findAllWishlistUseCase.execute({
      ...params,
      userId
    })

    if (result.isLeft()) {
      throw new InternalServerErrorException('Unexpected error')
    }

    return result.value
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.findWishlistByIdUseCase.execute(id)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case WishlistNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return result.value
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateWishlistDTO) {
    const result = await this.updateWishlistUseCase.execute(id, data)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case WishlistNotFoundError:
          throw new NotFoundException(error.message)
        case PayloadError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return { message: 'Wishlist item updated successfully' }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.deleteWishlistUseCase.execute(id)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case WishlistNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return { message: 'Wishlist item deleted successfully' }
  }
}
