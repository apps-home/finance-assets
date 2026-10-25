import { CategorySummary } from '@/modules/assets/categories/domain/category.entity'

import { Dividend, DividendType } from './dividend.entity'
import { FindAllDividendsParams } from './dto/find-all-dividends-params.dto'

export interface DividendAssetSummary {
  id: string
  name: string
  ticker: string
  quantity: number | null
  averagePrice: number | null
}

export interface DividendWithAsset {
  dividend: Dividend
  asset: DividendAssetSummary
  category: CategorySummary
}

export abstract class DividendRepository {
  abstract list(params: FindAllDividendsParams): Promise<DividendWithAsset[]>
  abstract save(dividend: Dividend): Promise<void>
  abstract findById(id: string, userId: string): Promise<Dividend | null>
  abstract findByNaturalKey(
    assetId: string,
    type: DividendType,
    paymentDate: Date
  ): Promise<Dividend | null>
  abstract delete(id: string): Promise<void>
}
