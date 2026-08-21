import { Competence, CompetenceProps } from './competence.entity'

export interface CompetenceDomainDTO {
  categoryId: string
  year: number
}

export class CompetenceMapper {
  static toDomain(raw: CompetenceDomainDTO): Competence {
    return Competence.create({
      categoryId: raw.categoryId,
      year: raw.year
    })
  }

  static toHTTP(competence: Competence): CompetenceProps {
    return {
      id: competence.id,
      categoryId: competence.categoryId,
      year: competence.year
    }
  }
}
