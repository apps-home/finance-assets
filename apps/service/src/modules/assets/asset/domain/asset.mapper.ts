import { Asset, AssetProps } from './asset.entity'
import type { FixedIncomeIndexer } from './fixed-income-valuation'

export interface AssetDomainDTO {
  name: string
  ticker?: string
  quantity?: number | null
  averagePrice?: number | null
  broker?: string | null
  isActive?: boolean
  currentClosePrice?: number | null
  indexer?: FixedIncomeIndexer | null
  indexerRate?: number | null
  investedAt?: Date | null
  maturityAt?: Date | null
  categoryId: string
}

export interface AssetHTTPResponse extends AssetProps {
  investedValue: number | null
  currentBalance: number | null
  profitLoss: number | null
  profitabilityPercentage: number | null
}

export class AssetMapper {
  static toDomain(raw: AssetDomainDTO): Asset {
    return Asset.create({
      name: raw.name,
      ticker: raw.ticker || '',
      quantity: raw.quantity ?? null,
      averagePrice: raw.averagePrice ?? null,
      broker: raw.broker ?? null,
      isActive: raw.isActive ?? true,
      currentClosePrice: raw.currentClosePrice ?? null,
      indexer: raw.indexer ?? null,
      indexerRate: raw.indexerRate ?? null,
      investedAt: raw.investedAt ?? null,
      maturityAt: raw.maturityAt ?? null,
      categoryId: raw.categoryId
    })
  }

  static toHTTP(asset: Asset): AssetHTTPResponse {
    const quantity = asset.quantity
    const averagePrice = asset.averagePrice
    const currentClosePrice = asset.currentClosePrice ?? averagePrice

    const canComputeInvested = quantity !== null && averagePrice !== null
    const canComputeBalance = quantity !== null && currentClosePrice !== null

    const investedValue = canComputeInvested ? quantity * averagePrice : null
    const currentBalance = canComputeBalance
      ? quantity * currentClosePrice
      : null
    const profitLoss =
      investedValue !== null && currentBalance !== null
        ? currentBalance - investedValue
        : null
    const profitabilityPercentage =
      averagePrice !== null && currentClosePrice !== null && averagePrice !== 0
        ? (currentClosePrice / averagePrice - 1) * 100
        : null

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
      currentClosePrice: asset.currentClosePrice ?? currentClosePrice,
      lastMonthClosePrice: asset.lastMonthClosePrice,
      dividendsImportedAt: asset.dividendsImportedAt,
      indexer: asset.indexer,
      indexerRate: asset.indexerRate,
      investedAt: asset.investedAt,
      maturityAt: asset.maturityAt,
      hasTransactions: asset.hasTransactions,
      investedValue,
      currentBalance,
      profitLoss,
      profitabilityPercentage,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt
    }
  }
}
