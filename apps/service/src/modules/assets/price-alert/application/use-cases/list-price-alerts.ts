import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'

import {
  PriceAlertRepository,
  type PriceAlertWithDetails
} from '../../domain/price-alert.repository'

export interface ListPriceAlertsFilters {
  assetId?: string
  wishlistId?: string
}

type ListPriceAlertsResponse = Either<never, PriceAlertWithDetails[]>

@Injectable()
export class ListPriceAlertsUseCase {
  constructor(private readonly priceAlertRepository: PriceAlertRepository) {}

  async execute(
    userId: string,
    filters: ListPriceAlertsFilters = {}
  ): Promise<ListPriceAlertsResponse> {
    const alerts = await this.priceAlertRepository.list({ userId, ...filters })

    return right(alerts)
  }
}
