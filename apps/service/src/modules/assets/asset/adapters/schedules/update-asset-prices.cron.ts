import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { DomainJobPublisher } from '@/core/domain/queue/domain-job-publisher.interface'
import { JOBS, QUEUES } from '@/core/domain/queue/queue.constants'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'
import { WishlistRepository } from '@/modules/assets/wishlist/domain/wishlist.repository'

import { FindAllWithTickerAssetsUseCase } from '../../application/use-cases/find-all-with-ticker-assets'

/**
 * Delay between requests per provider (in ms).
 * - Polygon.io / Alpha Vantage (VARIABLE_US): 18s spacing ensures max ~3.3 req/min (well under the 5 req/min ceiling).
 * - Brapi (VARIABLE_BR): has rate limits, 8s spacing as safety margin.
 * - CoinGecko (CRYPTO): free tier ~100 req/min, 20s spacing as safety margin.
 * - FIXED: no external API call, no delay needed.
 */
const PROVIDER_DELAY_MS: Record<CategoryType, number> = {
  [CategoryType.VARIABLE_US]: 18_000,
  [CategoryType.VARIABLE_BR]: 8_000,
  [CategoryType.CRYPTO]: 20_000,
  [CategoryType.FIXED]: 0
}

interface ConsolidatedTickerTarget {
  ticker: string
  categoryType: CategoryType
  assetIds: string[]
  wishlistIds: string[]
}

@Injectable()
export class UpdateAssetPricesCron {
  private readonly logger = new Logger(UpdateAssetPricesCron.name)
  private isRunning = false

  constructor(
    private readonly jobPublisher: DomainJobPublisher,
    private readonly findAllWithTickerUseCase: FindAllWithTickerAssetsUseCase,
    private readonly wishlistRepository: WishlistRepository
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
    this.logger.log(
      'Starting daily asset and wishlist price update cron job...'
    )

    const assetsResult = await this.findAllWithTickerUseCase.execute()
    const assets = assetsResult.isRight() ? assetsResult.value : []

    let wishlists: Awaited<
      ReturnType<WishlistRepository['findAllWithTicker']>
    > = []
    try {
      wishlists = await this.wishlistRepository.findAllWithTicker()
    } catch (wishlistError) {
      this.logger.warn(
        `Failed to fetch wishlist items for price update: ${
          wishlistError instanceof Error ? wishlistError.message : wishlistError
        }`
      )
    }

    // Consolidate and deduplicate tickers across portfolio assets and wishlist
    const tickerMap = new Map<string, ConsolidatedTickerTarget>()

    for (const item of assets) {
      const rawTicker = item.asset.ticker
      if (!rawTicker) continue

      const ticker = rawTicker.trim().toUpperCase()
      const categoryType = item.categoryType
      const key = `${ticker}_${categoryType}`

      if (!tickerMap.has(key)) {
        tickerMap.set(key, {
          ticker,
          categoryType,
          assetIds: [],
          wishlistIds: []
        })
      }

      tickerMap.get(key)!.assetIds.push(item.asset.id)
    }

    for (const item of wishlists) {
      const rawTicker = item.wishlist.ticker
      if (!rawTicker) continue

      const ticker = rawTicker.trim().toUpperCase()
      const categoryType = item.categoryType
      const key = `${ticker}_${categoryType}`

      if (!tickerMap.has(key)) {
        tickerMap.set(key, {
          ticker,
          categoryType,
          assetIds: [],
          wishlistIds: []
        })
      }

      tickerMap.get(key)!.wishlistIds.push(item.wishlist.id)
    }

    const uniqueTargets = Array.from(tickerMap.values())

    this.logger.log(
      `Deduplicated ${assets.length} portfolio assets and ${wishlists.length} wishlist items into ${uniqueTargets.length} unique external API calls.`
    )

    const providerIndex: Record<string, number> = {}

    await this.jobPublisher.publishBulk(
      QUEUES.ASSET_PROCESSING,
      uniqueTargets.map((target) => {
        const categoryType = target.categoryType
        const delayPerRequest = PROVIDER_DELAY_MS[categoryType] ?? 0

        if (!providerIndex[categoryType]) {
          providerIndex[categoryType] = 0
        }

        const index = providerIndex[categoryType]++
        const delay = index * delayPerRequest

        return {
          name: JOBS.ASSET.UPDATE_PRICE,
          data: {
            ticker: target.ticker,
            categoryType,
            assetIds: target.assetIds,
            wishlistIds: target.wishlistIds
          },
          ...(delay > 0 && { opts: { delay } })
        }
      })
    )

    this.logger.log('All unique tickers enqueued for price update.')
    this.isRunning = false
  }
}
