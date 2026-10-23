import type {
  CategorySummary,
  CategoryType
} from '@/features/categories/api/types'

export interface Asset {
  id: string
  categoryId: string
  name: string
  ticker: string
  quantity: number | null
  averagePrice: number | null
  broker: string | null
  isActive: boolean
  currentClosePrice: number | null
  lastMonthClosePrice: number | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateAssetDTO {
  categoryId: string
  name: string
  ticker?: string | null
  quantity?: number | null
  averagePrice?: number | null
  broker?: string | null
  isActive?: boolean
  currentClosePrice?: number | null
}

export type UpdateAssetDTO = Partial<Omit<CreateAssetDTO, 'categoryId'>>

export interface AssetHTTPResponse extends Asset {
  investedValue: number | null
  currentBalance: number | null
  profitLoss: number | null
  profitabilityPercentage: number | null
}

export interface AssetWithCategory extends AssetHTTPResponse {
  category: CategorySummary
}

export interface ListAssetsParams {
  search?: string
  categoryId?: string
  type?: CategoryType
  status?: 'ACTIVE' | 'INACTIVE'
  sort?: 'monthChange'
  order?: 'asc' | 'desc'
}
