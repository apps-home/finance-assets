import { apiClient } from '@/infrastructure/services/api-client'

import type {
  CategoryContribution,
  CreateTransactionDTO,
  ListTransactionsParams,
  TransactionListItem,
  UpdateTransactionDTO
} from './types'

const BASE_URL = '/transactions'

/**
 * Lista as operações do usuário, da mais recente para a mais antiga
 */
export async function listTransactions(
  params?: ListTransactionsParams
): Promise<TransactionListItem[]> {
  const response = await apiClient.get<TransactionListItem[]>(BASE_URL, {
    params
  })
  return response.data
}

/**
 * Registra uma operação. Na primeira operação de um ativo com posição, a
 * posição atual vira o saldo inicial (`openingCreated`)
 */
export async function createTransaction(
  data: CreateTransactionDTO
): Promise<{ openingCreated: boolean }> {
  const response = await apiClient.post<{ openingCreated: boolean }>(
    BASE_URL,
    data
  )
  return response.data
}

export async function updateTransaction(
  id: string,
  data: UpdateTransactionDTO
): Promise<void> {
  await apiClient.patch(`${BASE_URL}/${id}`, data)
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`)
}

/**
 * Aporte líquido (compras − vendas, em R$) de cada categoria no mês
 */
export async function getMonthlyContributions(
  year: number,
  month: number
): Promise<CategoryContribution[]> {
  const response = await apiClient.get<CategoryContribution[]>(
    `${BASE_URL}/contributions`,
    { params: { year, month } }
  )
  return response.data
}
