import { Injectable } from '@nestjs/common'

import { DomainError } from '@/core/domain/errors/domain-error'
import { Either, left, right } from '@/core/utils/Either'

import { AssetRepository } from '../../domain/asset.repository'
import { UpdateAssetPayload } from '../../domain/dto/update-asset.dto'
import { AssetNotFoundError } from '../errors/asset-not-found.error'

type UpdateAssetResponse = Either<AssetNotFoundError | DomainError, void>

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
      existingAsset.update(data)
    } catch (error) {
      if (error instanceof DomainError) {
        return left(error)
      }

      throw error
    }

    await this.assetRepository.save(existingAsset)

    return right(void 0)
  }
}
