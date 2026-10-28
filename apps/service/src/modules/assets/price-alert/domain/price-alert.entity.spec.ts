import { makePriceAlert } from '@test/factories/make-price-alert'
import { describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

import {
  PriceAlert,
  PriceAlertDirection,
  PriceAlertStatus
} from './price-alert.entity'

function create(targetPrice: number, currentPrice: number | null = 40) {
  return PriceAlert.create({
    userId: 'user-1',
    marketAssetId: 'market-asset-1',
    assetId: 'asset-1',
    targetPrice,
    currentPrice
  })
}

describe('PriceAlert', () => {
  it('should watch for a rise when the target is above the quote', () => {
    const alert = create(45)

    expect(alert.direction).toBe(PriceAlertDirection.ABOVE)
    expect(alert.status).toBe(PriceAlertStatus.ARMED)
  })

  it('should watch for a drop when the target is below the quote', () => {
    expect(create(35).direction).toBe(PriceAlertDirection.BELOW)
  })

  it('should reject a target equal to the quote or an asset without quote', () => {
    expect(() => create(40)).toThrow(PayloadError)
    expect(() => create(45, null)).toThrow(PayloadError)
    expect(() => create(0)).toThrow(PayloadError)
  })

  it('should need exactly one source', () => {
    const base = {
      userId: 'user-1',
      marketAssetId: 'market-asset-1',
      targetPrice: 45,
      currentPrice: 40
    }

    expect(() => PriceAlert.create(base)).toThrow(PayloadError)
    expect(() =>
      PriceAlert.create({ ...base, assetId: 'a', wishlistId: 'w' })
    ).toThrow(PayloadError)
  })

  it('should count the target itself as reached', () => {
    const below = makePriceAlert({ userId: 'user-1', targetPrice: 40 })
    const above = makePriceAlert({
      userId: 'user-1',
      targetPrice: 40,
      direction: PriceAlertDirection.ABOVE
    })

    expect(below.isReachedBy(40)).toBe(true)
    expect(below.isReachedBy(40.01)).toBe(false)
    expect(above.isReachedBy(40)).toBe(true)
    expect(above.isReachedBy(39.99)).toBe(false)
  })

  it('should trigger when armed and re-arm when the quote leaves the range', () => {
    const alert = makePriceAlert({ userId: 'user-1', targetPrice: 40 })

    expect(alert.evaluate(41)).toBeNull()
    expect(alert.evaluate(39)).toBe('TRIGGER')

    alert.markTriggered(39, new Date('2026-10-20'))

    expect(alert).toMatchObject({
      status: PriceAlertStatus.TRIGGERED,
      lastTriggeredPrice: 39,
      lastTriggeredAt: new Date('2026-10-20'),
      triggerCount: 1
    })
    expect(alert.evaluate(38)).toBeNull()
    expect(alert.evaluate(41)).toBe('REARM')

    alert.rearm()

    expect(alert.status).toBe(PriceAlertStatus.ARMED)
    expect(alert.triggerCount).toBe(1)
  })
})
