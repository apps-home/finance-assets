import { Competence } from './competence.entity'

export abstract class CompetenceRepository {
  abstract findByCategory(
    categoryId: string,
    userId: string
  ): Promise<Competence[]>
  abstract findAvailableYears(userId: string): Promise<number[]>
  abstract save(competence: Competence): Promise<void>
  abstract delete(id: string): Promise<void>
  abstract findByCategoryAndYear(
    categoryId: string,
    year: number
  ): Promise<Competence | null>
}
