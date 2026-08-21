import { Asset, AssetProps } from './asset.entity'

export interface AssetDomainDTO {
  name: string
  ticker: string
  quantity?: number | null
  averagePrice?: number | null
  broker?: string | null
  isActive?: boolean
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
      ticker: raw.ticker,
      quantity: raw.quantity ?? null,
      averagePrice: raw.averagePrice ?? null,
      broker: raw.broker ?? null,
      isActive: raw.isActive ?? true,
      categoryId: raw.categoryId
    })
  }

  static toHTTP(asset: Asset): AssetHTTPResponse {
    const quantity = asset.quantity
    const averagePrice = asset.averagePrice
    const currentClosePrice = asset.currentClosePrice

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
      ticker: asset.ticker,
      quantity: asset.quantity,
      averagePrice: asset.averagePrice,
      broker: asset.broker,
      isActive: asset.isActive,
      currentClosePrice: asset.currentClosePrice,
      lastMonthClosePrice: asset.lastMonthClosePrice,
      investedValue,
      currentBalance,
      profitLoss,
      profitabilityPercentage,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt
    }
  }
}
