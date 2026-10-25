import { CategorySummary } from '@/modules/assets/categories/domain/category.entity'

import { Dividend, DividendProps } from './dividend.entity'
import { DividendAssetSummary, DividendWithAsset } from './dividend.repository'

export interface DividendWithAssetHTTPResponse {
  dividend: DividendProps & { amountInBRL: number }
  asset: DividendAssetSummary
  category: CategorySummary
}

export class DividendMapper {
  static toHTTP(dividend: Dividend): DividendProps & { amountInBRL: number } {
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
      updatedAt: dividend.updatedAt,
      amountInBRL: dividend.amountInBRL
    }
  }

  static toHTTPWithAsset(
    item: DividendWithAsset
  ): DividendWithAssetHTTPResponse {
    return {
      dividend: DividendMapper.toHTTP(item.dividend),
      asset: item.asset,
      category: item.category
    }
  }
}
