import type { CategorySummary } from '@/features/categories/api/types'

export type TransactionType =
  | 'OPENING'
  | 'BUY'
  | 'SELL'
  | 'SPLIT'
  | 'REVERSE_SPLIT'
  | 'BONUS'

export type TransactionSource = 'MANUAL' | 'IMPORT'

export interface Transaction {
  id: string
  assetId: string
  type: TransactionType
  source: TransactionSource
  /** ISO, 00:00 UTC */
  date: string
  quantity: number | null
  /** Preço unitário na moeda da categoria (bonificação: custo atribuído) */
  price: number | null
  fees: number
  /** Desdobramento e grupamento */
  factor: number | null
  exchangeRate: number | null
  notes: string | null
  /** Quantidade × preço */
  grossAmount: number
  createdAt: string
  updatedAt: string
}

export interface TransactionListItem {
  transaction: Transaction
  asset: { id: string; name: string; ticker: string }
  category: CategorySummary
  /** Venda: lucro ou prejuízo pelo preço médio, na moeda da categoria */
  result: number | null
}

export interface CreateTransactionDTO {
  assetId: string
  type: TransactionType
  /** AAAA-MM-DD */
  date: string
  quantity?: number | null
  price?: number | null
  fees?: number
  factor?: number | null
  exchangeRate?: number | null
  notes?: string | null
}

export type UpdateTransactionDTO = Partial<
  Omit<CreateTransactionDTO, 'assetId'>
>

export interface ListTransactionsParams {
  assetId?: string
  categoryId?: string
  /** AAAA-MM-DD */
  from?: string
  to?: string
}

export interface CategoryContribution {
  categoryId: string
  /** Compras menos vendas do mês, em R$ */
  amount: number
}
