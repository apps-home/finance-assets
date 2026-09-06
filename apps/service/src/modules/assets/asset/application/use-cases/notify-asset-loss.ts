import { Injectable, Logger } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { AssetRepository } from '../../domain/asset.repository'

export interface DroppedAssetItem {
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

export interface UserLossNotificationPayload {
  event: 'ASSET_PRICE_DROP_ALERT'
  sentAt: string
  thresholdPercent: number
  user: {
    id: string
    name: string
    email: string
  }
  summary: {
    totalDroppedAssets: number
    worstDropPercent: number
    date: string
  }
  assets: DroppedAssetItem[]
}

export interface FindAssetsLossResult {
  totalAssetsEvaluated: number
  totalDroppedAssets: number
  userAlerts: UserLossNotificationPayload[]
}

type FindAssetsLossResponse = Either<Error, FindAssetsLossResult>

const LOSS_THRESHOLD_PERCENT = -5

@Injectable()
export class NotifyAssetLossUseCase {
  private readonly logger = new Logger(NotifyAssetLossUseCase.name)

  constructor(private readonly assetRepository: AssetRepository) {}

  async execute(): Promise<FindAssetsLossResponse> {
    try {
      this.logger.log(
        'Evaluating asset losses (comparing currentClosePrice with lastMonthClosePrice)...'
      )

      const activeAssets =
        await this.assetRepository.findAllActiveWithUserDetails()

      const userAssetsMap = new Map<
        string,
        {
          user: { id: string; name: string; email: string }
          assets: DroppedAssetItem[]
        }
      >()

      let totalDroppedAssets = 0

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

        if (variationPercent <= LOSS_THRESHOLD_PERCENT) {
          totalDroppedAssets++
          const priceDiff = Number((currentPrice - previousPrice).toFixed(2))
          const quantity = asset.quantity
          const totalCurrentValue =
            quantity !== null
              ? Number((quantity * currentPrice).toFixed(2))
              : null

          const droppedItem: DroppedAssetItem = {
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

          const existing = userAssetsMap.get(user.id)
          if (existing) {
            existing.assets.push(droppedItem)
          } else {
            userAssetsMap.set(user.id, {
              user: {
                id: user.id,
                name: user.name,
                email: user.email
              },
              assets: [droppedItem]
            })
          }
        }
      }

      const now = new Date()
      const dateStr = now.toISOString().split('T')[0]
      const userAlerts: UserLossNotificationPayload[] = []

      for (const [, userData] of userAssetsMap) {
        userData.assets.sort((a, b) => a.variationPercent - b.variationPercent)

        const worstDropPercent = userData.assets[0]?.variationPercent ?? 0

        userAlerts.push({
          event: 'ASSET_PRICE_DROP_ALERT',
          sentAt: now.toISOString(),
          thresholdPercent: Math.abs(LOSS_THRESHOLD_PERCENT),
          user: userData.user,
          summary: {
            totalDroppedAssets: userData.assets.length,
            worstDropPercent,
            date: dateStr
          },
          assets: userData.assets
        })
      }

      this.logger.log(
        `Evaluation finished: ${activeAssets.length} assets evaluated, ${totalDroppedAssets} dropped > 5% across ${userAlerts.length} user(s).`
      )

      return right({
        totalAssetsEvaluated: activeAssets.length,
        totalDroppedAssets,
        userAlerts
      })
    } catch (error) {
      this.logger.error('Failed to evaluate asset losses', error)
      return left(error instanceof Error ? error : new Error(String(error)))
    }
  }
}
