import { makeCategory } from '@test/factories/make-category'
import { describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

describe('Category.update', () => {
  it('should apply only the defined fields', () => {
    const category = makeCategory({
      name: 'Ações',
      currency: 'BRL',
      targetPercentage: 30
    })

    category.update({ name: undefined, currency: undefined, years: [2025] })

    expect(category.name).toBe('Ações')
    expect(category.currency).toBe('BRL')
    expect(category.targetPercentage).toBe(30)
    expect(category.years).toEqual([2025])
  })

  it('should allow clearing the target percentage with null', () => {
    const category = makeCategory({ targetPercentage: 30 })

    category.update({ targetPercentage: null })

    expect(category.targetPercentage).toBeNull()
  })

  it('should keep the owner and bump updatedAt', () => {
    const category = makeCategory({
      userId: 'user-1',
      updatedAt: new Date('2020-01-01')
    })

    category.update({ name: 'Novo nome' })

    expect(category.userId).toBe('user-1')
    expect(category.updatedAt.getFullYear()).toBeGreaterThan(2020)
  })

  it('should reject invalid values', () => {
    const category = makeCategory()

    expect(() => category.update({ years: [] })).toThrow(PayloadError)
    expect(() => category.update({ targetPercentage: 101 })).toThrow(
      PayloadError
    )
  })
})
