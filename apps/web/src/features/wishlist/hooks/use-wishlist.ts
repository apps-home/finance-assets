import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '@/shared/providers/query-client'

import {
  createWishlist,
  deleteWishlist,
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
