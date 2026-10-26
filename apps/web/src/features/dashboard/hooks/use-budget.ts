import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '@/shared/providers/query-client'

import { createBudget, listBudgets } from '../api'
import type { CreateBudgetDTO, ListBudgetsParams } from '../api/types'

export const BUDGET_QUERY_KEY = 'budgets'

export function useBudgets(params?: ListBudgetsParams) {
  return useQuery({
    queryKey: [BUDGET_QUERY_KEY, params],
    queryFn: () => listBudgets(params),
    placeholderData: (prev) => prev
  })
}

export function useSaveBudget() {
  return useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BUDGET_QUERY_KEY] })
      toast.success('Valor atualizado!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao salvar valor.'
      toast.error(message)
    }
  })
}

/** Salva o fechamento do mês: um registro por categoria, em uma ação só */
export function useSaveMonthClosing() {
  return useMutation({
    mutationFn: (dtos: CreateBudgetDTO[]) =>
      Promise.all(dtos.map((dto) => createBudget(dto))),
    onSuccess: (_, dtos) => {
      queryClient.invalidateQueries({ queryKey: [BUDGET_QUERY_KEY] })
      toast.success(
        dtos.length === 1
          ? 'Fechamento salvo: 1 categoria atualizada.'
          : `Fechamento salvo: ${dtos.length} categorias atualizadas.`
      )
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao salvar o fechamento do mês.'
      toast.error(message)
    }
  })
}
