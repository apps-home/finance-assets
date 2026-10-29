import type { FinanceAssets } from '@lib/finance-assets-db'
import { Inject, Injectable } from '@nestjs/common'

import { Competence } from '../../domain/competence.entity'
import { CompetenceRepository } from '../../domain/competence.repository'
import { PrismaCompetenceMapper } from './prisma.competence.mapper'

@Injectable()
export class PrismaCompetenceRepository implements CompetenceRepository {
  constructor(@Inject('prismaFinanceAssets') private prisma: FinanceAssets) {}

  async findByCategory(
    categoryId: string,
    userId: string
  ): Promise<Competence[]> {
    const competences = await this.prisma.assetCategoryCompetence.findMany({
      where: {
        categoryId,
        category: { userId }
      },
      orderBy: { year: 'asc' }
    })

    return competences.map(PrismaCompetenceMapper.toDomain)
  }

  async findById(id: string, userId: string): Promise<Competence | null> {
    const competence = await this.prisma.assetCategoryCompetence.findFirst({
      where: { id, category: { userId } }
    })

    if (!competence) return null

    return PrismaCompetenceMapper.toDomain(competence)
  }

  async findAvailableYears(userId: string): Promise<number[]> {
    const competences = await this.prisma.assetCategoryCompetence.findMany({
      where: {
        category: { userId }
      },
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' }
    })

    return competences.map((c) => c.year)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetCategoryCompetence.delete({
      where: { id }
    })
  }
}
