import type { FinanceAssets } from '@lib/db'
import { Inject, Injectable } from '@nestjs/common'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { Asset } from '../../domain/asset.entity'
import {
  AssetRepository,
  AssetWithCategory,
  AssetWithCategoryType,
  AssetWithUserDetails
} from '../../domain/asset.repository'
import { FindAssetsParams } from '../../domain/dto/find-assets-params.dto'
import { PrismaAssetMapper } from './prisma.asset.mapper'

@Injectable()
export class PrismaAssetRepository implements AssetRepository {
  constructor(@Inject('prismaFinanceAssets') private prisma: FinanceAssets) {}

  async list(params: FindAssetsParams): Promise<AssetWithCategory[]> {
    const { userId, search, categoryId, type, status } = params

    const assets = await this.prisma.asset.findMany({
      where: {
        category: {
          userId,
          ...(categoryId && { id: categoryId }),
          ...(type && { type })
        },
        ...(status && { isActive: status === 'ACTIVE' }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { ticker: { contains: search, mode: 'insensitive' } },
            { broker: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      include: { category: true },
      orderBy: { name: 'asc' }
    })

    return assets.map((record) => ({
      asset: PrismaAssetMapper.toDomain(record),
      category: {
        id: record.category.id,
        name: record.category.name,
        type: record.category.type as CategoryType,
        currency: record.category.currency
      }
    }))
  }

  async findByIdAndUser(id: string, userId: string): Promise<Asset | null> {
    const asset = await this.prisma.asset.findFirst({
      where: { id, category: { userId } }
    })

    if (!asset) return null

    return PrismaAssetMapper.toDomain(asset)
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

  async findAllActiveWithUserDetails(): Promise<AssetWithUserDetails[]> {
    const assets = await this.prisma.asset.findMany({
      where: { isActive: true },
      include: {
        category: {
          include: {
            user: true
          }
        }
      }
    })

    return assets.map((record) => ({
      asset: PrismaAssetMapper.toDomain(record),
      category: {
        id: record.category.id,
        name: record.category.name,
        type: record.category.type as CategoryType,
        currency: record.category.currency
      },
      user: {
        id: record.category.user.id,
        name: record.category.user.name,
        email: record.category.user.email
      }
    }))
  }
}
