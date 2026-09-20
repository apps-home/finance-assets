import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'

import { AssetRepository } from '../../domain/asset.repository'
import { UpdateAssetPayload } from '../../domain/dto/update-asset.dto'
import { AssetNotFoundError } from '../errors/asset-not-found.error'

type UpdateAssetResponse = Either<AssetNotFoundError | PayloadError, void>

@Injectable()
export class UpdateAssetUseCase {
  constructor(private assetRepository: AssetRepository) {}

  async execute(
    id: string,
    data: UpdateAssetPayload
  ): Promise<UpdateAssetResponse> {
    const existingAsset = await this.assetRepository.findById(id)

    if (!existingAsset) {
      return left(new AssetNotFoundError())
    }

    try {
      if (
        data.currentClosePrice === undefined &&
        data.averagePrice !== undefined &&
        (existingAsset.currentClosePrice === null ||
          existingAsset.currentClosePrice === existingAsset.averagePrice)
      ) {
        data.currentClosePrice = data.averagePrice
      }

      existingAsset.update(data)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }

    await this.assetRepository.save(existingAsset)

    return right(void 0)
  }
}
