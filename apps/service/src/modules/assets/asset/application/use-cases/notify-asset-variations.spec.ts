import { makeAsset } from '@test/factories/make-asset'
import { makeWishlist } from '@test/factories/make-wishlist'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { InMemoryWishlistRepository } from '@test/repositories/in-memory-wishlist.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'
import { WishlistWithUserDetails } from '@/modules/assets/wishlist/domain/wishlist.repository'

import { AssetWithUserDetails } from '../../domain/asset.repository'
import { NotifyAssetVariationsUseCase } from './notify-asset-variations'

const categorySummary = {
  id: 'category-1',
  name: 'Ações',
  type: CategoryType.VARIABLE_BR,
  currency: 'BRL'
}

const user1 = { id: 'user-1', name: 'Ana', email: 'ana@test.com' }
const user2 = { id: 'user-2', name: 'Bia', email: 'bia@test.com' }

describe('NotifyAssetVariationsUseCase', () => {
  let assetRepository: InMemoryAssetRepository
  let wishlistRepository: InMemoryWishlistRepository
  let sut: NotifyAssetVariationsUseCase

  beforeEach(() => {
    assetRepository = new InMemoryAssetRepository(
      new InMemoryCategoryRepository()
    )
    wishlistRepository = new InMemoryWishlistRepository()
    sut = new NotifyAssetVariationsUseCase(assetRepository, wishlistRepository)
  })

  function assetItem(
    ticker: string,
    currentClosePrice: number | null,
    lastMonthClosePrice: number | null,
    user = user1
  ): AssetWithUserDetails {
    return {
      asset: makeAsset({
        categoryId: categorySummary.id,
        ticker,
        quantity: 10,
        averagePrice: 50,
        currentClosePrice,
        lastMonthClosePrice
      }),
      category: categorySummary,
      user
    }
  }

  function wishlistItem(
    ticker: string,
    prices: {
      currentClosePrice: number | null
      lastMonthClosePrice?: number | null
      targetPrice?: number | null
    },
    user = user1
  ): WishlistWithUserDetails {
    return {
      wishlist: makeWishlist({
        userId: user.id,
        categoryId: categorySummary.id,
        ticker,
        ...prices
      }),
      category: categorySummary,
      user
    }
  }

  function seed(
    assets: AssetWithUserDetails[],
    wishlist: WishlistWithUserDetails[] = []
  ) {
    vi.spyOn(assetRepository, 'findAllActiveWithUserDetails').mockResolvedValue(
      assets
    )
    vi.spyOn(wishlistRepository, 'findAllWithUserDetails').mockResolvedValue(
      wishlist
    )
  }

  it('should return no alerts when there is nothing to evaluate', async () => {
    const result = await sut.execute()

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      totalAssetsEvaluated: 0,
      totalWishlistItemsEvaluated: 0,
      userAlerts: []
    })
  })

  it('should classify gains and losses at the 5% threshold', async () => {
    seed([
      assetItem('GAIN', 105, 100),
      assetItem('LOSS', 95, 100),
      assetItem('SMALLUP', 104, 100),
      assetItem('SMALLDOWN', 96, 100)
    ])

    const result = await sut.execute()

    expect(result.value).toMatchObject({
      totalAssetsEvaluated: 4,
      totalGainers: 1,
      totalLosers: 1
    })

    const [alert] = (
      result.value as {
        userAlerts: { gainers: unknown[]; losers: unknown[] }[]
      }
    ).userAlerts
    expect(alert.gainers).toMatchObject([
      { ticker: 'GAIN', variationPercent: 5, priceDiff: 5 }
    ])
    expect(alert.losers).toMatchObject([
      { ticker: 'LOSS', variationPercent: -5, priceDiff: -5 }
    ])
  })

  it('should skip assets without a usable comparison', async () => {
    seed([
      assetItem('NOCURRENT', null, 100),
      assetItem('NOPREVIOUS', 100, null),
      assetItem('ZEROPREVIOUS', 100, 0)
    ])

    const result = await sut.execute()

    expect(result.value).toMatchObject({
      totalAssetsEvaluated: 3,
      totalGainers: 0,
      totalLosers: 0,
      userAlerts: []
    })
  })

  it('should compute the total current value from the quantity', async () => {
    seed([assetItem('GAIN', 110, 100)])

    const result = await sut.execute()

    const [alert] = (result.value as { userAlerts: { gainers: unknown[] }[] })
      .userAlerts
    expect(alert.gainers).toMatchObject([
      { quantity: 10, totalCurrentValue: 1100, categoryName: 'Ações' }
    ])
  })

  it('should order gainers by the biggest gain and losers by the biggest drop', async () => {
    seed([
      assetItem('SMALLGAIN', 106, 100),
      assetItem('BIGGAIN', 120, 100),
      assetItem('SMALLLOSS', 94, 100),
      assetItem('BIGLOSS', 80, 100)
    ])

    const result = await sut.execute()

    const [alert] = (
      result.value as {
        userAlerts: {
          gainers: { ticker: string }[]
          losers: { ticker: string }[]
          summary: { bestGainPercent: number; worstDropPercent: number }
        }[]
      }
    ).userAlerts
    expect(alert.gainers.map((a) => a.ticker)).toEqual(['BIGGAIN', 'SMALLGAIN'])
    expect(alert.losers.map((a) => a.ticker)).toEqual(['BIGLOSS', 'SMALLLOSS'])
    expect(alert.summary).toMatchObject({
      totalGainsCount: 2,
      totalLossesCount: 2,
      bestGainPercent: 20,
      worstDropPercent: -20
    })
  })

  it('should group the alerts by user and skip users without alerts', async () => {
    seed([assetItem('ANA', 120, 100, user1), assetItem('BIA', 101, 100, user2)])

    const result = await sut.execute()

    const { userAlerts } = result.value as {
      userAlerts: { user: typeof user1; event: string }[]
    }
    expect(userAlerts).toHaveLength(1)
    expect(userAlerts[0]).toMatchObject({
      event: 'ASSET_VARIATION_ALERT',
      user: user1
    })
  })

  it('should flag wishlist items at or below the target price', async () => {
    seed(
      [],
      [
        wishlistItem('BELOW', { currentClosePrice: 8, targetPrice: 10 }),
        wishlistItem('EQUAL', { currentClosePrice: 10, targetPrice: 10 }),
        wishlistItem('ABOVE', { currentClosePrice: 12, targetPrice: 10 }),
        wishlistItem('NOTARGET', { currentClosePrice: 5, targetPrice: null })
      ]
    )

    const result = await sut.execute()

    expect(result.value).toMatchObject({
      totalWishlistItemsEvaluated: 4,
      totalWishlistTargetReached: 2
    })

    const [alert] = (
      result.value as {
        userAlerts: {
          wishlist: { targetReached: { ticker: string }[] }
        }[]
      }
    ).userAlerts
    // maior desconto em relação ao alvo primeiro
    expect(alert.wishlist.targetReached.map((i) => i.ticker)).toEqual([
      'BELOW',
      'EQUAL'
    ])
  })

  it('should classify wishlist gainers and losers when there is a previous price', async () => {
    seed(
      [],
      [
        wishlistItem('UP', {
          currentClosePrice: 110,
          lastMonthClosePrice: 100
        }),
        wishlistItem('DOWN', {
          currentClosePrice: 90,
          lastMonthClosePrice: 100
        }),
        wishlistItem('FLAT', {
          currentClosePrice: 101,
          lastMonthClosePrice: 100
        })
      ]
    )

    const result = await sut.execute()

    expect(result.value).toMatchObject({
      totalWishlistGainers: 1,
      totalWishlistLosers: 1,
      totalWishlistTargetReached: 0
    })
  })

  it('should skip wishlist items without a current price', async () => {
    seed(
      [],
      [
        wishlistItem('NOPRICE', { currentClosePrice: null, targetPrice: 10 }),
        wishlistItem('ZERO', { currentClosePrice: 0, targetPrice: 10 })
      ]
    )

    const result = await sut.execute()

    expect(result.value).toMatchObject({
      totalWishlistTargetReached: 0,
      userAlerts: []
    })
  })

  it('should return a left when a repository fails', async () => {
    vi.spyOn(assetRepository, 'findAllActiveWithUserDetails').mockRejectedValue(
      new Error('db down')
    )

    const result = await sut.execute()

    expect(result.isLeft()).toBe(true)
    expect((result.value as Error).message).toBe('db down')
  })
})
