import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { listCategories } from '@/features/categories/api'
import { queryClient } from '@/shared/providers/query-client'

import {
  createWishlist,
  deleteWishlist,
  listWishlist,
  updateWishlist
} from '../api/wishlist.api'
import type {
  CreateWishlistDTO,
  UpdateWishlistDTO,
  WishlistSearchParams
} from '../types/wishlist.types'

export function useWishlist(params?: WishlistSearchParams) {
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['all-categories'],
    queryFn: () => listCategories()
  })

  const {
    data: wishlistItems = [],
    isLoading: isLoadingWishlist,
    refetch
  } = useQuery({
    queryKey: [
      'wishlist-items',
      params?.categoryId,
      params?.ticker,
      params?.name
    ],
    queryFn: () => listWishlist(params)
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateWishlistDTO) => createWishlist(data),
    onSuccess: () => {
      toast.success('Ativo adicionado à Wishlist com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['wishlist-items'] })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Erro ao adicionar à Wishlist.'
      toast.error(message)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWishlistDTO }) =>
      updateWishlist(id, data),
    onSuccess: () => {
      toast.success('Item da Wishlist atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['wishlist-items'] })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Erro ao atualizar item da Wishlist.'
      toast.error(message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWishlist(id),
    onSuccess: () => {
      toast.success('Item removido da Wishlist com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['wishlist-items'] })
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Erro ao remover item da Wishlist.'
      toast.error(message)
    }
  })

  return {
    categories,
    wishlistItems,
    isLoading: isLoadingCategories || isLoadingWishlist,
    refetch,
    createWishlist: createMutation.mutateAsync,
    updateWishlist: updateMutation.mutateAsync,
    deleteWishlist: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  }
}
