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
  Query
} from '@nestjs/common'

import { DomainError } from '@/core/domain/errors/domain-error'

import { AssetNotFoundError } from '../application/errors/asset-not-found.error'
import { CreateAssetUseCase } from '../application/use-cases/create-asset'
import { DeleteAssetUseCase } from '../application/use-cases/delete-asset'
import { FindAllAssetsUseCase } from '../application/use-cases/find-all-assets'
import { FindAssetByIdUseCase } from '../application/use-cases/find-asset-by-id'
import { UpdateAssetUseCase } from '../application/use-cases/update-asset'
import {
  CreateAssetDTO,
  FindAllAssetsParamsDTO,
  UpdateAssetDTO
} from './asset.dto'

@Controller('categories/:categoryId/assets')
export class AssetController {
  constructor(
    private readonly createAssetUseCase: CreateAssetUseCase,
    private readonly findAllAssetsUseCase: FindAllAssetsUseCase,
    private readonly findAssetByIdUseCase: FindAssetByIdUseCase,
    private readonly updateAssetUseCase: UpdateAssetUseCase,
    private readonly deleteAssetUseCase: DeleteAssetUseCase
  ) {}

  @Post()
  async create(
    @Param('categoryId') categoryId: string,
    @Body() data: CreateAssetDTO
  ) {
    const result = await this.createAssetUseCase.execute({
      ...data,
      categoryId
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case DomainError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return { message: 'Asset created successfully' }
  }

  @Get()
  async findAll(
    @Param('categoryId') categoryId: string,
    @Query() params: FindAllAssetsParamsDTO
  ) {
    const result = await this.findAllAssetsUseCase.execute({
      ...params,
      categoryId
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
    const result = await this.findAssetByIdUseCase.execute(id)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case AssetNotFoundError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return result.value
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateAssetDTO) {
    const result = await this.updateAssetUseCase.execute(id, data)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case AssetNotFoundError:
        case DomainError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return { message: 'Asset updated successfully' }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.deleteAssetUseCase.execute(id)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case AssetNotFoundError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return { message: 'Asset deleted successfully' }
  }
}
