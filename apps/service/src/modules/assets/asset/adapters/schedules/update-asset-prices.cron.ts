import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { DomainJobPublisher } from '@/core/domain/queue/domain-job-publisher.interface'
import { JOBS, QUEUES } from '@/core/domain/queue/queue.constants'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { FindAllWithTickerAssetsUseCase } from '../../application/use-cases/find-all-with-ticker-assets'

/**
 * Delay between requests per provider (in ms).
 * - Alpha Vantage (VARIABLE_US): free tier allows max ~25 req/day, 1 req/sec burst.
 * - Brapi (VARIABLE_BR): has rate limits, 5s spacing as safety margin.
 * - CoinGecko (CRYPTO): free tier ~10-30 req/min, 10s spacing as safety margin.
 * - FIXED: no external API call, no delay needed.
 */
const PROVIDER_DELAY_MS: Record<CategoryType, number> = {
  [CategoryType.VARIABLE_US]: 15_000,
  [CategoryType.VARIABLE_BR]: 5_000,
  [CategoryType.CRYPTO]: 10_000,
  [CategoryType.FIXED]: 0
}

@Injectable()
export class UpdateAssetPricesCron {
  private readonly logger = new Logger(UpdateAssetPricesCron.name)
  private isRunning = false

  constructor(
    private readonly jobPublisher: DomainJobPublisher,
    private readonly findAllWithTickerUseCase: FindAllWithTickerAssetsUseCase
  ) {}

  @Cron(CronExpression.MONDAY_TO_FRIDAY_AT_8PM, {
    timeZone: 'America/Sao_Paulo'
  })
  async handleCron(): Promise<void> {
    if (this.isRunning) {
      this.logger.log('Daily asset price update cron job is already running.')
      return
    }

    this.isRunning = true
    this.logger.log('Starting daily asset price update cron job...')

    const result = await this.findAllWithTickerUseCase.execute()

    if (result.isLeft()) {
      this.logger.error('Failed to fetch assets for price update')
      this.isRunning = false
      return
    }

    const assets = result.value

    const providerIndex: Record<string, number> = {}

    await this.jobPublisher.publishBulk(
      QUEUES.ASSET_PRICE_UPDATE,
      assets.map((asset) => {
        const categoryType = asset.categoryType
        const delayPerRequest = PROVIDER_DELAY_MS[categoryType] ?? 0

        if (!providerIndex[categoryType]) {
          providerIndex[categoryType] = 0
        }

        const index = providerIndex[categoryType]++
        const delay = index * delayPerRequest

        return {
          name: JOBS.ASSET_PRICE_UPDATE.UPDATE_PRICE,
          data: {
            assetId: asset.asset.id,
            ticker: asset.asset.ticker!,
            categoryType
          },
          ...(delay > 0 && { opts: { delay } })
        }
      })
    )

    this.logger.log('All assets enqueued for price update.')
    this.isRunning = false
  }
}
