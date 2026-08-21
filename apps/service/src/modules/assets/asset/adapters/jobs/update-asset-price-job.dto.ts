import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

export interface UpdateAssetPriceJobData {
  assetId: string
  ticker: string
  categoryType: CategoryType
}

export type AssetPriceQueueJobData = UpdateAssetPriceJobData
