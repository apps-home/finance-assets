import { Asset as PrismaAsset } from '@lib/db'

import { Asset } from '../../domain/asset.entity'

export class PrismaAssetMapper {
  static toDomain(raw: PrismaAsset): Asset {
    return Asset.create({
      id: raw.id,
      categoryId: raw.categoryId,
      name: raw.name,
      ticker: raw.ticker,
      quantity: raw.quantity ? Number(raw.quantity) : null,
      averagePrice: raw.averagePrice ? Number(raw.averagePrice) : null,
      broker: raw.broker ?? null,
      isActive: raw.isActive,
      currentClosePrice: raw.currentClosePrice
        ? Number(raw.currentClosePrice)
        : null,
      lastMonthClosePrice: raw.lastMonthClosePrice
        ? Number(raw.lastMonthClosePrice)
        : null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }

  static toPrisma(asset: Asset) {
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
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt
    }
  }
}
