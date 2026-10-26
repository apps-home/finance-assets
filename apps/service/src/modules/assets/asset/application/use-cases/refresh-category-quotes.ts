import { Injectable, Logger } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'
import { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'
import { RefreshMarketAssetQuoteUseCase } from '@/modules/assets/market-asset/application/use-cases/refresh-market-asset-quote'
import { MANUAL_REFRESH_COOLDOWN_MS } from '@/modules/assets/market-asset/domain/market-asset.entity'

import { AssetRepository } from '../../domain/asset.repository'

export interface RefreshCategoryQuotesResult {
  /** Cotações buscadas agora */
  updated: number
  /** Já atualizadas há menos de 5 min: não houve chamada externa */
  skipped: number
  /** O provider não devolveu cotação; o preço anterior foi mantido */
  failedTickers: string[]
}

type RefreshCategoryQuotesResponse = Either<
  CategoryNotFoundError,
  RefreshCategoryQuotesResult
>

/**
 * Atualização manual das cotações de uma categoria do usuário. Busca na hora,
 * um ticker por vez, as cotações do catálogo usadas pelos ativos ativos dela.
 * O catálogo é compartilhado, então o preço novo vale para todos os usuários.
 */
@Injectable()
export class RefreshCategoryQuotesUseCase {
  private readonly logger = new Logger(RefreshCategoryQuotesUseCase.name)

  constructor(
    private assetRepository: AssetRepository,
    private categoryRepository: CategoryRepository,
    private refreshMarketAssetQuoteUseCase: RefreshMarketAssetQuoteUseCase
  ) {}

  async execute(
    userId: string,
    categoryId: string
  ): Promise<RefreshCategoryQuotesResponse> {
    const category = await this.categoryRepository.findById(categoryId, userId)

    if (!category) {
      return left(new CategoryNotFoundError())
    }

    const items = await this.assetRepository.list({
      userId,
      categoryId,
      status: 'ACTIVE'
    })

    // Dois ativos com o mesmo ticker (corretoras diferentes) usam a mesma cotação
    const tickerByMarketAssetId = new Map<string, string>()

    for (const { asset } of items) {
      if (asset.marketAssetId) {
        tickerByMarketAssetId.set(asset.marketAssetId, asset.ticker)
      }
    }

    const startedAt = new Date()
    const result: RefreshCategoryQuotesResult = {
      updated: 0,
      skipped: 0,
      failedTickers: []
    }

    for (const [marketAssetId, ticker] of tickerByMarketAssetId) {
      try {
        const refreshed = await this.refreshMarketAssetQuoteUseCase.execute(
          marketAssetId,
          { freshnessMs: MANUAL_REFRESH_COOLDOWN_MS }
        )

        if (refreshed.isLeft()) {
          result.failedTickers.push(ticker)
          continue
        }

        const marketAsset = refreshed.value

        if (
          marketAsset.priceUpdatedAt &&
          marketAsset.priceUpdatedAt >= startedAt
        ) {
          result.updated++
        } else if (
          marketAsset.hasFreshQuote(startedAt, MANUAL_REFRESH_COOLDOWN_MS)
        ) {
          result.skipped++
        } else {
          result.failedTickers.push(ticker)
        }
      } catch (error) {
        this.logger.error(
          `Failed to refresh quote for ticker "${ticker}"`,
          error instanceof Error ? error.stack : error
        )
        result.failedTickers.push(ticker)
      }
    }

    return right(result)
  }
}
