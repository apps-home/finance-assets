import { Injectable, Logger } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { MarketAsset } from '../../domain/market-asset.entity'
import { RefreshMarketAssetQuoteUseCase } from './refresh-market-asset-quote'
import { ResolveMarketAssetUseCase } from './resolve-market-asset'

interface ResolveMarketAssetWithQuotePayload {
  ticker: string
  type: CategoryType
  name: string
}

type ResolveMarketAssetWithQuoteResponse = Either<never, MarketAsset | null>

/**
 * Como `ResolveMarketAssetUseCase`, mas já devolve a cotação: busca na hora
 * quando o catálogo não tem uma recente. Falha do provider não impede o
 * cadastro; o item fica sem preço até o próximo cron.
 */
@Injectable()
export class ResolveMarketAssetWithQuoteUseCase {
  private readonly logger = new Logger(ResolveMarketAssetWithQuoteUseCase.name)

  constructor(
    private readonly resolveMarketAsset: ResolveMarketAssetUseCase,
    private readonly refreshMarketAssetQuote: RefreshMarketAssetQuoteUseCase
  ) {}

  async execute(
    payload: ResolveMarketAssetWithQuotePayload
  ): Promise<ResolveMarketAssetWithQuoteResponse> {
    const { value: marketAsset } =
      await this.resolveMarketAsset.execute(payload)

    if (!marketAsset || marketAsset.hasFreshQuote()) {
      return right(marketAsset)
    }

    try {
      const refreshed = await this.refreshMarketAssetQuote.execute(
        marketAsset.id
      )

      return right(refreshed.isRight() ? refreshed.value : marketAsset)
    } catch (error) {
      this.logger.warn(
        `Failed to fetch initial quote for ticker "${marketAsset.ticker}": ${
          error instanceof Error ? error.message : error
        }`
      )

      return right(marketAsset)
    }
  }
}
