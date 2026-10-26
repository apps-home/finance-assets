import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createAsset,
  deleteAsset,
  getAssetPriceHistory,
  getPortfolioSummary,
  listAssets,
  refreshCategoryQuotes,
  updateAsset
} from '@/features/assets/api'
import type {
  CreateAssetDTO,
  ListAssetsParams,
  PriceHistoryRange,
  UpdateAssetDTO
} from '@/features/assets/api/types'
import { WISHLIST_QUERY_KEY } from '@/features/wishlist/hooks/use-wishlist'
import { queryClient } from '@/shared/providers/query-client'

export const ASSET_QUERY_KEY = 'assets'

// 1. Queries
export function useAssets(params?: ListAssetsParams) {
  return useQuery({
    queryKey: [ASSET_QUERY_KEY, params],
    queryFn: () => listAssets(params),
    placeholderData: (prev) => prev
  })
}

export function usePortfolioSummary() {
  return useQuery({
    queryKey: [ASSET_QUERY_KEY, 'portfolio'],
    queryFn: getPortfolioSummary,
    placeholderData: (prev) => prev
  })
}

// Fonte externa com cache no servidor: não refaz a consulta a cada abertura
export function useAssetPriceHistory(id: string, range: PriceHistoryRange) {
  return useQuery({
    queryKey: [ASSET_QUERY_KEY, 'history', id, range],
    queryFn: () => getAssetPriceHistory(id, range),
    staleTime: 15 * 60 * 1000,
    retry: false,
    placeholderData: (prev) => prev
  })
}

// 2. Mutations granulares (com toast e invalidação automática de cache)
export function useCreateAsset() {
  return useMutation({
    mutationFn: (dto: CreateAssetDTO) => createAsset(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSET_QUERY_KEY] })
      toast.success('Ativo criado com sucesso!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || error.message || 'Erro ao criar ativo.'
      toast.error(message)
    }
  })
}

export function useUpdateAsset() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAssetDTO }) =>
      updateAsset(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSET_QUERY_KEY] })
      toast.success('Ativo atualizado com sucesso!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao atualizar ativo.'
      toast.error(message)
    }
  })
}

export function useDeleteAsset() {
  return useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ASSET_QUERY_KEY] })
      toast.success('Ativo removido com sucesso!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao remover ativo.'
      toast.error(message)
    }
  })
}

export function useRefreshCategoryQuotes() {
  return useMutation({
    mutationFn: (categoryId: string) => refreshCategoryQuotes(categoryId),
    onSuccess: ({ updated, skipped, failedTickers }) => {
      // A cotação é do catálogo compartilhado: a wishlist também muda
      queryClient.invalidateQueries({ queryKey: [ASSET_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [WISHLIST_QUERY_KEY] })

      if (failedTickers.length > 0) {
        toast.warning(
          `${updated} cotação(ões) atualizada(s). Sem resposta do provider para: ${failedTickers.join(', ')}.`
        )
        return
      }

      if (updated === 0 && skipped === 0) {
        toast.info('Nenhum ativo com cotação de mercado nesta categoria.')
        return
      }

      if (updated === 0) {
        toast.info('As cotações já foram atualizadas há menos de 5 minutos.')
        return
      }

      toast.success(`${updated} cotação(ões) atualizada(s)!`)
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao atualizar cotações.'
      toast.error(message)
    }
  })
}
