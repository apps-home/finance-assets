import { Injectable } from '@nestjs/common'

import {
  PriceHistoryGateway,
  type PriceHistoryRange
} from '@/core/http/external/market-data/price-history.gateway'
import { Either, left, right } from '@/core/utils/Either'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'
import { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'

import { AssetRepository } from '../../domain/asset.repository'
import { AssetNotFoundError } from '../errors/asset-not-found.error'
import { PriceHistoryUnavailableError } from '../errors/price-history-unavailable.error'

export interface AssetPriceHistory {
  ticker: string
  currency: string
  range: PriceHistoryRange
  points: Array<{ date: Date; close: number }>
  change: number
  changePercent: number | null
}

type GetAssetPriceHistoryResponse = Either<
  AssetNotFoundError | CategoryNotFoundError | PriceHistoryUnavailableError,
  AssetPriceHistory
>

@Injectable()
export class GetAssetPriceHistoryUseCase {
  constructor(
    private assetRepository: AssetRepository,
    private categoryRepository: CategoryRepository,
    private priceHistoryGateway: PriceHistoryGateway
  ) {}

  async execute(
    userId: string,
    id: string,
    range: PriceHistoryRange
  ): Promise<GetAssetPriceHistoryResponse> {
    const asset = await this.assetRepository.findById(id, userId)

    if (!asset) {
      return left(new AssetNotFoundError())
    }

    const category = await this.categoryRepository.findById(
      asset.categoryId,
      userId
    )

    if (!category) {
      return left(new CategoryNotFoundError())
    }

    const points = asset.ticker
      ? await this.priceHistoryGateway.fetchHistory(
          asset.ticker,
          category.type,
          range
        )
      : null

    if (!points || points.length === 0) {
      return left(new PriceHistoryUnavailableError())
    }

    const first = points[0].close
    const last = points[points.length - 1].close

    return right({
      ticker: asset.ticker,
      currency: category.currency,
      range,
      points,
      change: last - first,
      changePercent: first !== 0 ? (last / first - 1) * 100 : null
    })
  }
}
