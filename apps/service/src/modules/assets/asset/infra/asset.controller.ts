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

import { CreateAssetUseCase } from '../application/use-cases/create-asset'
import { DeleteAssetUseCase } from '../application/use-cases/delete-asset'
import { FindAssetByIdUseCase } from '../application/use-cases/find-asset-by-id'
import { FindAssetsUseCase } from '../application/use-cases/find-assets'
import { GetAssetPriceHistoryUseCase } from '../application/use-cases/get-asset-price-history'
import { GetPortfolioSummaryUseCase } from '../application/use-cases/get-portfolio-summary'
import { UpdateAssetUseCase } from '../application/use-cases/update-asset'
import {
  AssetPriceHistoryParamsDTO,
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
    private readonly deleteAssetUseCase: DeleteAssetUseCase,
    private readonly getPortfolioSummaryUseCase: GetPortfolioSummaryUseCase,
    private readonly getAssetPriceHistoryUseCase: GetAssetPriceHistoryUseCase
  ) {}

  @Post()
  async create(@Body() data: CreateAssetDTO, @CurrentUserId() userId: string) {
    const result = await this.createAssetUseCase.execute(userId, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Asset created successfully' }
  }

  @Get()
  async findAll(
    @Query() params: FindAssetsParamsDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.findAssetsUseCase.execute({
      ...params,
      userId: userId
    })

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Get('portfolio')
  async portfolio(@CurrentUserId() userId: string) {
    const result = await this.getPortfolioSummaryUseCase.execute(userId)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Get(':id/history')
  async history(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() { range }: AssetPriceHistoryParamsDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.getAssetPriceHistoryUseCase.execute(
      userId,
      id,
      range
    )

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
    const result = await this.findAssetByIdUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateAssetDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.updateAssetUseCase.execute(userId, id, data)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Asset updated successfully' }
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.deleteAssetUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Asset deleted successfully' }
  }
}
