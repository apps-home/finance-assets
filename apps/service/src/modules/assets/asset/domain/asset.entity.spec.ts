import { makeAsset } from '@test/factories/make-asset'
import { describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

describe('Asset.update', () => {
  it('should apply only the defined fields', () => {
    const asset = makeAsset({
      categoryId: 'category-1',
      name: 'Tesouro Selic',
      broker: 'Corretora',
      quantity: 2
    })

    asset.update({ name: undefined, quantity: 5 })

    expect(asset.name).toBe('Tesouro Selic')
    expect(asset.broker).toBe('Corretora')
    expect(asset.quantity).toBe(5)
  })

  it('should allow clearing nullable fields with null', () => {
    const asset = makeAsset({ categoryId: 'category-1', broker: 'Corretora' })

    asset.update({ broker: null })

    expect(asset.broker).toBeNull()
  })

  it('should trim the name and keep the category', () => {
    const asset = makeAsset({ categoryId: 'category-1' })

    asset.update({ name: '  Novo nome  ' })

    expect(asset.name).toBe('Novo nome')
    expect(asset.categoryId).toBe('category-1')
  })

  it('should reject an invalid name', () => {
    const asset = makeAsset({ categoryId: 'category-1' })

    expect(() => asset.update({ name: 'a' })).toThrow(PayloadError)
  })
})
