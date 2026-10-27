import { CategorySummary } from '@/modules/assets/categories/domain/category.entity'

import { Transaction } from './transaction.entity'

export interface TransactionAssetSummary {
  id: string
  name: string
  ticker: string
}

export interface TransactionWithAsset {
  transaction: Transaction
  asset: TransactionAssetSummary
  category: CategorySummary
}

export interface ListTransactionsParams {
  userId: string
  assetId?: string
  categoryId?: string
  /** Data do negócio, inclusive */
  from?: Date
  to?: Date
}

export abstract class TransactionRepository {
  abstract list(params: ListTransactionsParams): Promise<TransactionWithAsset[]>
  /** Todas as operações do ativo, em qualquer ordem */
  abstract listByAsset(assetId: string, userId: string): Promise<Transaction[]>
  abstract findById(id: string, userId: string): Promise<Transaction | null>
  abstract saveMany(transactions: Transaction[]): Promise<void>
  abstract delete(id: string): Promise<void>
}
