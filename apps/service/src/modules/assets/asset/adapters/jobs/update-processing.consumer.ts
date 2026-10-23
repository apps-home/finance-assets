import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'

import { JOBS, QUEUES } from '@/core/domain/queue/queue.constants'

import { UpdateAssetPriceUseCase } from '../../application/use-cases/update-asset-price'
import {
  AssetPriceQueueJobData,
  UpdateAssetPriceJobData
} from './update-processing-job.dto'

@Processor(QUEUES.ASSET_PROCESSING)
export class UpdateAssetPriceProcessor extends WorkerHost {
  private readonly logger = new Logger(UpdateAssetPriceProcessor.name)

  constructor(
    private readonly updateAssetPriceUseCase: UpdateAssetPriceUseCase
  ) {
    super()
  }

  async process(job: Job<AssetPriceQueueJobData>): Promise<void> {
    switch (job.name) {
      case JOBS.ASSET.UPDATE_PRICE:
        await this.updatePrice(job.data)
        break

      default:
        this.logger.warn(`Unknown job name: ${job.name}`)
    }
  }

  private async updatePrice(jobPayload: UpdateAssetPriceJobData) {
    const { ticker, categoryType, assetId, assetIds, wishlistIds } = jobPayload

    this.logger.log(`Processing price update for ticker ${ticker}`)

    try {
      await this.updateAssetPriceUseCase.execute({
        ticker,
        categoryType,
        assetId,
        assetIds,
        wishlistIds
      })
    } catch (error) {
      this.logger.error(
        `Failed to update ticker "${ticker}" with market data`,
        error instanceof Error ? error.stack : error
      )
    }
  }
}
