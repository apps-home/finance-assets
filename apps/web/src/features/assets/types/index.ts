import type {
  Asset,
  AssetHTTPResponse,
  CreateAssetDTO,
  UpdateAssetDTO
} from '@/features/assets/api/types'
import type { Category } from '@/features/categories/api/types'

export type { Asset, AssetHTTPResponse, CreateAssetDTO, UpdateAssetDTO }

export interface AssetWithCategory extends AssetHTTPResponse {
  category: Category
}

export interface AssetFiltersState {
  search: string
  categoryId: string
  categoryType: string
  status: 'ALL' | 'ACTIVE' | 'INACTIVE'
  viewMode: 'table' | 'cards'
}
