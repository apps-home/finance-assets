import type { SortOrder } from '@/core/utils/sort-by-month-change'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

export type WishlistTargetStatus =
  | 'BELOW_OR_AT_TARGET'
  | 'ABOVE_TARGET'
  | 'NO_TARGET'

export interface FindAllWishlistParams {
  userId: string
  categoryId?: string
  search?: string
  type?: CategoryType
  targetStatus?: WishlistTargetStatus
  sort?: 'monthChange'
  order?: SortOrder
}
