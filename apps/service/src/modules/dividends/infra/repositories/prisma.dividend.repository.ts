import type { FinanceAssets } from '@lib/db'
import { Inject, Injectable } from '@nestjs/common'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { Dividend, DividendType } from '../../domain/dividend.entity'
import {
  DividendRepository,
  DividendWithAsset
} from '../../domain/dividend.repository'
import { FindAllDividendsParams } from '../../domain/dto/find-all-dividends-params.dto'
import { PrismaDividendMapper } from './prisma.dividend.mapper'

@Injectable()
export class PrismaDividendRepository implements DividendRepository {
  constructor(@Inject('prismaFinanceAssets') private prisma: FinanceAssets) {}

  async list({
    userId,
    assetId,
    categoryId,
    categoryType,
    type,
    from,
    to
  }: FindAllDividendsParams): Promise<DividendWithAsset[]> {
    const records = await this.prisma.assetDividend.findMany({
      where: {
        userId,
        ...(assetId && { assetId }),
        ...(type && { type }),
        ...((categoryId || categoryType) && {
          asset: {
            ...(categoryId && { categoryId }),
            ...(categoryType && { category: { type: categoryType } })
          }
        }),
        ...((from || to) && {
          paymentDate: { ...(from && { gte: from }), ...(to && { lte: to }) }
        })
      },
      include: { asset: { include: { category: true } } },
      orderBy: { paymentDate: 'desc' }
    })

    return records.map((record) => ({
      dividend: PrismaDividendMapper.toDomain(record),
      asset: {
        id: record.asset.id,
        name: record.asset.name,
        ticker: record.asset.ticker,
        quantity:
          record.asset.quantity !== null ? Number(record.asset.quantity) : null,
        averagePrice:
          record.asset.averagePrice !== null
            ? Number(record.asset.averagePrice)
            : null
      },
      category: {
        id: record.asset.category.id,
        name: record.asset.category.name,
        type: record.asset.category.type as CategoryType,
        currency: record.asset.category.currency
      }
    }))
  }

  async findById(id: string, userId: string): Promise<Dividend | null> {
    const record = await this.prisma.assetDividend.findFirst({
      where: { id, userId }
    })

    return record ? PrismaDividendMapper.toDomain(record) : null
  }

  async findByNaturalKey(
    assetId: string,
    type: DividendType,
    paymentDate: Date
  ): Promise<Dividend | null> {
    const record = await this.prisma.assetDividend.findUnique({
      where: { assetId_type_paymentDate: { assetId, type, paymentDate } }
    })

    return record ? PrismaDividendMapper.toDomain(record) : null
  }

  async save(dividend: Dividend): Promise<void> {
    const data = PrismaDividendMapper.toPrisma(dividend)

    await this.prisma.assetDividend.upsert({
      where: { id: dividend.id },
      create: data,
      update: {
        type: data.type,
        source: data.source,
        amount: data.amount,
        taxAmount: data.taxAmount,
        rateAmount: data.rateAmount,
        quantity: data.quantity,
        exchangeRate: data.exchangeRate,
        comDate: data.comDate,
        paymentDate: data.paymentDate,
        updatedAt: data.updatedAt
      }
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetDividend.delete({ where: { id } })
  }
}
