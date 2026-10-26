import { describe, expect, it } from 'vitest'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { defaultTaxAmount } from './dividend-tax'

describe('defaultTaxAmount', () => {
  it('should withhold 30% of US stock dividends', () => {
    expect(defaultTaxAmount(CategoryType.VARIABLE_US, 1.19)).toBe(0.36)
  })

  it.each([CategoryType.VARIABLE_BR, CategoryType.FII, CategoryType.CRYPTO])(
    'should not assume any tax for %s',
    (type) => {
      expect(defaultTaxAmount(type, 100)).toBeNull()
    }
  )

  it('should skip amounts so small that the tax rounds to zero', () => {
    expect(defaultTaxAmount(CategoryType.VARIABLE_US, 0.01)).toBeNull()
  })
})
