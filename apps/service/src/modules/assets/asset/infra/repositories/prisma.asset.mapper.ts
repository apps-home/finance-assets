import type {
  Asset as PrismaAsset,
  MarketAsset as PrismaMarketAsset
} from '@lib/db'

import { Asset } from '../../domain/asset.entity'
import type { FixedIncomeIndexer } from '../../domain/fixed-income-valuation'

export type PrismaAssetWithMarket = PrismaAsset & {
  marketAsset: PrismaMarketAsset | null
  _count?: { transactions: number }
}

/**
 * Sempre carregar o ativo com a cotação do catálogo e a contagem de operações
 * (com operações, quantidade e preço médio são calculados)
 */
export const WITH_MARKET_ASSET = {
  marketAsset: true,
  _count: { select: { transactions: true } }
} as const

export class PrismaAssetMapper {
  static toDomain(raw: PrismaAssetWithMarket): Asset {
    const { marketAsset } = raw
    // Com catálogo a cotação vem dele; sem, só existe o preço manual
    const currentClosePrice = marketAsset
      ? marketAsset.currentClosePrice
      : raw.currentClosePrice

    return Asset.create({
      id: raw.id,
      categoryId: raw.categoryId,
      name: raw.name,
      ticker: raw.ticker || '',
      quantity: raw.quantity ? Number(raw.quantity) : null,
      averagePrice: raw.averagePrice ? Number(raw.averagePrice) : null,
      broker: raw.broker ?? null,
      isActive: raw.isActive,
      marketAssetId: raw.marketAssetId,
      currentClosePrice:
        currentClosePrice != null ? Number(currentClosePrice) : null,
      lastMonthClosePrice:
        marketAsset?.lastMonthClosePrice != null
          ? Number(marketAsset.lastMonthClosePrice)
          : null,
      dividendsImportedAt: raw.dividendsImportedAt,
      indexer: (raw.indexer as FixedIncomeIndexer | null) ?? null,
      indexerRate: raw.indexerRate != null ? Number(raw.indexerRate) : null,
      investedAt: raw.investedAt,
      maturityAt: raw.maturityAt,
      hasTransactions: (raw._count?.transactions ?? 0) > 0,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }

  static toPrisma(asset: Asset) {
    return {
      id: asset.id,
      categoryId: asset.categoryId,
      name: asset.name,
      ticker: asset.ticker || '',
      quantity: asset.quantity,
      averagePrice: asset.averagePrice,
      broker: asset.broker,
      isActive: asset.isActive,
      marketAssetId: asset.marketAssetId,
      // A coluna guarda só o preço manual; a cotação de mercado fica no catálogo
      currentClosePrice: asset.marketAssetId ? null : asset.currentClosePrice,
      dividendsImportedAt: asset.dividendsImportedAt,
      indexer: asset.indexer,
      indexerRate: asset.indexerRate,
      investedAt: asset.investedAt,
      maturityAt: asset.maturityAt,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt
    }
  }
}
