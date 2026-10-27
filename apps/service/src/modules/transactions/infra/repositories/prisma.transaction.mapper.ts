import type { AssetTransaction as PrismaTransaction } from '@lib/db'

import {
  Transaction,
  TransactionSource,
  TransactionType
} from '../../domain/transaction.entity'

const toNumber = (value: { toString(): string } | null) =>
  value === null ? null : Number(value)

export class PrismaTransactionMapper {
  static toDomain(raw: PrismaTransaction): Transaction {
    return new Transaction({
      id: raw.id,
      assetId: raw.assetId,
      userId: raw.userId,
      type: raw.type as TransactionType,
      source: raw.source as TransactionSource,
      date: raw.date,
      quantity: toNumber(raw.quantity),
      price: toNumber(raw.price),
      fees: Number(raw.fees),
      factor: toNumber(raw.factor),
      exchangeRate: toNumber(raw.exchangeRate),
      notes: raw.notes,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }

  static toPrisma(transaction: Transaction) {
    return {
      id: transaction.id,
      assetId: transaction.assetId,
      userId: transaction.userId,
      type: transaction.type,
      source: transaction.source,
      date: transaction.date,
      quantity: transaction.quantity,
      price: transaction.price,
      fees: transaction.fees,
      factor: transaction.factor,
      exchangeRate: transaction.exchangeRate,
      notes: transaction.notes,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    }
  }
}
