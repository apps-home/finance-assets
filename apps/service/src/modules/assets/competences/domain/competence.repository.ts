import { Competence } from './competence.entity'

export abstract class CompetenceRepository {
  abstract findByCategory(
    categoryId: string,
    userId: string
  ): Promise<Competence[]>
  abstract findAvailableYears(userId: string): Promise<number[]>
  abstract findById(id: string, userId: string): Promise<Competence | null>
  abstract delete(id: string): Promise<void>
}
