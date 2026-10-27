import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ASSET_QUERY_KEY } from '@/features/assets/hooks/use-assets'
import { queryClient } from '@/shared/providers/query-client'

import {
  createTransaction,
  deleteTransaction,
  getMonthlyContributions,
  listTransactions,
  updateTransaction
} from '../api'
import type {
  CreateTransactionDTO,
  ListTransactionsParams,
  UpdateTransactionDTO
} from '../api/types'

export const TRANSACTION_QUERY_KEY = 'transactions'

// Operação muda quantidade e preço médio do ativo
function invalidate() {
  queryClient.invalidateQueries({ queryKey: [TRANSACTION_QUERY_KEY] })
  queryClient.invalidateQueries({ queryKey: [ASSET_QUERY_KEY] })
}

function errorMessage(error: any, fallback: string) {
  return error.response?.data?.message || error.message || fallback
}

// 1. Queries
export function useTransactions(params?: ListTransactionsParams) {
  return useQuery({
    queryKey: [TRANSACTION_QUERY_KEY, params],
    queryFn: () => listTransactions(params),
    placeholderData: (prev) => prev
  })
}

export function useMonthlyContributions(year: number, month: number) {
  return useQuery({
    queryKey: [TRANSACTION_QUERY_KEY, 'contributions', year, month],
    queryFn: () => getMonthlyContributions(year, month)
  })
}

// 2. Mutations granulares (com toast e invalidação automática de cache)
export function useCreateTransaction() {
  return useMutation({
    mutationFn: (dto: CreateTransactionDTO) => createTransaction(dto),
    onSuccess: ({ openingCreated }) => {
      invalidate()
      toast.success(
        openingCreated
          ? 'Operação registrada! A posição que o ativo já tinha virou o saldo inicial.'
          : 'Operação registrada com sucesso!'
      )
    },
    onError: (error: any) => {
      toast.error(errorMessage(error, 'Erro ao registrar operação.'))
    }
  })
}

export function useUpdateTransaction() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTransactionDTO }) =>
      updateTransaction(id, dto),
    onSuccess: () => {
      invalidate()
      toast.success('Operação atualizada com sucesso!')
    },
    onError: (error: any) => {
      toast.error(errorMessage(error, 'Erro ao atualizar operação.'))
    }
  })
}

export function useDeleteTransaction() {
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      invalidate()
      toast.success('Operação excluída com sucesso!')
    },
    onError: (error: any) => {
      toast.error(errorMessage(error, 'Erro ao excluir operação.'))
    }
  })
}
