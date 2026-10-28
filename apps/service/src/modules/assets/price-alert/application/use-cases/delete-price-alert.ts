import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { PriceAlertRepository } from '../../domain/price-alert.repository'
import { PriceAlertNotFoundError } from '../errors/price-alert-not-found.error'

type DeletePriceAlertResponse = Either<PriceAlertNotFoundError, void>

@Injectable()
export class DeletePriceAlertUseCase {
  constructor(private readonly priceAlertRepository: PriceAlertRepository) {}

  async execute(userId: string, id: string): Promise<DeletePriceAlertResponse> {
    const alert = await this.priceAlertRepository.findById(id, userId)

    if (!alert) {
      return left(new PriceAlertNotFoundError())
    }

    await this.priceAlertRepository.delete(alert.id)

    return right(void 0)
  }
}
