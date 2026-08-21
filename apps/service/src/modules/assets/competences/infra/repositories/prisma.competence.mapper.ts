import { AssetCategoryCompetence } from '@lib/db'
import { Competence } from '../../domain/competence.entity'

export class PrismaCompetenceMapper {
  static toDomain(raw: AssetCategoryCompetence): Competence {
    return Competence.create({
      id: raw.id,
      categoryId: raw.categoryId,
      year: raw.year
    })
  }

  static toPrisma(competence: Competence) {
    return {
      id: competence.id,
      categoryId: competence.categoryId,
      year: competence.year
    }
  }
}
