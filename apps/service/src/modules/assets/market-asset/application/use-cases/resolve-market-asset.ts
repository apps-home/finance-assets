import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { MarketAsset } from '../../domain/market-asset.entity'
import { MarketAssetRepository } from '../../domain/market-asset.repository'

interface ResolveMarketAssetPayload {
  ticker: string
  type: CategoryType
  name: string
}

type ResolveMarketAssetResponse = Either<never, MarketAsset | null>

/**
 * Encontra (ou cria) no catálogo o ativo de mercado de um ticker + tipo, para
 * um ativo ou item da wishlist apontar para ele. Tipos sem cotação de mercado
 * (renda fixa) ou sem ticker não entram no catálogo: devolve `null`.
 */
@Injectable()
export class ResolveMarketAssetUseCase {
  constructor(private readonly marketAssetRepository: MarketAssetRepository) {}

  async execute({
    ticker,
    type,
    name
  }: ResolveMarketAssetPayload): Promise<ResolveMarketAssetResponse> {
    if (!MarketAsset.isQuoted(type, ticker)) {
      return right(null)
    }

    const marketAsset = await this.marketAssetRepository.findOrCreate(
      MarketAsset.create({ ticker, type, name })
    )

    return right(marketAsset)
  }
}
