import type { CategorySummary } from '@/modules/assets/categories/domain/category.entity'

import type { Transaction, TransactionProps } from './transaction.entity'
import type { TransactionAssetSummary } from './transaction.repository'

export type TransactionHTTP = TransactionProps & {
  /** Quantidade × preço, na moeda da categoria */
  grossAmount: number
}

export interface TransactionListItemHTTP {
  transaction: TransactionHTTP
  asset: TransactionAssetSummary
  category: CategorySummary
  /** Venda: lucro ou prejuízo pelo preço médio, na moeda da categoria */
  result: number | null
}

export class TransactionMapper {
  static toHTTP(transaction: Transaction): TransactionHTTP {
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
      grossAmount: transaction.grossAmount,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    }
  }
}
