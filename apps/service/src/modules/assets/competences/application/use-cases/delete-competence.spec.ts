import { beforeEach, describe, expect, it } from 'vitest'

import { Competence } from '../../domain/competence.entity'
import { CompetenceRepository } from '../../domain/competence.repository'
import { CompetenceNotFoundError } from '../errors/competence-not-found.error'
import { DeleteCompetenceUseCase } from './delete-competence'

class FakeCompetenceRepository extends CompetenceRepository {
  public items: { competence: Competence; userId: string }[] = []

  async findByCategory(): Promise<Competence[]> {
    return []
  }

  async findAvailableYears(): Promise<number[]> {
    return []
  }

  async findById(id: string, userId: string): Promise<Competence | null> {
    return (
      this.items.find(
        (item) => item.competence.id === id && item.userId === userId
      )?.competence ?? null
    )
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.competence.id !== id)
  }
}

describe('DeleteCompetenceUseCase', () => {
  let repository: FakeCompetenceRepository
  let sut: DeleteCompetenceUseCase
  let competenceId: string

  beforeEach(() => {
    repository = new FakeCompetenceRepository()
    sut = new DeleteCompetenceUseCase(repository)

    const competence = Competence.create({
      categoryId: 'category-1',
      year: 2025
    })
    repository.items.push({ competence, userId: 'user-1' })
    competenceId = competence.id
  })

  it('should delete a competence that belongs to the user', async () => {
    const result = await sut.execute('user-1', competenceId)

    expect(result.isRight()).toBe(true)
    expect(repository.items).toHaveLength(0)
  })

  it('should not delete a competence that belongs to another user', async () => {
    const result = await sut.execute('user-2', competenceId)

    expect(result.value).toBeInstanceOf(CompetenceNotFoundError)
    expect(repository.items).toHaveLength(1)
  })

  it('should return not found for an unknown competence', async () => {
    const result = await sut.execute('user-1', 'unknown')

    expect(result.value).toBeInstanceOf(CompetenceNotFoundError)
  })
})
