import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'

import { JOBS, QUEUES } from '@/core/domain/queue/queue.constants'

import { SyncAssetDividendsUseCase } from '../../application/use-cases/sync-asset-dividends'
import { SyncDividendsJobData } from './sync-dividends-job.dto'

@Processor(QUEUES.DIVIDEND_PROCESSING)
export class SyncDividendsProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncDividendsProcessor.name)

  constructor(
    private readonly syncAssetDividendsUseCase: SyncAssetDividendsUseCase
  ) {
    super()
  }

  async process(job: Job<SyncDividendsJobData>): Promise<void> {
    switch (job.name) {
      case JOBS.DIVIDEND.SYNC:
        await this.sync(job.data)
        break

      default:
        this.logger.warn(`Unknown job name: ${job.name}`)
    }
  }

  private async sync(data: SyncDividendsJobData) {
    this.logger.log(`Processing dividends sync for ticker ${data.ticker}`)

    try {
      await this.syncAssetDividendsUseCase.execute(data)
    } catch (error) {
      this.logger.error(
        `Failed to sync dividends for ticker "${data.ticker}"`,
        error instanceof Error ? error.stack : error
      )
    }
  }
}
