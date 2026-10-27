import type { CategoryType } from '@/modules/assets/categories/domain/category.entity'
import type { Transaction } from '@/modules/transactions/domain/transaction.entity'
import type {
  ListTransactionsParams,
  TransactionRepository,
  TransactionWithAsset
} from '@/modules/transactions/domain/transaction.repository'

import type { InMemoryAssetRepository } from './in-memory-asset.repository'
import type { InMemoryCategoryRepository } from './in-memory-category.repository'

export class InMemoryTransactionRepository implements TransactionRepository {
  public items: Transaction[] = []

  constructor(
    private assetRepository: InMemoryAssetRepository,
    private categoryRepository: InMemoryCategoryRepository
  ) {}

  async list(params: ListTransactionsParams): Promise<TransactionWithAsset[]> {
    return this.items
      .filter(
        (item) =>
          item.userId === params.userId &&
          (!params.assetId || item.assetId === params.assetId) &&
          (!params.from || item.date >= params.from) &&
          (!params.to || item.date <= params.to)
      )
      .flatMap((transaction) => {
        const asset = this.assetRepository.items.find(
          (item) => item.id === transaction.assetId
        )
        const category = this.categoryRepository.items.find(
          (item) => item.id === asset?.categoryId
        )

        if (!asset || !category) return []
        if (params.categoryId && category.id !== params.categoryId) return []

        return [
          {
            transaction,
            asset: { id: asset.id, name: asset.name, ticker: asset.ticker },
            category: {
              id: category.id,
              name: category.name,
              type: category.type as CategoryType,
              currency: category.currency
            }
          }
        ]
      })
  }

  async listByAsset(assetId: string, userId: string): Promise<Transaction[]> {
    return this.items.filter(
      (item) => item.assetId === assetId && item.userId === userId
    )
  }

  async findById(id: string, userId: string): Promise<Transaction | null> {
    return (
      this.items.find((item) => item.id === id && item.userId === userId) ??
      null
    )
  }

  async saveMany(transactions: Transaction[]): Promise<void> {
    for (const transaction of transactions) {
      const index = this.items.findIndex((item) => item.id === transaction.id)

      if (index >= 0) {
        this.items[index] = transaction
      } else {
        this.items.push(transaction)
      }
    }
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id)
  }
}
