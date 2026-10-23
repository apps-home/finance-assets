import type { SortOrder } from '@/core/utils/sort-by-month-change'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

export interface FindAssetsParams {
  userId: string
  search?: string
  categoryId?: string
  type?: CategoryType
  status?: 'ACTIVE' | 'INACTIVE'
  sort?: 'monthChange'
  order?: SortOrder
}
