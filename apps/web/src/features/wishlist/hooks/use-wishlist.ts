import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { PriceHistoryRange } from '@/features/assets/api/types'
import { queryClient } from '@/shared/providers/query-client'

import {
  createWishlist,
  deleteWishlist,
  getWishlistPriceHistory,
  listWishlist,
  updateWishlist
} from '../api'
import type {
  CreateWishlistDTO,
  UpdateWishlistDTO,
  WishlistSearchParams
} from '../api/types'

export const WISHLIST_QUERY_KEY = 'wishlist-items'

export function useWishlist(params?: WishlistSearchParams) {
  return useQuery({
    queryKey: [WISHLIST_QUERY_KEY, params],
    queryFn: () => listWishlist(params),
    placeholderData: (prev) => prev
  })
}

// Fonte externa com cache no servidor: não refaz a consulta a cada abertura
export function useWishlistPriceHistory(id: string, range: PriceHistoryRange) {
  return useQuery({
    queryKey: [WISHLIST_QUERY_KEY, 'history', id, range],
    queryFn: () => getWishlistPriceHistory(id, range),
    staleTime: 15 * 60 * 1000,
    retry: false,
    placeholderData: (prev) => prev
  })
}

export function useCreateWishlistItem() {
  return useMutation({
    mutationFn: (dto: CreateWishlistDTO) => createWishlist(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WISHLIST_QUERY_KEY] })
      toast.success('Ativo adicionado à Wishlist com sucesso!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao adicionar à Wishlist.'
      toast.error(message)
    }
  })
}

export function useUpdateWishlistItem() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateWishlistDTO }) =>
      updateWishlist(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WISHLIST_QUERY_KEY] })
      toast.success('Item da Wishlist atualizado com sucesso!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao atualizar item da Wishlist.'
      toast.error(message)
    }
  })
}

export function useDeleteWishlistItem() {
  return useMutation({
    mutationFn: (id: string) => deleteWishlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WISHLIST_QUERY_KEY] })
      toast.success('Item removido da Wishlist com sucesso!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao remover item da Wishlist.'
      toast.error(message)
    }
  })
}
