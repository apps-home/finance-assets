import {
  type CategorySummary,
  CategoryType
} from '@/modules/assets/categories/domain/category.entity'

import { type Transaction, TransactionType } from './transaction.entity'

/**
 * Regras que dependem da categoria do ativo. Devolve a mensagem do erro ou
 * null quando a operação é válida.
 */
export function checkTransactionForCategory(
  transaction: Transaction,
  category: Pick<CategorySummary, 'type' | 'currency'>
): string | null {
  // Renda fixa precisa de lotes por aplicação (rendimento e IR próprios)
  if (category.type === CategoryType.FIXED) {
    return 'Fixed income operations are not supported yet'
  }

  const movesMoney =
    transaction.type === TransactionType.BUY ||
    transaction.type === TransactionType.SELL

  if (
    movesMoney &&
    category.currency !== 'BRL' &&
    transaction.exchangeRate === null
  ) {
    return `Exchange rate is required for ${category.currency} buys and sales`
  }

  return null
}
