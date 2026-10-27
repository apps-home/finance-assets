import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { AssetEvent, AssetEventPayload } from '@/core/domain/events/asset.event'
import { DomainEventPublisher } from '@/core/domain/events/domain-event-publisher.interface'
import { Either, left, right } from '@/core/utils/Either'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'
import { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'
import { ResolveMarketAssetUseCase } from '@/modules/assets/market-asset/application/use-cases/resolve-market-asset'

import { AssetRepository } from '../../domain/asset.repository'
import { UpdateAssetPayload } from '../../domain/dto/update-asset.dto'
import { checkIndexerForCategory } from '../../domain/fixed-income-valuation'
import { AssetNotFoundError } from '../errors/asset-not-found.error'
import { RevalueFixedIncomeUseCase } from './revalue-fixed-income'

type UpdateAssetResponse = Either<
  AssetNotFoundError | CategoryNotFoundError | PayloadError,
  void
>

@Injectable()
export class UpdateAssetUseCase {
  constructor(
    private assetRepository: AssetRepository,
    private categoryRepository: CategoryRepository,
    private resolveMarketAsset: ResolveMarketAssetUseCase,
    private eventPublisher: DomainEventPublisher,
    private revalueFixedIncome: RevalueFixedIncomeUseCase
  ) {}

  async execute(
    userId: string,
    id: string,
    data: UpdateAssetPayload
  ): Promise<UpdateAssetResponse> {
    const existingAsset = await this.assetRepository.findById(id, userId)

    if (!existingAsset) {
      return left(new AssetNotFoundError())
    }

    const previousTicker = existingAsset.ticker

    if (data.indexer) {
      const category = await this.categoryRepository.findById(
        existingAsset.categoryId,
        userId
      )

      if (!category) {
        return left(new CategoryNotFoundError())
      }

      const indexerError = checkIndexerForCategory(data.indexer, category)

      if (indexerError) {
        return left(new PayloadError(indexerError))
      }
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

    // Outro ticker aponta para outro item do catálogo
    let marketAssetToRefresh: string | null = null

    if (existingAsset.ticker !== previousTicker) {
      const category = await this.categoryRepository.findById(
        existingAsset.categoryId,
        userId
      )

      if (!category) {
        return left(new CategoryNotFoundError())
      }

      const { value: marketAsset } = await this.resolveMarketAsset.execute({
        ticker: existingAsset.ticker,
        type: category.type,
        name: existingAsset.name
      })
      existingAsset.linkMarketAsset(marketAsset)

      if (marketAsset && !marketAsset.hasFreshQuote()) {
        marketAssetToRefresh = marketAsset.id
      }
    }

    await this.assetRepository.save(existingAsset)

    // Taxa, data ou valor aplicado podem ter mudado: recalcula o saldo
    if (existingAsset.indexer) {
      await this.revalueFixedIncome.tryExecute(existingAsset)
    }

    if (marketAssetToRefresh) {
      this.eventPublisher.publish<AssetEventPayload>(
        AssetEvent.CREATED,
        new AssetEventPayload(existingAsset.id, marketAssetToRefresh)
      )
    }

    return right(void 0)
  }
}
