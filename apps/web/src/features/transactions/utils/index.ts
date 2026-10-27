import type { TransactionType } from '../api/types'

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  OPENING: 'Saldo inicial',
  BUY: 'Compra',
  SELL: 'Venda',
  SPLIT: 'Desdobramento',
  REVERSE_SPLIT: 'Grupamento',
  BONUS: 'Bonificação'
}

/** Ordem do select (o saldo inicial é criado automaticamente, mas pode ser editado) */
export const TRANSACTION_TYPE_OPTIONS: TransactionType[] = [
  'BUY',
  'SELL',
  'SPLIT',
  'REVERSE_SPLIT',
  'BONUS',
  'OPENING'
]

export const FACTOR_TYPES: TransactionType[] = ['SPLIT', 'REVERSE_SPLIT']

/** Compra e venda movem dinheiro: têm taxas e, fora do real, câmbio */
export const CASH_TYPES: TransactionType[] = ['BUY', 'SELL']
