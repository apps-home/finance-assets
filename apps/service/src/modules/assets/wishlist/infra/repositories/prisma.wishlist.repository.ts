import type { FinanceAssets } from '@lib/db'
import { Inject, Injectable } from '@nestjs/common'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { FindAllWishlistParams } from '../../domain/dto/find-all-wishlist-params.dto'
import { Wishlist } from '../../domain/wishlist.entity'
import {
  WishlistRepository,
  WishlistWithCategory,
  WishlistWithCategoryType,
  WishlistWithUserDetails
} from '../../domain/wishlist.repository'
import { PrismaWishlistMapper } from './prisma.wishlist.mapper'

@Injectable()
export class PrismaWishlistRepository implements WishlistRepository {
  constructor(@Inject('prismaFinanceAssets') private prisma: FinanceAssets) {}

  async list(params: FindAllWishlistParams): Promise<WishlistWithCategory[]> {
    const { userId, categoryId, ticker, name } = params

    const records = await this.prisma.assetWishlists.findMany({
      where: {
        userId,
        ...(categoryId && { categoryId }),
        ...(ticker && { ticker: { contains: ticker, mode: 'insensitive' } }),
        ...(name && { name: { contains: name, mode: 'insensitive' } })
      },
      include: {
        category: true
      },
      orderBy: { name: 'asc' }
    })

    return records.map((record) => ({
      wishlist: PrismaWishlistMapper.toDomain(record),
      category: {
        id: record.category.id,
        name: record.category.name,
        type: record.category.type as CategoryType,
        currency: record.category.currency
      }
    }))
  }

  async findById(id: string): Promise<Wishlist | null> {
    const record = await this.prisma.assetWishlists.findUnique({
      where: { id }
    })

    if (!record) return null

    return PrismaWishlistMapper.toDomain(record)
  }

  async findByUserAndTicker(
    userId: string,
    ticker: string
  ): Promise<Wishlist | null> {
    const record = await this.prisma.assetWishlists.findUnique({
      where: {
        userId_ticker: {
          userId,
          ticker
        }
      }
    })

    if (!record) return null

    return PrismaWishlistMapper.toDomain(record)
  }

  async save(wishlist: Wishlist): Promise<void> {
    const data = PrismaWishlistMapper.toPrisma(wishlist)

    await this.prisma.assetWishlists.upsert({
      where: { id: wishlist.id },
      create: data,
      update: {
        name: wishlist.name,
        ticker: wishlist.ticker,
        targetPrice: wishlist.targetPrice,
        currentClosePrice: wishlist.currentClosePrice,
        lastMonthClosePrice: wishlist.lastMonthClosePrice,
        notes: wishlist.notes,
        updatedAt: wishlist.updatedAt
      }
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetWishlists.delete({
      where: { id }
    })
  }

  async findAllWithTicker(): Promise<WishlistWithCategoryType[]> {
    const records = await this.prisma.assetWishlists.findMany({
      include: { category: true }
    })

    return records.map((record) => ({
      wishlist: PrismaWishlistMapper.toDomain(record),
      categoryType: record.category.type as CategoryType
    }))
  }

  async findAllWithUserDetails(): Promise<WishlistWithUserDetails[]> {
    const records = await this.prisma.assetWishlists.findMany({
      include: {
        category: true,
        user: true
      }
    })

    return records.map((record) => ({
      wishlist: PrismaWishlistMapper.toDomain(record),
      category: {
        id: record.category.id,
        name: record.category.name,
        type: record.category.type as CategoryType,
        currency: record.category.currency
      },
      user: {
        id: record.user.id,
        name: record.user.name,
        email: record.user.email
      }
    }))
  }
}
