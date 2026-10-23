import { makeBudget } from '@test/factories/make-budget'
import { describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

describe('Budget.update', () => {
  it('should apply only the defined fields', () => {
    const budget = makeBudget({
      categoryId: 'category-1',
      amount: 500,
      dividendAmount: 20
    })

    budget.update({ dividendAmount: undefined })

    expect(budget.dividendAmount).toBe(20)

    budget.update({ dividendAmount: 35 })

    expect(budget.dividendAmount).toBe(35)
    expect(budget.amount).toBe(500)
  })

  it('should keep the identity and bump updatedAt', () => {
    const budget = makeBudget({
      categoryId: 'category-1',
      month: 3,
      year: 2025,
      updatedAt: new Date('2020-01-01')
    })

    budget.update({ dividendAmount: 10 })

    expect(budget.categoryId).toBe('category-1')
    expect(budget.month).toBe(3)
    expect(budget.year).toBe(2025)
    expect(budget.updatedAt.getFullYear()).toBeGreaterThan(2020)
  })

  it('should reject a negative dividend amount', () => {
    const budget = makeBudget({ categoryId: 'category-1' })

    expect(() => budget.update({ dividendAmount: -1 })).toThrow(PayloadError)
  })
})

describe('Budget.create', () => {
  it('should reject a month out of range, including 0', () => {
    expect(() => makeBudget({ categoryId: 'category-1', month: 0 })).toThrow(
      PayloadError
    )
    expect(() => makeBudget({ categoryId: 'category-1', month: 13 })).toThrow(
      PayloadError
    )
  })
})

describe('Budget.changeAmount', () => {
  it('should store the amount converted by the exchange rate', () => {
    const budget = makeBudget({ categoryId: 'category-1', amount: 1 })

    budget.changeAmount(1000, 5.2)

    expect(budget.amount).toBe(5200)
    expect(budget.exchangeRate).toBe(5.2)
  })

  it('should expose the original amount without converting twice', () => {
    const budget = makeBudget({ categoryId: 'category-1', amount: 1 })

    budget.changeAmount(1000, 5.2)
    budget.changeAmount(budget.originalAmount, 5.2)

    expect(budget.originalAmount).toBe(1000)
    expect(budget.amount).toBe(5200)
  })

  it('should keep the original amount when only the rate changes', () => {
    const budget = makeBudget({ categoryId: 'category-1', amount: 1 })

    budget.changeAmount(1000, 5)
    budget.changeAmount(budget.originalAmount, 6)

    expect(budget.originalAmount).toBe(1000)
    expect(budget.amount).toBe(6000)
  })

  it('should reject an exchange rate less than or equal to 0', () => {
    const budget = makeBudget({ categoryId: 'category-1' })

    expect(() => budget.changeAmount(100, 0)).toThrow(PayloadError)
  })
})
