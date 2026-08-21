import { CategoryType } from '../category.entity'

export interface FindAllCategoriesParams {
  name?: string
  type?: CategoryType
  currency?: string
  userId: string
  year?: number
}
