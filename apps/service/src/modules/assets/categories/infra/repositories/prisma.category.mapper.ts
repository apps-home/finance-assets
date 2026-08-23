import {
  AssetCategoryCompetence,
  AssetCategory as PrismaAssetCategory
} from '@lib/db'

import { Category, CategoryType } from '../../domain/category.entity'

type CategoryWithCompetences = PrismaAssetCategory & {
  competences: AssetCategoryCompetence[]
}

export class PrismaCategoryMapper {
  static toDomain(raw: CategoryWithCompetences): Category {
    return Category.create({
      id: raw.id,
      name: raw.name,
      type: raw.type as CategoryType,
      targetPercentage: raw.targetPercentage
        ? Number(raw.targetPercentage)
        : null,
      currency: raw.currency,
      userId: raw.userId,
      years: raw.competences.map((c) => c.year).sort((a, b) => a - b),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }

  static toPrisma(category: Category) {
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      targetPercentage: category.targetPercentage,
      currency: category.currency,
      userId: category.userId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      competences: {
        connectOrCreate: category.years.map((year) => ({
          where: {
            categoryId_year: {
              categoryId: category.id,
              year
            }
          },
          create: { year }
        }))
      }
    }
  }
}
