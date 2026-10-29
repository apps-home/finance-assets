import type { FinanceAssets } from '@lib/finance-assets-db'
import { Inject, Injectable } from '@nestjs/common'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { Transaction } from '../../domain/transaction.entity'
import {
  type ListTransactionsParams,
  TransactionRepository,
  type TransactionWithAsset
} from '../../domain/transaction.repository'
import { PrismaTransactionMapper } from './prisma.transaction.mapper'

@Injectable()
export class PrismaTransactionRepository implements TransactionRepository {
  constructor(@Inject('prismaFinanceAssets') private prisma: FinanceAssets) {}

  async list({
    userId,
    assetId,
    categoryId,
    from,
    to
  }: ListTransactionsParams): Promise<TransactionWithAsset[]> {
    const records = await this.prisma.assetTransaction.findMany({
      where: {
        userId,
        ...(assetId && { assetId }),
        ...(categoryId && { asset: { categoryId } }),
        ...((from || to) && {
          date: { ...(from && { gte: from }), ...(to && { lte: to }) }
        })
      },
      include: { asset: { include: { category: true } } },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }]
    })

    return records.map((record) => ({
      transaction: PrismaTransactionMapper.toDomain(record),
      asset: {
        id: record.asset.id,
        name: record.asset.name,
        ticker: record.asset.ticker
      },
      category: {
        id: record.asset.category.id,
        name: record.asset.category.name,
        type: record.asset.category.type as CategoryType,
        currency: record.asset.category.currency
      }
    }))
  }

  async listByAsset(assetId: string, userId: string): Promise<Transaction[]> {
    const records = await this.prisma.assetTransaction.findMany({
      where: { assetId, userId }
    })

    return records.map(PrismaTransactionMapper.toDomain)
  }

  async findById(id: string, userId: string): Promise<Transaction | null> {
    const record = await this.prisma.assetTransaction.findFirst({
      where: { id, userId }
    })

    return record ? PrismaTransactionMapper.toDomain(record) : null
  }

  async saveMany(transactions: Transaction[]): Promise<void> {
    await this.prisma.$transaction(
      transactions.map((transaction) => {
        const data = PrismaTransactionMapper.toPrisma(transaction)
        const {
          id: _id,
          assetId: _assetId,
          userId: _userId,
          createdAt: _createdAt,
          ...update
        } = data

        return this.prisma.assetTransaction.upsert({
          where: { id: transaction.id },
          create: data,
          update
        })
      })
    )
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetTransaction.delete({ where: { id } })
  }
}
