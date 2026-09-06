import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { Asset } from './asset.entity'
import { FindAllAssetsParams } from './dto/find-all-assets-params.dto'

export interface AssetWithCategoryType {
  asset: Asset
  categoryType: CategoryType
}

export interface AssetWithUserDetails {
  asset: Asset
  category: {
    id: string
    name: string
    type: CategoryType
    currency: string
  }
  user: {
    id: string
    name: string
    email: string
  }
}

export abstract class AssetRepository {
  abstract list(params: FindAllAssetsParams): Promise<Asset[]>
  abstract save(asset: Asset): Promise<void>
  abstract findById(id: string): Promise<Asset | null>
  abstract delete(id: string): Promise<void>
  abstract findAllWithTicker(): Promise<AssetWithCategoryType[]>
  abstract findAllActiveWithUserDetails(): Promise<AssetWithUserDetails[]>
}
