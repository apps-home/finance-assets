import { Category, CategoryProps, CategoryType } from './category.entity'

export interface CategoryDomainDTO {
  name: string
  type?: CategoryType
  targetPercentage?: number | null
  currency: string
  userId: string
  years: number[]
}

export class CategoryMapper {
  static toDomain(raw: CategoryDomainDTO): Category {
    return Category.create({
      name: raw.name,
      type: raw.type,
      targetPercentage: raw.targetPercentage,
      currency: raw.currency,
      userId: raw.userId,
      years: raw.years
    })
  }

  static toHTTP(category: Category): CategoryProps {
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      targetPercentage: category.targetPercentage,
      currency: category.currency,
      userId: category.userId,
      years: category.years,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }
  }
}
