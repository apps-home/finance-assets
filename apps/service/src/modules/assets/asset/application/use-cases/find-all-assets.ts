import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/utils/Either'
import { AssetHTTPResponse, AssetMapper } from '../../domain/asset.mapper'
import { AssetRepository } from '../../domain/asset.repository'
import { FindAllAssetsParams } from '../../domain/dto/find-all-assets-params.dto'

type FindAllAssetsResponse = Either<Error, AssetHTTPResponse[]>

@Injectable()
export class FindAllAssetsUseCase {
  constructor(private assetRepository: AssetRepository) {}

  async execute(params: FindAllAssetsParams): Promise<FindAllAssetsResponse> {
    const assets = await this.assetRepository.list(params)

    return right(assets.map(AssetMapper.toHTTP))
  }
}
