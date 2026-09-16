import { Injectable, Logger } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'
import { WishlistRepository } from '@/modules/assets/wishlist/domain/wishlist.repository'

import { AssetRepository } from '../../domain/asset.repository'

export interface AssetVariationItem {
  id: string
  ticker: string
  name: string
  categoryName: string
  categoryType: string
  currency: string
  currentPrice: number
  previousPrice: number
  priceDiff: number
  variationPercent: number
  quantity: number | null
  averagePrice: number | null
  totalCurrentValue: number | null
}

export interface WishlistVariationItem {
  id: string
  ticker: string
  name: string
  categoryName: string
  categoryType: string
  currency: string
  currentPrice: number
  previousPrice: number | null
  targetPrice: number | null
  priceDiff: number | null
  variationPercent: number | null
  notes: string | null
}

export interface UserVariationsNotificationPayload {
  event: 'ASSET_VARIATION_ALERT'
  sentAt: string
  thresholdPercent: number
  user: {
    id: string
    name: string
    email: string
  }
  summary: {
    totalGainsCount: number
    totalLossesCount: number
    bestGainPercent: number | null
    worstDropPercent: number | null
    totalWishlistTargetReachedCount: number
    totalWishlistGainersCount: number
    totalWishlistLosersCount: number
    date: string
  }
  gainers: AssetVariationItem[]
  losers: AssetVariationItem[]
  wishlist: {
    targetReached: WishlistVariationItem[]
    gainers: WishlistVariationItem[]
    losers: WishlistVariationItem[]
  }
}

export interface FindAssetsVariationsResult {
  totalAssetsEvaluated: number
  totalGainers: number
  totalLosers: number
  totalWishlistItemsEvaluated: number
  totalWishlistTargetReached: number
  totalWishlistGainers: number
  totalWishlistLosers: number
  userAlerts: UserVariationsNotificationPayload[]
}

type FindAssetsVariationsResponse = Either<Error, FindAssetsVariationsResult>

const VARIATION_THRESHOLD_PERCENT = 5

interface UserAlertData {
  user: { id: string; name: string; email: string }
  gainers: AssetVariationItem[]
  losers: AssetVariationItem[]
  wishlist: {
    targetReached: WishlistVariationItem[]
    gainers: WishlistVariationItem[]
    losers: WishlistVariationItem[]
  }
}

@Injectable()
export class NotifyAssetVariationsUseCase {
  private readonly logger = new Logger(NotifyAssetVariationsUseCase.name)

  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly wishlistRepository: WishlistRepository
  ) {}

  async execute(): Promise<FindAssetsVariationsResponse> {
    try {
      this.logger.log(
        'Evaluating asset and wishlist variations (comparing currentClosePrice with lastMonthClosePrice and targetPrice)...'
      )

      const [activeAssets, wishlistItems] = await Promise.all([
        this.assetRepository.findAllActiveWithUserDetails(),
        this.wishlistRepository.findAllWithUserDetails()
      ])

      const userMap = new Map<string, UserAlertData>()

      const getOrCreateUserRecord = (user: {
        id: string
        name: string
        email: string
      }): UserAlertData => {
        if (!userMap.has(user.id)) {
          userMap.set(user.id, {
            user: {
              id: user.id,
              name: user.name,
              email: user.email
            },
            gainers: [],
            losers: [],
            wishlist: {
              targetReached: [],
              gainers: [],
              losers: []
            }
          })
        }
        return userMap.get(user.id)!
      }

      let totalGainers = 0
      let totalLosers = 0

      for (const item of activeAssets) {
        const { asset, category, user } = item
        const currentPrice = asset.currentClosePrice
        const previousPrice = asset.lastMonthClosePrice

        if (
          currentPrice === null ||
          previousPrice === null ||
          previousPrice <= 0
        ) {
          continue
        }

        const rawVariation =
          ((currentPrice - previousPrice) / previousPrice) * 100
        const variationPercent = Number(rawVariation.toFixed(2))

        const isGain = variationPercent >= VARIATION_THRESHOLD_PERCENT
        const isLoss = variationPercent <= -VARIATION_THRESHOLD_PERCENT

        if (!isGain && !isLoss) {
          continue
        }

        const priceDiff = Number((currentPrice - previousPrice).toFixed(2))
        const quantity = asset.quantity
        const totalCurrentValue =
          quantity !== null
            ? Number((quantity * currentPrice).toFixed(2))
            : null

        const assetItem: AssetVariationItem = {
          id: asset.id,
          ticker: asset.ticker,
          name: asset.name,
          categoryName: category.name,
          categoryType: category.type,
          currency: category.currency,
          currentPrice,
          previousPrice,
          priceDiff,
          variationPercent,
          quantity,
          averagePrice: asset.averagePrice,
          totalCurrentValue
        }

        const userRecord = getOrCreateUserRecord(user)

        if (isGain) {
          totalGainers++
          userRecord.gainers.push(assetItem)
        } else {
          totalLosers++
          userRecord.losers.push(assetItem)
        }
      }

      let totalWishlistTargetReached = 0
      let totalWishlistGainers = 0
      let totalWishlistLosers = 0

      for (const item of wishlistItems) {
        const { wishlist, category, user } = item
        const currentPrice = wishlist.currentClosePrice
        const previousPrice = wishlist.lastMonthClosePrice
        const targetPrice = wishlist.targetPrice

        if (currentPrice === null || currentPrice <= 0) {
          continue
        }

        let priceDiff: number | null = null
        let variationPercent: number | null = null
        let isGain = false
        let isLoss = false

        if (previousPrice !== null && previousPrice > 0) {
          const rawVariation =
            ((currentPrice - previousPrice) / previousPrice) * 100
          variationPercent = Number(rawVariation.toFixed(2))
          priceDiff = Number((currentPrice - previousPrice).toFixed(2))

          isGain = variationPercent >= VARIATION_THRESHOLD_PERCENT
          isLoss = variationPercent <= -VARIATION_THRESHOLD_PERCENT
        }

        const isTargetReached =
          targetPrice !== null && currentPrice <= targetPrice

        if (!isTargetReached && !isGain && !isLoss) {
          continue
        }

        const wishlistItem: WishlistVariationItem = {
          id: wishlist.id,
          ticker: wishlist.ticker,
          name: wishlist.name,
          categoryName: category.name,
          categoryType: category.type,
          currency: category.currency,
          currentPrice,
          previousPrice,
          targetPrice,
          priceDiff,
          variationPercent,
          notes: wishlist.notes
        }

        const userRecord = getOrCreateUserRecord(user)

        if (isTargetReached) {
          totalWishlistTargetReached++
          userRecord.wishlist.targetReached.push(wishlistItem)
        }

        if (isGain) {
          totalWishlistGainers++
          userRecord.wishlist.gainers.push(wishlistItem)
        } else if (isLoss) {
          totalWishlistLosers++
          userRecord.wishlist.losers.push(wishlistItem)
        }
      }

      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      const userAlerts: UserVariationsNotificationPayload[] = []

      for (const [, userData] of userMap) {
        const hasPortfolioAlerts =
          userData.gainers.length > 0 || userData.losers.length > 0
        const hasWishlistAlerts =
          userData.wishlist.targetReached.length > 0 ||
          userData.wishlist.gainers.length > 0 ||
          userData.wishlist.losers.length > 0

        if (!hasPortfolioAlerts && !hasWishlistAlerts) {
          continue
        }

        // Ordenar maiores altas da carteira do maior para o menor
        userData.gainers.sort((a, b) => b.variationPercent - a.variationPercent)

        // Ordenar maiores baixas da carteira da maior queda (mais negativo) para a menor
        userData.losers.sort((a, b) => a.variationPercent - b.variationPercent)

        // Ordenar maiores altas da Wishlist do maior para o menor
        userData.wishlist.gainers.sort(
          (a, b) => (b.variationPercent ?? 0) - (a.variationPercent ?? 0)
        )

        // Ordenar maiores baixas da Wishlist da maior queda para a menor
        userData.wishlist.losers.sort(
          (a, b) => (a.variationPercent ?? 0) - (b.variationPercent ?? 0)
        )

        // Ordenar targetReached pela maior margem de desconto em relação ao preço alvo
        userData.wishlist.targetReached.sort((a, b) => {
          const marginA =
            a.targetPrice && a.targetPrice > 0
              ? (a.currentPrice - a.targetPrice) / a.targetPrice
              : 0
          const marginB =
            b.targetPrice && b.targetPrice > 0
              ? (b.currentPrice - b.targetPrice) / b.targetPrice
              : 0
          return marginA - marginB
        })

        const bestGainPercent = userData.gainers[0]?.variationPercent ?? null
        const worstDropPercent = userData.losers[0]?.variationPercent ?? null

        userAlerts.push({
          event: 'ASSET_VARIATION_ALERT',
          sentAt: now.toISOString(),
          thresholdPercent: VARIATION_THRESHOLD_PERCENT,
          user: userData.user,
          summary: {
            totalGainsCount: userData.gainers.length,
            totalLossesCount: userData.losers.length,
            bestGainPercent,
            worstDropPercent,
            totalWishlistTargetReachedCount:
              userData.wishlist.targetReached.length,
            totalWishlistGainersCount: userData.wishlist.gainers.length,
            totalWishlistLosersCount: userData.wishlist.losers.length,
            date: dateStr
          },
          gainers: userData.gainers,
          losers: userData.losers,
          wishlist: userData.wishlist
        })
      }

      this.logger.log(
        `Evaluation finished: ${activeAssets.length} assets and ${wishlistItems.length} wishlist items evaluated. ` +
          `Found ${totalGainers} portfolio gainer(s), ${totalLosers} loser(s), ` +
          `${totalWishlistTargetReached} target reached, ${totalWishlistGainers} wishlist gainer(s) and ${totalWishlistLosers} loser(s) across ${userAlerts.length} user(s).`
      )

      return right({
        totalAssetsEvaluated: activeAssets.length,
        totalGainers,
        totalLosers,
        totalWishlistItemsEvaluated: wishlistItems.length,
        totalWishlistTargetReached,
        totalWishlistGainers,
        totalWishlistLosers,
        userAlerts
      })
    } catch (error) {
      this.logger.error('Failed to evaluate asset variations', error)
      return left(error instanceof Error ? error : new Error(String(error)))
    }
  }
}
