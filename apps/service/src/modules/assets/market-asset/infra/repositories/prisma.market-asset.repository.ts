import type { FinanceAssets } from '@lib/finance-assets-db'
import { Inject, Injectable } from '@nestjs/common'

import { MarketAsset } from '../../domain/market-asset.entity'
import { MarketAssetRepository } from '../../domain/market-asset.repository'
import { PrismaMarketAssetMapper } from './prisma.market-asset.mapper'

@Injectable()
export class PrismaMarketAssetRepository implements MarketAssetRepository {
  constructor(@Inject('prismaFinanceAssets') private prisma: FinanceAssets) {}

  async findById(id: string): Promise<MarketAsset | null> {
    const record = await this.prisma.marketAsset.findUnique({ where: { id } })

    if (!record) return null

    return PrismaMarketAssetMapper.toDomain(record)
  }

  async findOrCreate(marketAsset: MarketAsset): Promise<MarketAsset> {
    const record = await this.prisma.marketAsset.upsert({
      where: {
        ticker_type: { ticker: marketAsset.ticker, type: marketAsset.type }
      },
      create: PrismaMarketAssetMapper.toPrisma(marketAsset),
      update: {}
    })

    return PrismaMarketAssetMapper.toDomain(record)
  }

  async save(marketAsset: MarketAsset): Promise<void> {
    const data = PrismaMarketAssetMapper.toPrisma(marketAsset)

    await this.prisma.marketAsset.upsert({
      where: { id: marketAsset.id },
      create: data,
      update: {
        name: marketAsset.name,
        currentClosePrice: marketAsset.currentClosePrice,
        lastMonthClosePrice: marketAsset.lastMonthClosePrice,
        priceUpdatedAt: marketAsset.priceUpdatedAt,
        updatedAt: marketAsset.updatedAt
      }
    })
  }

  async findAllInUse(): Promise<MarketAsset[]> {
    const records = await this.prisma.marketAsset.findMany({
      where: {
        OR: [
          { assets: { some: { isActive: true } } },
          { wishlists: { some: {} } },
          // Ticker com alerta segue atualizado mesmo com o ativo inativo
          { priceAlerts: { some: {} } }
        ]
      },
      orderBy: { ticker: 'asc' }
    })

    return records.map(PrismaMarketAssetMapper.toDomain)
  }
}
