import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { DomainJobPublisher } from '@/core/domain/queue/domain-job-publisher.interface'
import { JOBS, QUEUES } from '@/core/domain/queue/queue.constants'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { MarketAssetRepository } from '../../domain/market-asset.repository'
import { UpdateMarketPriceJobData } from '../jobs/update-price-job.dto'

/**
 * Delay between requests per provider (in ms).
 * - Polygon.io / Alpha Vantage (VARIABLE_US): 18s spacing ensures max ~3.3 req/min (well under the 5 req/min ceiling).
 * - Brapi (VARIABLE_BR / FII): has rate limits, 8s spacing as safety margin.
 * - CoinGecko (CRYPTO): free tier ~100 req/min, 20s spacing as safety margin.
 * - FIXED: no external API call, no delay needed.
 */
const PROVIDER_DELAY_MS: Record<CategoryType, number> = {
  [CategoryType.VARIABLE_US]: 18_000,
  [CategoryType.VARIABLE_BR]: 8_000,
  [CategoryType.FII]: 8_000,
  [CategoryType.CRYPTO]: 20_000,
  [CategoryType.FIXED]: 0
}

/**
 * Atualiza diariamente a cotação do catálogo de ativos de mercado: um job por
 * ticker + tipo, independente de quantos usuários (ativos ou wishlist) o usam.
 */
@Injectable()
export class UpdateMarketPricesCron {
  private readonly logger = new Logger(UpdateMarketPricesCron.name)
  private isRunning = false

  constructor(
    private readonly jobPublisher: DomainJobPublisher,
    private readonly marketAssetRepository: MarketAssetRepository
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_7PM, {
    timeZone: 'America/Sao_Paulo'
  })
  async handleCron(): Promise<void> {
    if (this.isRunning) {
      this.logger.log('Daily market price update cron job is already running.')
      return
    }

    this.isRunning = true

    try {
      const marketAssets = await this.marketAssetRepository.findAllInUse()

      this.logger.log(
        `Enqueuing price update for ${marketAssets.length} market assets in use.`
      )

      const providerIndex: Partial<Record<CategoryType, number>> = {}

      await this.jobPublisher.publishBulk(
        QUEUES.ASSET_PROCESSING,
        marketAssets.map((marketAsset) => {
          const index = providerIndex[marketAsset.type] ?? 0
          providerIndex[marketAsset.type] = index + 1
          const delay = index * (PROVIDER_DELAY_MS[marketAsset.type] ?? 0)

          const data: UpdateMarketPriceJobData = {
            marketAssetId: marketAsset.id,
            ticker: marketAsset.ticker
          }

          return {
            name: JOBS.ASSET.UPDATE_PRICE,
            data,
            ...(delay > 0 && { opts: { delay } })
          }
        })
      )

      this.logger.log('All market assets enqueued for price update.')
    } finally {
      this.isRunning = false
    }
  }
}
