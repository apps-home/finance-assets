import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'

import {
  MarketAssetEvent,
  MarketAssetQuoteUpdatedPayload
} from '@/core/domain/events/market-asset.event'

import { EvaluatePriceAlertsUseCase } from '../../application/use-cases/evaluate-price-alerts'

/**
 * Cotação nova no catálogo (cron das 19h, "Atualizar cotações" ou cadastro):
 * confere os alertas de preço do ticker.
 */
@Injectable()
export class MarketQuoteUpdatedListener {
  private readonly logger = new Logger(MarketQuoteUpdatedListener.name)

  constructor(
    private readonly evaluatePriceAlertsUseCase: EvaluatePriceAlertsUseCase
  ) {}

  @OnEvent(MarketAssetEvent.QUOTE_UPDATED, { async: true })
  async handle({
    marketAssetId,
    price,
    updatedAt
  }: MarketAssetQuoteUpdatedPayload): Promise<void> {
    try {
      await this.evaluatePriceAlertsUseCase.execute({
        marketAssetId,
        price,
        at: updatedAt
      })
    } catch (error) {
      this.logger.error(
        `Failed to evaluate price alerts of market asset ${marketAssetId}`,
        error instanceof Error ? error.stack : error
      )
    }
  }
}
