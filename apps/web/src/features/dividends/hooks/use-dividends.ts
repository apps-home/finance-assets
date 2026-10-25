import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '@/shared/providers/query-client'

import {
  backfillDividends,
  createDividend,
  deleteDividend,
  getDividendsSummary,
  listDividends,
  listUpcomingDividends,
  updateDividend
} from '../api'
import type {
  CreateDividendDTO,
  ListDividendsParams,
  UpdateDividendDTO
} from '../api/types'

export const DIVIDEND_QUERY_KEY = 'dividends'

// 1. Queries
export function useDividends(params?: ListDividendsParams) {
  return useQuery({
    queryKey: [DIVIDEND_QUERY_KEY, 'list', params],
    queryFn: () => listDividends(params),
    placeholderData: (prev) => prev
  })
}

export function useDividendsSummary(year?: number) {
  return useQuery({
    queryKey: [DIVIDEND_QUERY_KEY, 'summary', year],
    queryFn: () => getDividendsSummary(year),
    placeholderData: (prev) => prev
  })
}

export function useUpcomingDividends() {
  return useQuery({
    queryKey: [DIVIDEND_QUERY_KEY, 'upcoming'],
    queryFn: () => listUpcomingDividends(),
    placeholderData: (prev) => prev
  })
}

// 2. Mutations granulares (com toast e invalidação automática de cache)
export function useCreateDividend() {
  return useMutation({
    mutationFn: (dto: CreateDividendDTO) => createDividend(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DIVIDEND_QUERY_KEY] })
      toast.success('Provento registrado com sucesso!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao registrar provento'
      toast.error(message)
    }
  })
}

export function useBackfillDividends() {
  return useMutation({
    mutationFn: (months?: number) => backfillDividends(months),
    onSuccess: ({ enqueued }) => {
      queryClient.invalidateQueries({ queryKey: [DIVIDEND_QUERY_KEY] })

      if (enqueued === 0) {
        toast.info(
          'Nenhum ativo elegível: é preciso ter ticker e categoria de Ações BR, FIIs ou Ações US.'
        )
        return
      }

      toast.success(
        'Importação iniciada! Os proventos aparecem aos poucos (ativos US podem levar alguns minutos). Recarregue a página para atualizar.'
      )
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao importar proventos'
      toast.error(message)
    }
  })
}

export function useUpdateDividend() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDividendDTO }) =>
      updateDividend(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DIVIDEND_QUERY_KEY] })
      toast.success('Provento atualizado com sucesso!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao atualizar provento'
      toast.error(message)
    }
  })
}

export function useDeleteDividend() {
  return useMutation({
    mutationFn: (id: string) => deleteDividend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DIVIDEND_QUERY_KEY] })
      toast.success('Provento excluído com sucesso!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao excluir provento'
      toast.error(message)
    }
  })
}
