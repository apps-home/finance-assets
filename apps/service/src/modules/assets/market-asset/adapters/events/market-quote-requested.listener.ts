import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'

import { AssetEvent, AssetEventPayload } from '@/core/domain/events/asset.event'

import { RefreshMarketAssetQuoteUseCase } from '../../application/use-cases/refresh-market-asset-quote'

/**
 * Ativo cadastrado (ou com ticker trocado) apontando para um ticker do
 * catálogo sem cotação recente: busca a cotação em background.
 */
@Injectable()
export class MarketQuoteRequestedListener {
  private readonly logger = new Logger(MarketQuoteRequestedListener.name)

  constructor(
    private readonly refreshMarketAssetQuoteUseCase: RefreshMarketAssetQuoteUseCase
  ) {}

  @OnEvent(AssetEvent.CREATED, { async: true })
  async handle({ assetId, marketAssetId }: AssetEventPayload): Promise<void> {
    this.logger.log(
      `Fetching quote of market asset ${marketAssetId} for asset ${assetId}`
    )

    try {
      await this.refreshMarketAssetQuoteUseCase.execute(marketAssetId)
    } catch (error) {
      this.logger.error(
        `Failed to fetch quote of market asset ${marketAssetId}`,
        error instanceof Error ? error.stack : error
      )
    }
  }
}
