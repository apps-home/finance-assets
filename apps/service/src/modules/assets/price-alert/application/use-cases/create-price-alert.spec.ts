import { makeAsset } from '@test/factories/make-asset'
import { makeCategory } from '@test/factories/make-category'
import { makeWishlist } from '@test/factories/make-wishlist'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { InMemoryPriceAlertRepository } from '@test/repositories/in-memory-price-alert.repository'
import { InMemoryWishlistRepository } from '@test/repositories/in-memory-wishlist.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { AssetNotFoundError } from '@/modules/assets/asset/application/errors/asset-not-found.error'
import { WishlistNotFoundError } from '@/modules/assets/wishlist/application/errors/wishlist-not-found.error'

import {
  PriceAlertDirection,
  PriceAlertStatus
} from '../../domain/price-alert.entity'
import { CreatePriceAlertUseCase } from './create-price-alert'

describe('CreatePriceAlertUseCase', () => {
  let priceAlertRepository: InMemoryPriceAlertRepository
  let assetRepository: InMemoryAssetRepository
  let wishlistRepository: InMemoryWishlistRepository
  let sut: CreatePriceAlertUseCase

  beforeEach(() => {
    const categoryRepository = new InMemoryCategoryRepository()
    priceAlertRepository = new InMemoryPriceAlertRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)
    wishlistRepository = new InMemoryWishlistRepository()
    sut = new CreatePriceAlertUseCase(
      priceAlertRepository,
      assetRepository,
      wishlistRepository
    )

    categoryRepository.items.push(
      makeCategory({ id: 'category-1', userId: 'user-1' }),
      makeCategory({ id: 'category-2', userId: 'user-2' })
    )
  })

  function seedAsset(categoryId = 'category-1') {
    const asset = makeAsset({
      categoryId,
      marketAssetId: crypto.randomUUID(),
      currentClosePrice: 40
    })
    assetRepository.items.push(asset)
    return asset
  }

  it('should watch the ticker of the asset in the direction of the target', async () => {
    const asset = seedAsset()

    const result = await sut.execute('user-1', {
      assetId: asset.id,
      targetPrice: 35
    })

    expect(result.isRight()).toBe(true)
    expect(priceAlertRepository.items[0]).toMatchObject({
      userId: 'user-1',
      assetId: asset.id,
      wishlistId: null,
      marketAssetId: asset.marketAssetId,
      targetPrice: 35,
      direction: PriceAlertDirection.BELOW,
      status: PriceAlertStatus.ARMED
    })
  })

  it('should create the alert from a wishlist item', async () => {
    const item = makeWishlist({
      userId: 'user-1',
      categoryId: 'category-1',
      marketAssetId: crypto.randomUUID(),
      currentClosePrice: 40
    })
    wishlistRepository.items.push(item)

    await sut.execute('user-1', { wishlistId: item.id, targetPrice: 45 })

    expect(priceAlertRepository.items[0]).toMatchObject({
      wishlistId: item.id,
      assetId: null,
      direction: PriceAlertDirection.ABOVE
    })
  })

  it('should not find an asset or wishlist item of another user', async () => {
    const asset = seedAsset('category-2')
    const item = makeWishlist({
      userId: 'user-2',
      categoryId: 'category-2',
      marketAssetId: crypto.randomUUID(),
      currentClosePrice: 40
    })
    wishlistRepository.items.push(item)

    const byAsset = await sut.execute('user-1', {
      assetId: asset.id,
      targetPrice: 35
    })
    const byItem = await sut.execute('user-1', {
      wishlistId: item.id,
      targetPrice: 35
    })

    expect(byAsset.value).toBeInstanceOf(AssetNotFoundError)
    expect(byItem.value).toBeInstanceOf(WishlistNotFoundError)
    expect(priceAlertRepository.items).toHaveLength(0)
  })

  it('should reject an asset without market quote', async () => {
    const asset = makeAsset({ categoryId: 'category-1', currentClosePrice: 40 })
    assetRepository.items.push(asset)

    const result = await sut.execute('user-1', {
      assetId: asset.id,
      targetPrice: 35
    })

    expect(result.value).toBeInstanceOf(PayloadError)
  })

  it('should need exactly one source and a target different from the quote', async () => {
    const asset = seedAsset()

    const withoutSource = await sut.execute('user-1', { targetPrice: 35 })
    const atQuote = await sut.execute('user-1', {
      assetId: asset.id,
      targetPrice: 40
    })

    expect(withoutSource.value).toBeInstanceOf(PayloadError)
    expect(atQuote.value).toBeInstanceOf(PayloadError)
    expect(priceAlertRepository.items).toHaveLength(0)
  })
})
