import { makePatrimonyItem } from '@test/factories/make-patrimony-item'
import { describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

import { PatrimonyItem, PatrimonyItemType } from './patrimony-item.entity'

describe('PatrimonyItem', () => {
  it('distinguishes physical assets from liabilities', () => {
    const vehicle = makePatrimonyItem({
      type: PatrimonyItemType.VEHICLE,
      currentValue: 65_000
    })
    const loan = makePatrimonyItem({
      type: PatrimonyItemType.LIABILITY,
      currentValue: 20_000
    })

    expect(vehicle.isAsset).toBe(true)
    expect(vehicle.isLiability).toBe(false)
    expect(vehicle.signedValue).toBe(65_000)

    expect(loan.isAsset).toBe(false)
    expect(loan.isLiability).toBe(true)
    expect(loan.signedValue).toBe(-20_000)
  })

  it('updates only defined fields and allows clearing nullable ones', () => {
    const item = makePatrimonyItem({
      name: 'Apartamento',
      type: PatrimonyItemType.REAL_ESTATE,
      currentValue: 400_000,
      purchaseValue: 350_000,
      notes: 'Quitado'
    })

    item.update({
      currentValue: 420_000,
      purchaseValue: null,
      notes: '   '
    })

    expect(item.name).toBe('Apartamento')
    expect(item.currentValue).toBe(420_000)
    expect(item.purchaseValue).toBeNull()
    expect(item.notes).toBeNull()
  })

  it('rejects negative values and short names', () => {
    expect(() =>
      PatrimonyItem.create({
        userId: 'user-1',
        name: 'A',
        type: PatrimonyItemType.VEHICLE,
        currentValue: 10_000
      })
    ).toThrow(PayloadError)

    expect(() =>
      PatrimonyItem.create({
        userId: 'user-1',
        name: 'Carro',
        type: PatrimonyItemType.VEHICLE,
        currentValue: -1
      })
    ).toThrow(PayloadError)

    const item = makePatrimonyItem()
    expect(() => item.update({ currentValue: -10 })).toThrow(PayloadError)
    expect(() => item.update({ purchaseValue: -10 })).toThrow(PayloadError)
  })
})
