import { describe, expect, it } from 'vitest'

import { Competence } from '../../domain/competence.entity'
import { CompetenceRepository } from '../../domain/competence.repository'
import { FindCompetencesByCategoryUseCase } from './find-competences-by-category'

describe('FindCompetencesByCategoryUseCase', () => {
  it('should return the competences of the category as plain objects', async () => {
    const competence = Competence.create({
      categoryId: 'category-1',
      year: 2025
    })
    const repository = {
      findByCategory: async (categoryId: string, userId: string) =>
        categoryId === 'category-1' && userId === 'user-1' ? [competence] : []
    } as unknown as CompetenceRepository
    const sut = new FindCompetencesByCategoryUseCase(repository)

    const result = await sut.execute('category-1', 'user-1')

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual([
      { id: competence.id, categoryId: 'category-1', year: 2025 }
    ])
  })

  it('should return an empty list for a category of another user', async () => {
    const repository = {
      findByCategory: async () => []
    } as unknown as CompetenceRepository
    const sut = new FindCompetencesByCategoryUseCase(repository)

    const result = await sut.execute('category-1', 'user-2')

    expect(result.value).toEqual([])
  })
})
