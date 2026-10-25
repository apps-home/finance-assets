import type { AssetDividend as PrismaAssetDividend } from '@lib/db'

import {
  Dividend,
  DividendSource,
  DividendType
} from '../../domain/dividend.entity'

export class PrismaDividendMapper {
  static toDomain(raw: PrismaAssetDividend): Dividend {
    return Dividend.create({
      id: raw.id,
      userId: raw.userId,
      assetId: raw.assetId,
      type: raw.type as DividendType,
      source: raw.source as DividendSource,
      amount: Number(raw.amount),
      rateAmount: raw.rateAmount !== null ? Number(raw.rateAmount) : null,
      quantity: raw.quantity !== null ? Number(raw.quantity) : null,
      exchangeRate: raw.exchangeRate !== null ? Number(raw.exchangeRate) : null,
      comDate: raw.comDate,
      paymentDate: raw.paymentDate,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }

  static toPrisma(dividend: Dividend) {
    return {
      id: dividend.id,
      userId: dividend.userId,
      assetId: dividend.assetId,
      type: dividend.type,
      source: dividend.source,
      amount: dividend.amount,
      rateAmount: dividend.rateAmount,
      quantity: dividend.quantity,
      exchangeRate: dividend.exchangeRate,
      comDate: dividend.comDate,
      paymentDate: dividend.paymentDate,
      createdAt: dividend.createdAt,
      updatedAt: dividend.updatedAt
    }
  }
}
