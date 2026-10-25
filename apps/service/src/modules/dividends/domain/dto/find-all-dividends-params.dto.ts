import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { DividendType } from '../dividend.entity'

export interface FindAllDividendsParams {
  userId: string
  assetId?: string
  categoryId?: string
  categoryType?: CategoryType
  type?: DividendType
  /** Inclusivo */
  from?: Date
  /** Inclusivo */
  to?: Date
}
