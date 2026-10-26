import { CategorySummary } from '@/modules/assets/categories/domain/category.entity'

import { Asset } from './asset.entity'
import { FindAssetsParams } from './dto/find-assets-params.dto'

export interface AssetWithCategory {
  asset: Asset
  category: CategorySummary
}

export interface AssetWithUserDetails extends AssetWithCategory {
  user: {
    id: string
    name: string
    email: string
  }
}

export abstract class AssetRepository {
  abstract list(params: FindAssetsParams): Promise<AssetWithCategory[]>
  abstract save(asset: Asset): Promise<void>
  abstract findById(id: string, userId: string): Promise<Asset | null>
  abstract findByIdForSystem(id: string): Promise<Asset | null>
  abstract delete(id: string): Promise<void>
  abstract markDividendsImported(assetIds: string[], at: Date): Promise<void>
  abstract findAllActiveWithUserDetails(): Promise<AssetWithUserDetails[]>
}
