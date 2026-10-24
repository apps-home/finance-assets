import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createAsset,
  deleteAsset,
  getPortfolioSummary,
  listAssets,
  updateAsset
} from '@/features/assets/api'
import type {
  CreateAssetDTO,
  ListAssetsParams,
  UpdateAssetDTO
} from '@/features/assets/api/types'
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
