import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

export interface UpdateAssetPriceJobData {
  ticker: string
  categoryType: CategoryType
  assetId?: string
  assetIds?: string[]
  wishlistIds?: string[]
}

export type AssetPriceQueueJobData = UpdateAssetPriceJobData
