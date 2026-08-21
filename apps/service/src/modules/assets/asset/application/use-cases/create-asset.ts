import { Injectable } from '@nestjs/common'
import { DomainError } from '@/core/domain/errors/domain-error'
import { AssetEvent, AssetEventPayload } from '@/core/domain/events/asset.event'
import { DomainEventPublisher } from '@/core/domain/events/domain-event-publisher.interface'
import { Either, left, right } from '@/core/utils/Either'
import { AssetMapper } from '@/modules/assets/asset/domain/asset.mapper'
import { AssetRepository } from '@/modules/assets/asset/domain/asset.repository'
import { CreateAssetPayload } from '@/modules/assets/asset/domain/dto/create-asset.dto'
import { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'

type CreateAssetResponse = Either<DomainError, void>

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
        return left(new Error('Category not found'))
      }

      const asset = AssetMapper.toDomain(data)

      await this.assetRepository.save(asset)

      this.eventPublisher.publish<AssetEventPayload>(
        AssetEvent.CREATED,
        new AssetEventPayload(asset.id, asset.ticker!, category.type)
      )

      return right(void 0)
    } catch (error) {
      if (error instanceof DomainError) {
        return left(error)
      }

      throw error
    }
  }
}
