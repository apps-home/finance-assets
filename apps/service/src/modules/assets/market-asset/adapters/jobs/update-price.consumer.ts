import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'

import { JOBS, QUEUES } from '@/core/domain/queue/queue.constants'

import { RefreshMarketAssetQuoteUseCase } from '../../application/use-cases/refresh-market-asset-quote'
import { UpdateMarketPriceJobData } from './update-price-job.dto'

@Processor(QUEUES.ASSET_PROCESSING)
export class UpdateMarketPriceProcessor extends WorkerHost {
  private readonly logger = new Logger(UpdateMarketPriceProcessor.name)

  constructor(
    private readonly refreshMarketAssetQuoteUseCase: RefreshMarketAssetQuoteUseCase
  ) {
    super()
  }

  async process(job: Job<UpdateMarketPriceJobData>): Promise<void> {
    switch (job.name) {
      case JOBS.ASSET.UPDATE_PRICE:
        await this.updatePrice(job.data)
        break

      default:
        this.logger.warn(`Unknown job name: ${job.name}`)
    }
  }

  private async updatePrice({
    marketAssetId,
    ticker
  }: UpdateMarketPriceJobData) {
    // Jobs enfileirados antes do catálogo não têm marketAssetId
    if (!marketAssetId) {
      this.logger.warn(`Skipping legacy price job for ticker ${ticker}`)
      return
    }

    this.logger.log(`Processing price update for ticker ${ticker}`)

    try {
      const result = await this.refreshMarketAssetQuoteUseCase.execute(
        marketAssetId,
        { force: true }
      )

      if (result.isLeft()) {
        this.logger.warn(`Market asset ${marketAssetId} (${ticker}) not found`)
      }
    } catch (error) {
      this.logger.error(
        `Failed to update ticker "${ticker}" with market data`,
        error instanceof Error ? error.stack : error
      )
    }
  }
}
