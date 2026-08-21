import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/utils/Either'
import { AssetRepository } from '../../domain/asset.repository'
import { AssetNotFoundError } from '../errors/asset-not-found.error'

type DeleteAssetResponse = Either<AssetNotFoundError, void>

@Injectable()
export class DeleteAssetUseCase {
  constructor(private assetRepository: AssetRepository) {}

  async execute(id: string): Promise<DeleteAssetResponse> {
    const asset = await this.assetRepository.findById(id)

    if (!asset) {
      return left(new AssetNotFoundError())
    }

    await this.assetRepository.delete(id)

    return right(void 0)
  }
}
