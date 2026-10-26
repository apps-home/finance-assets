import { makeDividend } from '@test/factories/make-dividend'
import { describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

import { Dividend, DividendSource, DividendType } from './dividend.entity'

describe('Dividend entity', () => {
  it('should default to a manual DIVIDEND payment', () => {
    const dividend = makeDividend({ userId: 'user-1', assetId: 'asset-1' })

    expect(dividend.type).toBe(DividendType.DIVIDEND)
    expect(dividend.source).toBe(DividendSource.MANUAL)
  })

  it('should normalize the payment date to the UTC calendar day', () => {
    const dividend = makeDividend({
      userId: 'user-1',
      assetId: 'asset-1',
      paymentDate: new Date('2026-03-10T15:45:00.000Z')
    })

    expect(dividend.paymentDate.toISOString()).toBe('2026-03-10T00:00:00.000Z')
  })

  it('should reject a non-positive amount', () => {
    expect(() =>
      Dividend.create({
        userId: 'user-1',
        assetId: 'asset-1',
        amount: 0,
        paymentDate: new Date()
      })
    ).toThrow(PayloadError)
  })

  it('should reject an invalid payment date', () => {
    expect(() =>
      Dividend.create({
        userId: 'user-1',
        assetId: 'asset-1',
        amount: 10,
        paymentDate: new Date('invalid')
      })
    ).toThrow(PayloadError)
  })

  it('should convert the amount to BRL using the exchange rate', () => {
    const dividend = makeDividend({
      userId: 'user-1',
      assetId: 'asset-1',
      amount: 10,
      exchangeRate: 5.5
    })

    expect(dividend.amountInBRL).toBe(55)
  })

  it('should partially update, ignoring undefined fields', () => {
    const dividend = makeDividend({
      userId: 'user-1',
      assetId: 'asset-1',
      amount: 10,
      type: DividendType.JCP
    })

    dividend.update({ amount: 20, type: undefined })

    expect(dividend.amount).toBe(20)
    expect(dividend.type).toBe(DividendType.JCP)
  })

  it('should clear nullable fields with null', () => {
    const dividend = makeDividend({
      userId: 'user-1',
      assetId: 'asset-1',
      comDate: new Date('2026-03-01T00:00:00.000Z')
    })

    dividend.update({ comDate: null })

    expect(dividend.comDate).toBeNull()
  })

  it('should deduct the tax from the net amount and the BRL amount', () => {
    const dividend = makeDividend({
      userId: 'user-1',
      assetId: 'asset-1',
      amount: 10,
      taxAmount: 3,
      exchangeRate: 5
    })

    expect(dividend.netAmount).toBe(7)
    expect(dividend.amountInBRL).toBe(35)
  })

  it('should treat a missing tax as zero', () => {
    const dividend = makeDividend({
      userId: 'user-1',
      assetId: 'asset-1',
      amount: 10
    })

    expect(dividend.taxAmount).toBeNull()
    expect(dividend.netAmount).toBe(10)
  })

  it('should reject a negative tax or one that is not below the amount', () => {
    const build = (taxAmount: number) => () =>
      makeDividend({
        userId: 'user-1',
        assetId: 'asset-1',
        amount: 10,
        taxAmount
      })

    expect(build(-1)).toThrow(PayloadError)
    expect(build(10)).toThrow(PayloadError)
  })

  it('should validate the tax against the amount on update', () => {
    const dividend = makeDividend({
      userId: 'user-1',
      assetId: 'asset-1',
      amount: 10,
      taxAmount: 3
    })

    expect(() => dividend.update({ amount: 2 })).toThrow(PayloadError)

    dividend.update({ taxAmount: 0 })

    expect(dividend.netAmount).toBe(10)
  })
})
