import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

import { DomainJobPublisher } from '@/core/domain/queue/domain-job-publisher.interface'
import { QUEUES } from '@/core/domain/queue/queue.constants'
import { AssetRepository } from '@/modules/assets/asset/domain/asset.repository'

import { buildSyncJobs } from '../build-sync-jobs'

@Injectable()
export class SyncDividendsCron {
  private readonly logger = new Logger(SyncDividendsCron.name)
  private isRunning = false

  constructor(
    private readonly jobPublisher: DomainJobPublisher,
    private readonly assetRepository: AssetRepository
  ) {}

  // Toda segunda-feira às 08:00 (America/Sao_Paulo)
  @Cron('0 8 * * 1', { timeZone: 'America/Sao_Paulo' })
  async handleCron(): Promise<void> {
    if (this.isRunning) {
      this.logger.log('Dividends sync cron job is already running.')
      return
    }

    this.isRunning = true

    try {
      const items = await this.assetRepository.findAllActiveWithUserDetails()

      const jobs = buildSyncJobs(
        items.map(({ asset, category, user }) => ({
          assetId: asset.id,
          ticker: asset.ticker,
          userId: user.id,
          categoryId: category.id,
          categoryType: category.type,
          currency: category.currency
        }))
      )

      await this.jobPublisher.publishBulk(QUEUES.DIVIDEND_PROCESSING, jobs)

      this.logger.log(`Enqueued ${jobs.length} tickers for dividends sync.`)
    } catch (error) {
      this.logger.error(
        'Failed to enqueue dividends sync',
        error instanceof Error ? error.stack : error
      )
    } finally {
      this.isRunning = false
    }
  }
}
