import { FinanceAssets } from '@lib/db'
import { Inject, Injectable } from '@nestjs/common'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { Asset } from '../../domain/asset.entity'
import {
  AssetRepository,
  AssetWithCategoryType
} from '../../domain/asset.repository'
import { FindAllAssetsParams } from '../../domain/dto/find-all-assets-params.dto'
import { PrismaAssetMapper } from './prisma.asset.mapper'

@Injectable()
export class PrismaAssetRepository implements AssetRepository {
  constructor(@Inject('prismaFinanceAssets') private prisma: FinanceAssets) {}

  async list(params: FindAllAssetsParams): Promise<Asset[]> {
    const { categoryId, name, broker, isActive } = params

    const assets = await this.prisma.asset.findMany({
      where: {
        categoryId,
        ...(name && { name: { contains: name } }),
        ...(broker && { broker: { contains: broker } }),
        ...(isActive !== undefined && { isActive })
      },
      orderBy: { name: 'asc' }
    })

    return assets.map(PrismaAssetMapper.toDomain)
  }

  async findById(id: string): Promise<Asset | null> {
    const asset = await this.prisma.asset.findUnique({
      where: { id }
    })

    if (!asset) return null

    return PrismaAssetMapper.toDomain(asset)
  }

  async save(asset: Asset): Promise<void> {
    const data = PrismaAssetMapper.toPrisma(asset)

    await this.prisma.asset.upsert({
      where: { id: asset.id },
      create: data,
      update: {
        name: asset.name,
        ticker: asset.ticker,
        quantity: asset.quantity,
        averagePrice: asset.averagePrice,
        broker: asset.broker,
        isActive: asset.isActive,
        currentClosePrice: asset.currentClosePrice,
        lastMonthClosePrice: asset.lastMonthClosePrice,
        updatedAt: asset.updatedAt
      }
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.asset.delete({
      where: { id }
    })
  }

  async findAllWithTicker(): Promise<AssetWithCategoryType[]> {
    const assets = await this.prisma.asset.findMany({
      where: { isActive: true },
      include: { category: true }
    })

    return assets.map((record) => ({
      asset: PrismaAssetMapper.toDomain(record),
      categoryType: record.category.type as CategoryType
    }))
  }
}
