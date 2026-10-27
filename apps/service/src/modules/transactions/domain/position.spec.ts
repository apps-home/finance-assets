import { describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

import { buildPosition, contributionInBrl } from './position'
import { Transaction, TransactionType } from './transaction.entity'

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

function tx(
  type: TransactionType,
  date: string,
  fields: {
    quantity?: number
    price?: number
    fees?: number
    factor?: number
    exchangeRate?: number
    createdAt?: Date
  } = {}
) {
  return Transaction.create({
    assetId: 'asset-1',
    userId: 'user-1',
    type,
    date: day(date),
    ...fields
  })
}

describe('buildPosition', () => {
  it('should include the buy fees in the average price', () => {
    const position = buildPosition([
      tx(TransactionType.BUY, '2026-01-10', {
        quantity: 10,
        price: 10,
        fees: 2
      }),
      tx(TransactionType.BUY, '2026-02-10', { quantity: 10, price: 20 })
    ])

    // (100 + 2 + 200) / 20
    expect(position.quantity).toBe(20)
    expect(position.averagePrice).toBeCloseTo(15.1)
  })

  it('should realize the result of a sale at the average price', () => {
    const position = buildPosition([
      tx(TransactionType.BUY, '2026-01-10', {
        quantity: 10,
        price: 10,
        fees: 2
      }),
      tx(TransactionType.BUY, '2026-02-10', { quantity: 10, price: 20 }),
      tx(TransactionType.SELL, '2026-03-10', {
        quantity: 5,
        price: 20,
        fees: 1
      })
    ])

    expect(position.realized).toHaveLength(1)
    // Venda líquida 99, custo 5 × 15,1 = 75,5
    expect(position.realized[0].netProceeds).toBeCloseTo(99)
    expect(position.realized[0].cost).toBeCloseTo(75.5)
    expect(position.realized[0].result).toBeCloseTo(23.5)
    // A venda não muda o preço médio do que sobrou
    expect(position.quantity).toBe(15)
    expect(position.averagePrice).toBeCloseTo(15.1)
  })

  it('should zero the position when everything is sold', () => {
    const position = buildPosition([
      tx(TransactionType.BUY, '2026-01-10', { quantity: 3, price: 10 }),
      tx(TransactionType.SELL, '2026-01-20', { quantity: 3, price: 8 })
    ])

    expect(position).toMatchObject({ quantity: 0, averagePrice: null })
    expect(position.realized[0].result).toBeCloseTo(-6)
  })

  it('should reject a sale larger than the position', () => {
    expect(() =>
      buildPosition([
        tx(TransactionType.BUY, '2026-01-10', { quantity: 3, price: 10 }),
        tx(TransactionType.SELL, '2026-01-20', { quantity: 4, price: 10 })
      ])
    ).toThrow(PayloadError)
  })

  it('should buy before selling on the same day, whatever the order typed', () => {
    const position = buildPosition([
      tx(TransactionType.SELL, '2026-01-10', {
        quantity: 5,
        price: 12,
        createdAt: new Date('2026-01-10T10:00:00Z')
      }),
      tx(TransactionType.BUY, '2026-01-10', {
        quantity: 5,
        price: 10,
        createdAt: new Date('2026-01-10T11:00:00Z')
      })
    ])

    expect(position.quantity).toBe(0)
    expect(position.realized[0].result).toBeCloseTo(10)
  })

  it('should apply splits and reverse splits keeping the total cost', () => {
    const split = buildPosition([
      tx(TransactionType.BUY, '2026-01-10', { quantity: 100, price: 30 }),
      tx(TransactionType.SPLIT, '2026-02-01', { factor: 3 })
    ])
    const reverse = buildPosition([
      tx(TransactionType.BUY, '2026-01-10', { quantity: 100, price: 1 }),
      tx(TransactionType.REVERSE_SPLIT, '2026-02-01', { factor: 10 })
    ])

    expect(split).toMatchObject({ quantity: 300, totalCost: 3000 })
    expect(split.averagePrice).toBeCloseTo(10)
    expect(reverse).toMatchObject({ quantity: 10, totalCost: 100 })
    expect(reverse.averagePrice).toBeCloseTo(10)
  })

  it('should add the attributed cost of a bonus', () => {
    const position = buildPosition([
      tx(TransactionType.BUY, '2026-01-10', { quantity: 100, price: 10 }),
      tx(TransactionType.BONUS, '2026-02-01', { quantity: 10, price: 5 })
    ])

    // (1000 + 50) / 110
    expect(position.quantity).toBe(110)
    expect(position.averagePrice).toBeCloseTo(1050 / 110)
  })

  it('should start from the opening position', () => {
    const position = buildPosition([
      tx(TransactionType.BUY, '2026-03-01', { quantity: 10, price: 30 }),
      tx(TransactionType.OPENING, '2026-03-01', { quantity: 10, price: 20 })
    ])

    expect(position.quantity).toBe(20)
    expect(position.averagePrice).toBeCloseTo(25)
  })

  it('should reject an operation before the opening position', () => {
    expect(() =>
      buildPosition([
        tx(TransactionType.OPENING, '2026-03-01', { quantity: 10, price: 20 }),
        tx(TransactionType.BUY, '2026-02-01', { quantity: 10, price: 30 })
      ])
    ).toThrow(PayloadError)
  })
})

describe('contributionInBrl', () => {
  it('should count buys with fees and sales without them, in reais', () => {
    const buy = tx(TransactionType.BUY, '2026-01-10', {
      quantity: 2,
      price: 100,
      fees: 1,
      exchangeRate: 5
    })
    const sell = tx(TransactionType.SELL, '2026-01-10', {
      quantity: 1,
      price: 100,
      fees: 1
    })

    expect(contributionInBrl(buy)).toBeCloseTo(1005)
    expect(contributionInBrl(sell)).toBeCloseTo(-99)
    expect(
      contributionInBrl(
        tx(TransactionType.OPENING, '2026-01-10', { quantity: 1, price: 100 })
      )
    ).toBe(0)
  })
})
