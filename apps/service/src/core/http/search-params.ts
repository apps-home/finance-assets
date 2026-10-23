import { SortOrder } from '../utils/sort-by-month-change'

export interface SearchParams {
  page?: number
  per_page?: number
  search?: string
  sort?: string
  order?: SortOrder
}
