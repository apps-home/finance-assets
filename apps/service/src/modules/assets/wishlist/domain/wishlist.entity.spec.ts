import { makeWishlist } from '@test/factories/make-wishlist'
import { describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

describe('Wishlist.update', () => {
  it('should apply only the defined fields', () => {
    const wishlist = makeWishlist({
      userId: 'user-1',
      categoryId: 'category-1',
      name: 'Petrobras',
      ticker: 'PETR4',
      notes: 'observação'
    })

    wishlist.update({ name: undefined, targetPrice: 40 })

    expect(wishlist.name).toBe('Petrobras')
    expect(wishlist.ticker).toBe('PETR4')
    expect(wishlist.notes).toBe('observação')
    expect(wishlist.targetPrice).toBe(40)
  })

  it('should allow clearing nullable fields with null', () => {
    const wishlist = makeWishlist({
      userId: 'user-1',
      categoryId: 'category-1',
      notes: 'observação',
      targetPrice: 10
    })

    wishlist.update({ notes: null, targetPrice: null })

    expect(wishlist.notes).toBeNull()
    expect(wishlist.targetPrice).toBeNull()
  })

  it('should normalize the ticker and the name', () => {
    const wishlist = makeWishlist({
      userId: 'user-1',
      categoryId: 'category-1'
    })

    wishlist.update({ name: '  Vale  ', ticker: ' vale3 ' })

    expect(wishlist.name).toBe('Vale')
    expect(wishlist.ticker).toBe('VALE3')
  })

  it('should keep the identity and bump updatedAt', () => {
    const wishlist = makeWishlist({
      userId: 'user-1',
      categoryId: 'category-1',
      updatedAt: new Date('2020-01-01')
    })

    wishlist.update({ name: 'Novo nome' })

    expect(wishlist.userId).toBe('user-1')
    expect(wishlist.categoryId).toBe('category-1')
    expect(wishlist.updatedAt.getFullYear()).toBeGreaterThan(2020)
  })

  it('should reject an invalid name', () => {
    const wishlist = makeWishlist({
      userId: 'user-1',
      categoryId: 'category-1'
    })

    expect(() => wishlist.update({ name: 'a' })).toThrow(PayloadError)
  })
})
