import { CategoryType } from '../category.entity'

export class CreateCategoryPayload {
  name: string
  type?: CategoryType
  targetPercentage?: number | null
  currency: string
  userId: string
  years: number[]
}
