import { describe, expect, it } from 'vitest'

import { CompetenceRepository } from '../../domain/competence.repository'
import { FindAvailableYearsUseCase } from './find-available-years'

describe('FindAvailableYearsUseCase', () => {
  it('should return the years available for the user', async () => {
    const repository = {
      findAvailableYears: async (userId: string) =>
        userId === 'user-1' ? [2024, 2025] : []
    } as CompetenceRepository
    const sut = new FindAvailableYearsUseCase(repository)

    const result = await sut.execute('user-1')

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual([2024, 2025])
  })

  it('should return an empty list when the user has no competences', async () => {
    const repository = {
      findAvailableYears: async () => []
    } as unknown as CompetenceRepository
    const sut = new FindAvailableYearsUseCase(repository)

    const result = await sut.execute('user-2')

    expect(result.value).toEqual([])
  })
})
