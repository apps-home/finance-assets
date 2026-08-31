import type {
  Asset,
  AssetHTTPResponse,
  CreateAssetDTO,
  UpdateAssetDTO
} from '@/features/assets/api/types'
import { Category, CategoryType } from '@/features/categories/api/types'

export type { Asset, AssetHTTPResponse, CreateAssetDTO, UpdateAssetDTO }
export { CategoryType }

export interface AssetWithCategory extends AssetHTTPResponse {
  category: Category
}

export interface AssetFiltersState {
  search: string
  categoryId: string
  categoryType: CategoryType | 'ALL'
  status: 'ALL' | 'ACTIVE' | 'INACTIVE'
  viewMode: 'table' | 'cards'
}
