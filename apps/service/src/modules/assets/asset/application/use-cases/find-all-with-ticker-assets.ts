import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/utils/Either'
import {
  AssetRepository,
  AssetWithCategoryType
} from '../../domain/asset.repository'

type FindAllWithTickerAssetsResponse = Either<Error, AssetWithCategoryType[]>

@Injectable()
export class FindAllWithTickerAssetsUseCase {
  constructor(private assetRepository: AssetRepository) {}

  async execute(): Promise<FindAllWithTickerAssetsResponse> {
    const assets = await this.assetRepository.findAllWithTicker()

    return right(assets)
  }
}
