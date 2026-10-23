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

import { AssetNotFoundError } from '../application/errors/asset-not-found.error'
import { CreateAssetUseCase } from '../application/use-cases/create-asset'
import { DeleteAssetUseCase } from '../application/use-cases/delete-asset'
import { FindAssetByIdUseCase } from '../application/use-cases/find-asset-by-id'
import { FindAssetsUseCase } from '../application/use-cases/find-assets'
import { UpdateAssetUseCase } from '../application/use-cases/update-asset'
import {
  CreateAssetDTO,
  FindAssetsParamsDTO,
  UpdateAssetDTO
} from './asset.dto'

@Controller('assets')
export class AssetController {
  constructor(
    private readonly createAssetUseCase: CreateAssetUseCase,
    private readonly findAssetsUseCase: FindAssetsUseCase,
    private readonly findAssetByIdUseCase: FindAssetByIdUseCase,
    private readonly updateAssetUseCase: UpdateAssetUseCase,
    private readonly deleteAssetUseCase: DeleteAssetUseCase
  ) {}

  @Post()
  async create(@Body() data: CreateAssetDTO, @Req() request: any) {
    const result = await this.createAssetUseCase.execute(
      this.getUserId(request),
      data
    )

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

    return { message: 'Asset created successfully' }
  }

  @Get()
  async findAll(@Query() params: FindAssetsParamsDTO, @Req() request: any) {
    const result = await this.findAssetsUseCase.execute({
      ...params,
      userId: this.getUserId(request)
    })

    if (result.isLeft()) {
      throw new InternalServerErrorException('Unexpected error')
    }

    return result.value
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() request: any) {
    const result = await this.findAssetByIdUseCase.execute(
      this.getUserId(request),
      id
    )

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case AssetNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return result.value
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateAssetDTO,
    @Req() request: any
  ) {
    const result = await this.updateAssetUseCase.execute(
      this.getUserId(request),
      id,
      data
    )

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case AssetNotFoundError:
          throw new NotFoundException(error.message)
        case PayloadError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return { message: 'Asset updated successfully' }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() request: any) {
    const result = await this.deleteAssetUseCase.execute(
      this.getUserId(request),
      id
    )

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case AssetNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return { message: 'Asset deleted successfully' }
  }

  private getUserId(request: any): string {
    const userId = request.headers['user-id']

    if (!userId) {
      throw new UnauthorizedException('User ID is missing from headers')
    }

    return userId
  }
}
