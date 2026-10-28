import { Injectable, Logger } from '@nestjs/common'

import { DomainEventPublisher } from '@/core/domain/events/domain-event-publisher.interface'
import {
  MarketAssetEvent,
  MarketAssetQuoteUpdatedPayload
} from '@/core/domain/events/market-asset.event'
import { MarketDataGateway } from '@/core/http/external/market-data/market-data.gateway'
import { Either, left, right } from '@/core/utils/Either'

import {
  MarketAsset,
  QUOTE_FRESHNESS_MS
} from '../../domain/market-asset.entity'
import { MarketAssetRepository } from '../../domain/market-asset.repository'
import { MarketAssetNotFoundError } from '../errors/market-asset-not-found.error'

interface RefreshMarketAssetQuoteOptions {
  /** Busca mesmo com cotação recente (cron diário) */
  force?: boolean
  /** Cotação mais nova que isso é reaproveitada (padrão: 12h) */
  freshnessMs?: number
}

type RefreshMarketAssetQuoteResponse = Either<
  MarketAssetNotFoundError,
  MarketAsset
>

/**
 * Busca a cotação de um ativo do catálogo no provider do seu tipo. Uma única
 * chamada externa atualiza o preço de todos os usuários que têm o ticker.
 * Cotação nova gravada publica `market-asset.quote-updated` (alertas de preço).
 */
@Injectable()
export class RefreshMarketAssetQuoteUseCase {
  private readonly logger = new Logger(RefreshMarketAssetQuoteUseCase.name)

  constructor(
    private readonly marketAssetRepository: MarketAssetRepository,
    private readonly marketDataGateway: MarketDataGateway,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  async execute(
    id: string,
    {
      force = false,
      freshnessMs = QUOTE_FRESHNESS_MS
    }: RefreshMarketAssetQuoteOptions = {}
  ): Promise<RefreshMarketAssetQuoteResponse> {
    const marketAsset = await this.marketAssetRepository.findById(id)

    if (!marketAsset) {
      return left(new MarketAssetNotFoundError())
    }

    if (!force && marketAsset.hasFreshQuote(new Date(), freshnessMs)) {
      return right(marketAsset)
    }

    const provider = this.marketDataGateway.getProvider(marketAsset.type)

    if (!provider) {
      this.logger.debug(
        `No market data provider for type ${marketAsset.type}. Skipping.`
      )
      return right(marketAsset)
    }

    const quote = await provider.fetchQuote(marketAsset.ticker)

    if (!quote) {
      this.logger.warn(
        `Could not fetch quote for ticker: ${marketAsset.ticker}. Price will not be updated.`
      )
      return right(marketAsset)
    }

    const updatedAt = new Date()
    marketAsset.updateQuote(quote.currentPrice, quote.lastMonthPrice, updatedAt)

    await this.marketAssetRepository.save(marketAsset)

    this.eventPublisher.publish(
      MarketAssetEvent.QUOTE_UPDATED,
      new MarketAssetQuoteUpdatedPayload(
        marketAsset.id,
        quote.currentPrice,
        updatedAt
      )
    )

    this.logger.log(
      `Market asset "${marketAsset.ticker}" updated — current: ${quote.currentPrice}, lastMonth: ${quote.lastMonthPrice}`
    )

    return right(marketAsset)
  }
}
