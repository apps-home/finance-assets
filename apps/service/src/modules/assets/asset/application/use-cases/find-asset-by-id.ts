import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { AssetProps } from '../../domain/asset.entity'
import { AssetMapper } from '../../domain/asset.mapper'
import { AssetRepository } from '../../domain/asset.repository'
import { AssetNotFoundError } from '../errors/asset-not-found.error'

type FindAssetByIdResponse = Either<AssetNotFoundError, AssetProps>

@Injectable()
export class FindAssetByIdUseCase {
  constructor(private assetRepository: AssetRepository) {}

  async execute(id: string): Promise<FindAssetByIdResponse> {
    const asset = await this.assetRepository.findById(id)

    if (!asset) {
      return left(new AssetNotFoundError())
    }

    return right(AssetMapper.toHTTP(asset))
  }
}
