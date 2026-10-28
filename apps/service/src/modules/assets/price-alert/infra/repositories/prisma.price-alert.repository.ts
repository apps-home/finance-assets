import type { FinanceAssets } from '@lib/db'
import { Inject, Injectable } from '@nestjs/common'

import { PriceAlert, PriceAlertStatus } from '../../domain/price-alert.entity'
import {
  type ListPriceAlertsParams,
  PriceAlertRepository,
  type PriceAlertWithDetails
} from '../../domain/price-alert.repository'
import {
  PrismaPriceAlertMapper,
  WITH_DETAILS
} from './prisma.price-alert.mapper'

@Injectable()
export class PrismaPriceAlertRepository implements PriceAlertRepository {
  constructor(@Inject('prismaFinanceAssets') private prisma: FinanceAssets) {}

  async create(alert: PriceAlert): Promise<void> {
    await this.prisma.priceAlert.create({
      data: PrismaPriceAlertMapper.toPrisma(alert)
    })
  }

  async findById(id: string, userId: string): Promise<PriceAlert | null> {
    const record = await this.prisma.priceAlert.findFirst({
      where: { id, userId }
    })

    return record ? PrismaPriceAlertMapper.toDomain(record) : null
  }

  async list({
    userId,
    assetId,
    wishlistId
  }: ListPriceAlertsParams): Promise<PriceAlertWithDetails[]> {
    const records = await this.prisma.priceAlert.findMany({
      where: {
        userId,
        ...(assetId && { assetId }),
        ...(wishlistId && { wishlistId })
      },
      include: WITH_DETAILS,
      // Como uma escada de preços: o alvo mais alto primeiro
      orderBy: [{ targetPrice: 'desc' }, { createdAt: 'asc' }]
    })

    return records.map(PrismaPriceAlertMapper.toDetails)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.priceAlert.delete({ where: { id } })
  }

  async findByMarketAsset(
    marketAssetId: string
  ): Promise<PriceAlertWithDetails[]> {
    const records = await this.prisma.priceAlert.findMany({
      where: { marketAssetId },
      include: WITH_DETAILS
    })

    return records.map(PrismaPriceAlertMapper.toDetails)
  }

  async transition(
    alert: PriceAlert,
    from: PriceAlertStatus
  ): Promise<boolean> {
    const { count } = await this.prisma.priceAlert.updateMany({
      where: { id: alert.id, status: from },
      data: {
        status: alert.status,
        lastTriggeredAt: alert.lastTriggeredAt,
        lastTriggeredPrice: alert.lastTriggeredPrice,
        triggerCount: alert.triggerCount,
        updatedAt: alert.updatedAt
      }
    })

    return count === 1
  }
}
