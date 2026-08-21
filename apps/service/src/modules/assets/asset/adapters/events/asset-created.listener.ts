import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AssetEvent, AssetEventPayload } from '@/core/domain/events/asset.event'
import { UpdateAssetPriceUseCase } from '../../application/use-cases/update-asset-price'

@Injectable()
export class AssetCreatedListener {
  private readonly logger = new Logger(AssetCreatedListener.name)

  constructor(
    private readonly updateAssetPriceUseCase: UpdateAssetPriceUseCase
  ) {}

  @OnEvent(AssetEvent.CREATED, { async: true })
  async handle(payload: AssetEventPayload): Promise<void> {
    const { assetId, ticker, categoryType } = payload

    this.logger.log(
      `Asset created event received: ${assetId} (ticker: ${ticker ?? 'none'}) — category type: ${categoryType}`
    )

    try {
      await this.updateAssetPriceUseCase.execute({
        assetId,
        ticker,
        categoryType
      })
    } catch (error) {
      this.logger.error(
        `Failed to update asset "${ticker}" with market data`,
        error instanceof Error ? error.stack : error
      )
    }
  }
}
