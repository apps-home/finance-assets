import { makeAsset } from '@test/factories/make-asset'
import { makeDividend } from '@test/factories/make-dividend'
import { describe, expect, it } from 'vitest'

import {
  Transaction,
  TransactionType
} from '@/modules/transactions/domain/transaction.entity'

import { calcAssetTotalReturn } from './asset-total-return'

const NOW = new Date('2026-10-27T12:00:00Z')

function transaction(
  type: TransactionType,
  date: string,
  quantity: number,
  price: number,
  fees = 0
) {
  return Transaction.create({
    assetId: 'asset-1',
    userId: 'user-1',
    type,
    date: new Date(date),
    quantity,
    price,
    fees
  })
}

function dividend(paymentDate: string, amount: number, taxAmount?: number) {
  return makeDividend({
    userId: 'user-1',
    assetId: 'asset-1',
    paymentDate: new Date(paymentDate),
    amount,
    taxAmount: taxAmount ?? null
  })
}

describe('calcAssetTotalReturn', () => {
  it('should sum the price result and the net dividends already paid', () => {
    const asset = makeAsset({
      categoryId: 'category-1',
      quantity: 100,
      averagePrice: 10,
      currentClosePrice: 9.5
    })

    const result = calcAssetTotalReturn(
      asset,
      [],
      [
        dividend('2026-03-10', 60, 10),
        dividend('2026-09-10', 30),
        // Futuro: ainda não recebido
        dividend('2026-11-10', 1000)
      ],
      NOW
    )

    expect(result).toMatchObject({
      unrealizedResult: -50,
      realizedResult: 0,
      dividendsReceived: 80,
      totalReturn: 30,
      investedCapital: 1000
    })
    expect(result.totalReturnPercentage).toBeCloseTo(3)
  })

  it('should include realized sales and use all purchases as the capital', () => {
    // Comprou 100 a 10 (+10 de taxa), vendeu 50 a 12: PM 10,10, lucro 95
    const asset = makeAsset({
      categoryId: 'category-1',
      quantity: 50,
      averagePrice: 10.1,
      currentClosePrice: 11.1
    })

    const result = calcAssetTotalReturn(
      asset,
      [
        transaction(TransactionType.BUY, '2026-01-10', 100, 10, 10),
        transaction(TransactionType.SELL, '2026-05-10', 50, 12)
      ],
      [],
      NOW
    )

    expect(result).toMatchObject({
      unrealizedResult: 50,
      realizedResult: 95,
      totalReturn: 145,
      investedCapital: 1010
    })
    expect(result.totalReturnPercentage).toBeCloseTo((145 / 1010) * 100)
  })

  it('should keep the return of a position that was fully sold', () => {
    const asset = makeAsset({
      categoryId: 'category-1',
      quantity: 0,
      averagePrice: null,
      currentClosePrice: 20
    })

    const result = calcAssetTotalReturn(
      asset,
      [
        transaction(TransactionType.BUY, '2026-01-10', 10, 10),
        transaction(TransactionType.SELL, '2026-05-10', 10, 15)
      ],
      [dividend('2026-03-10', 5)],
      NOW
    )

    expect(result).toMatchObject({
      unrealizedResult: 0,
      realizedResult: 50,
      dividendsReceived: 5,
      totalReturn: 55,
      investedCapital: 100
    })
  })

  it('should not have a percentage without invested capital', () => {
    const asset = makeAsset({
      categoryId: 'category-1',
      quantity: null,
      averagePrice: null
    })

    const result = calcAssetTotalReturn(
      asset,
      [],
      [dividend('2026-03-10', 5)],
      NOW
    )

    expect(result.totalReturn).toBe(5)
    expect(result.investedCapital).toBeNull()
    expect(result.totalReturnPercentage).toBeNull()
  })
})
