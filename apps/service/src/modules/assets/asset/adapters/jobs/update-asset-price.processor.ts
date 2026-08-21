import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { JOBS, QUEUES } from '@/core/domain/queue/queue.constants'
import { UpdateAssetPriceUseCase } from '../../application/use-cases/update-asset-price'
import {
  AssetPriceQueueJobData,
  UpdateAssetPriceJobData
} from './update-asset-price-job.dto'

@Processor(QUEUES.ASSET_PRICE_UPDATE)
export class UpdateAssetPriceProcessor extends WorkerHost {
  private readonly logger = new Logger(UpdateAssetPriceProcessor.name)

  constructor(
    private readonly updateAssetPriceUseCase: UpdateAssetPriceUseCase
  ) {
    super()
  }

  async process(job: Job<AssetPriceQueueJobData>): Promise<void> {
    switch (job.name) {
      case JOBS.ASSET_PRICE_UPDATE.UPDATE_PRICE:
        await this.updatePrice(job.data)
        break

      default:
        this.logger.warn(`Unknown job name: ${job.name}`)
    }
  }

  private async updatePrice(jobPayload: UpdateAssetPriceJobData) {
    const { assetId, ticker, categoryType } = jobPayload

    this.logger.log(`Processing price update for asset ${assetId} (${ticker})`)

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
