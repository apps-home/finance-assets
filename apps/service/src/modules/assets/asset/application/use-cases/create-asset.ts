import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { AssetEvent, AssetEventPayload } from '@/core/domain/events/asset.event'
import { DomainEventPublisher } from '@/core/domain/events/domain-event-publisher.interface'
import { Either, left, right } from '@/core/utils/Either'
import { AssetMapper } from '@/modules/assets/asset/domain/asset.mapper'
import { AssetRepository } from '@/modules/assets/asset/domain/asset.repository'
import { CreateAssetPayload } from '@/modules/assets/asset/domain/dto/create-asset.dto'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'
import { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'

type CreateAssetResponse = Either<CategoryNotFoundError | PayloadError, void>

@Injectable()
export class CreateAssetUseCase {
  constructor(
    private assetRepository: AssetRepository,
    private categoryRepository: CategoryRepository,
    private eventPublisher: DomainEventPublisher
  ) {}

  async execute(data: CreateAssetPayload): Promise<CreateAssetResponse> {
    try {
      const category = await this.categoryRepository.findById(data.categoryId)

      if (!category) {
        return left(new CategoryNotFoundError())
      }

      const isFixedIncome = category.type === CategoryType.FIXED

      if (!isFixedIncome && (!data.ticker || data.ticker.trim().length === 0)) {
        return left(
          new PayloadError(
            'Ticker is required for variable income and crypto assets'
          )
        )
      }

      const asset = AssetMapper.toDomain(data)

      await this.assetRepository.save(asset)

      if (asset.ticker) {
        this.eventPublisher.publish<AssetEventPayload>(
          AssetEvent.CREATED,
          new AssetEventPayload(asset.id, asset.ticker, category.type)
        )
      }

      return right(void 0)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }
  }
}
