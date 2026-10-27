import type { TransactionType } from '../transaction.entity'

export interface CreateTransactionPayload {
  assetId: string
  type: TransactionType
  date: Date
  quantity?: number | null
  price?: number | null
  fees?: number
  factor?: number | null
  exchangeRate?: number | null
  notes?: string | null
}

/** O ativo não muda: para outro ativo, exclua e crie de novo */
export type UpdateTransactionPayload = Partial<
  Omit<CreateTransactionPayload, 'assetId'>
>
