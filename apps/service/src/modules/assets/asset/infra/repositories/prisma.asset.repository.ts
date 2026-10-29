import type { FinanceAssets } from '@lib/finance-assets-db'
import { Inject, Injectable } from '@nestjs/common'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { Asset } from '../../domain/asset.entity'
import {
  AssetRepository,
  AssetWithCategory,
  AssetWithUserDetails
} from '../../domain/asset.repository'
import { FindAssetsParams } from '../../domain/dto/find-assets-params.dto'
import { PrismaAssetMapper, WITH_MARKET_ASSET } from './prisma.asset.mapper'

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
      include: { category: true, ...WITH_MARKET_ASSET },
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

  async findById(id: string, userId: string): Promise<Asset | null> {
    const asset = await this.prisma.asset.findFirst({
      where: { id, category: { userId } },
      include: WITH_MARKET_ASSET
    })

    if (!asset) return null

    return PrismaAssetMapper.toDomain(asset)
  }

  async findByIdForSystem(id: string): Promise<Asset | null> {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: WITH_MARKET_ASSET
    })

    if (!asset) return null

    return PrismaAssetMapper.toDomain(asset)
  }

  async save(asset: Asset): Promise<void> {
    const {
      id: _id,
      categoryId: _categoryId,
      createdAt: _createdAt,
      ...update
    } = PrismaAssetMapper.toPrisma(asset)

    await this.prisma.asset.upsert({
      where: { id: asset.id },
      create: PrismaAssetMapper.toPrisma(asset),
      update
    })
  }

  async findAllIndexedFixedIncome(): Promise<Asset[]> {
    const assets = await this.prisma.asset.findMany({
      where: { isActive: true, indexer: { not: null } },
      include: WITH_MARKET_ASSET
    })

    return assets.map(PrismaAssetMapper.toDomain)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.asset.delete({
      where: { id }
    })
  }

  async markDividendsImported(assetIds: string[], at: Date): Promise<void> {
    if (assetIds.length === 0) return

    await this.prisma.asset.updateMany({
      where: { id: { in: assetIds } },
      data: { dividendsImportedAt: at }
    })
  }

  async findAllActiveWithUserDetails(): Promise<AssetWithUserDetails[]> {
    const assets = await this.prisma.asset.findMany({
      where: { isActive: true },
      include: {
        ...WITH_MARKET_ASSET,
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
