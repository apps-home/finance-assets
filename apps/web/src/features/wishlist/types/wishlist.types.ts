import type { CategoryType } from '@/features/categories/api/types'

export interface WishlistItem {
  id: string
  userId: string
  categoryId: string
  name: string
  ticker: string
  targetPrice: number | null
  currentClosePrice: number | null
  lastMonthClosePrice: number | null
  notes: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

export interface WishlistCategorySummary {
  id: string
  name: string
  type: CategoryType
  currency: string
}

export interface WishlistWithCategory {
  wishlist: WishlistItem
  category: WishlistCategorySummary
}

export interface CreateWishlistDTO {
  categoryId: string
  name: string
  ticker: string
  targetPrice?: number | null
  notes?: string | null
}

export interface UpdateWishlistDTO {
  name?: string
  ticker?: string
  targetPrice?: number | null
  notes?: string | null
}

export interface WishlistSearchParams {
  categoryId?: string
  ticker?: string
  name?: string
}

export type TargetPriceStatus =
  | 'BELOW_OR_AT_TARGET'
  | 'ABOVE_TARGET'
  | 'NO_TARGET'
