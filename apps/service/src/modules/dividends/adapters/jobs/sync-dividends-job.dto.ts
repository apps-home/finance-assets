import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { SyncDividendTarget } from '../../application/use-cases/sync-asset-dividends'

export interface SyncDividendsJobData {
  ticker: string
  categoryType: CategoryType
  targets: SyncDividendTarget[]
}
