import { makePriceAlert } from '@test/factories/make-price-alert'
import { describe, expect, it } from 'vitest'

import { PriceAlertDirection } from './price-alert.entity'
import {
  buildPriceAlertNotification,
  formatPrice
} from './price-alert-notification'

describe('buildPriceAlertNotification', () => {
  it('should describe the reached alert with prices in the source currency', () => {
    const alert = makePriceAlert({
      userId: 'user-1',
      targetPrice: 200,
      direction: PriceAlertDirection.ABOVE,
      assetId: null,
      wishlistId: 'wishlist-1'
    })

    const payload = buildPriceAlertNotification(
      {
        alert,
        ticker: 'AAPL',
        currentPrice: 201.5,
        source: {
          kind: 'WISHLIST',
          id: 'wishlist-1',
          name: 'Apple',
          currency: 'USD'
        }
      },
      201.5
    )

    expect(payload).toMatchObject({
      alertId: alert.id,
      ticker: 'AAPL',
      name: 'Apple',
      currency: 'USD',
      direction: PriceAlertDirection.ABOVE,
      directionLabel: 'subiu para',
      targetPrice: 200,
      currentPrice: 201.5,
      source: 'WISHLIST',
      sourceId: 'wishlist-1',
      url: '/wishlist'
    })
    expect(payload.currentPriceFormatted).toBe(formatPrice(201.5, 'USD'))
  })
})

describe('formatPrice', () => {
  it('should format in pt-BR and keep the cents of cheap assets', () => {
    // Intl separa o símbolo com espaço não separável
    expect(formatPrice(40, 'BRL').replace(/\s/g, ' ')).toBe('R$ 40,00')
    expect(formatPrice(0.000123, 'BRL').replace(/\s/g, ' ')).toBe('R$ 0,000123')
  })

  it('should fall back for an invalid currency code', () => {
    expect(formatPrice(40, 'INVALID')).toBe('INVALID 40.00')
  })
})
