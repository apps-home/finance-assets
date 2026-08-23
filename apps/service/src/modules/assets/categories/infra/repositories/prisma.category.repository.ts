import { FinanceAssets } from '@lib/db'
import { Inject, Injectable } from '@nestjs/common'

import { Category } from '../../domain/category.entity'
import { CategoryRepository } from '../../domain/category.repository'
import { FindAllCategoriesParams } from '../../domain/dto/find-all-categories-params.dto'
import { PrismaCategoryMapper } from './prisma.category.mapper'

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(@Inject('prismaFinanceAssets') private prisma: FinanceAssets) {}

  async list(params: FindAllCategoriesParams): Promise<Category[]> {
    const { userId, currency, name, year, type } = params

    const categories = await this.prisma.assetCategory.findMany({
      where: {
        ...(userId && { userId }),
        ...(type && { type }),
        ...(currency && { currency }),
        ...(name && { name: { contains: name } }),
        ...(year && { competences: { some: { year } } })
      },
      include: { competences: true },
      orderBy: { name: 'asc' }
    })

    return categories.map(PrismaCategoryMapper.toDomain)
  }

  async findById(id: string): Promise<Category | null> {
    const category = await this.prisma.assetCategory.findUnique({
      where: { id },
      include: { competences: true }
    })

    if (!category) return null

    return PrismaCategoryMapper.toDomain(category)
  }

  async save(category: Category): Promise<void> {
    const data = PrismaCategoryMapper.toPrisma(category)

    await this.prisma.assetCategory.upsert({
      where: { id: category.id },
      create: data,
      update: {
        name: category.name,
        type: category.type,
        currency: category.currency,
        updatedAt: category.updatedAt,
        competences: {
          deleteMany: {
            year: { notIn: category.years }
          },
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
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetCategory.delete({
      where: { id }
    })
  }
}
