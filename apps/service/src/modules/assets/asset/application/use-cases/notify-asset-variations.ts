import { Injectable, Logger } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

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
    date: string
  }
  gainers: AssetVariationItem[]
  losers: AssetVariationItem[]
}

export interface FindAssetsVariationsResult {
  totalAssetsEvaluated: number
  totalGainers: number
  totalLosers: number
  userAlerts: UserVariationsNotificationPayload[]
}

type FindAssetsVariationsResponse = Either<Error, FindAssetsVariationsResult>

const VARIATION_THRESHOLD_PERCENT = 5

@Injectable()
export class NotifyAssetVariationsUseCase {
  private readonly logger = new Logger(NotifyAssetVariationsUseCase.name)

  constructor(private readonly assetRepository: AssetRepository) {}

  async execute(): Promise<FindAssetsVariationsResponse> {
    try {
      this.logger.log(
        'Evaluating asset variations (comparing currentClosePrice with lastMonthClosePrice)...'
      )

      const activeAssets =
        await this.assetRepository.findAllActiveWithUserDetails()

      const userMap = new Map<
        string,
        {
          user: { id: string; name: string; email: string }
          gainers: AssetVariationItem[]
          losers: AssetVariationItem[]
        }
      >()

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

        if (!userMap.has(user.id)) {
          userMap.set(user.id, {
            user: {
              id: user.id,
              name: user.name,
              email: user.email
            },
            gainers: [],
            losers: []
          })
        }

        const userRecord = userMap.get(user.id)!

        if (isGain) {
          totalGainers++
          userRecord.gainers.push(assetItem)
        } else {
          totalLosers++
          userRecord.losers.push(assetItem)
        }
      }

      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      const userAlerts: UserVariationsNotificationPayload[] = []

      for (const [, userData] of userMap) {
        if (userData.gainers.length === 0 && userData.losers.length === 0) {
          continue
        }

        // Ordenar maiores altas do maior para o menor
        userData.gainers.sort((a, b) => b.variationPercent - a.variationPercent)

        // Ordenar maiores baixas da maior queda (mais negativo) para a menor
        userData.losers.sort((a, b) => a.variationPercent - b.variationPercent)

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
            date: dateStr
          },
          gainers: userData.gainers,
          losers: userData.losers
        })
      }

      this.logger.log(
        `Evaluation finished: ${activeAssets.length} assets evaluated. Found ${totalGainers} gainer(s) and ${totalLosers} loser(s) across ${userAlerts.length} user(s).`
      )

      return right({
        totalAssetsEvaluated: activeAssets.length,
        totalGainers,
        totalLosers,
        userAlerts
      })
    } catch (error) {
      this.logger.error('Failed to evaluate asset variations', error)
      return left(error instanceof Error ? error : new Error(String(error)))
    }
  }
}
