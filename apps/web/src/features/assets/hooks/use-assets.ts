import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  createAsset,
  deleteAsset,
  listAssetsByCategory,
  updateAsset
} from '@/features/assets/api'
import type {
  CreateAssetDTO,
  UpdateAssetDTO
} from '@/features/assets/api/types'
import { listCategories } from '@/features/categories/api'

import type { AssetWithCategory } from '../types'

export function useAssets(selectedCategoryId?: string) {
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['all-categories'],
    queryFn: () => listCategories()
  })

  const { data: allAssets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: [
      'all-assets',
      categories
        .map((c) => c.id)
        .sort()
        .join(',')
    ],
    queryFn: async () => {
      if (!categories || categories.length === 0) return []

      const assetsByCat = await Promise.all(
        categories.map(async (category) => {
          try {
            const assets = await listAssetsByCategory(category.id)
            return assets.map(
              (asset): AssetWithCategory => ({
                ...asset,
                category
              })
            )
          } catch {
            return []
          }
        })
      )

      return assetsByCat.flat()
    },
    enabled: categories.length > 0
  })

  const filteredAssets = allAssets.filter((asset) => {
    if (selectedCategoryId && selectedCategoryId !== 'ALL') {
      return asset.categoryId === selectedCategoryId
    }
    return true
  })

  const createMutation = useMutation({
    mutationFn: ({
      categoryId,
      data
    }: {
      categoryId: string
      data: CreateAssetDTO
    }) => createAsset(categoryId, data),
    onSuccess: (_, variables) => {
      toast.success('Ativo criado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: ['assets', variables.categoryId]
      })
      queryClient.invalidateQueries({ queryKey: ['all-assets'] })
    },
    onError: () => {
      toast.error('Erro ao criar ativo.')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({
      categoryId,
      id,
      data
    }: {
      categoryId: string
      id: string
      data: UpdateAssetDTO
    }) => updateAsset(categoryId, id, data),
    onSuccess: (_, variables) => {
      toast.success('Ativo atualizado com sucesso!')
      queryClient.invalidateQueries({
        queryKey: ['assets', variables.categoryId]
      })
      queryClient.invalidateQueries({ queryKey: ['all-assets'] })
    },
    onError: () => {
      toast.error('Erro ao atualizar ativo.')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: ({ categoryId, id }: { categoryId: string; id: string }) =>
      deleteAsset(categoryId, id),
    onSuccess: (_, variables) => {
      toast.success('Ativo removido com sucesso!')
      queryClient.invalidateQueries({
        queryKey: ['assets', variables.categoryId]
      })
      queryClient.invalidateQueries({ queryKey: ['all-assets'] })
    },
    onError: () => {
      toast.error('Erro ao remover ativo.')
    }
  })

  return {
    categories,
    assets: filteredAssets,
    allAssets,
    isLoading: isLoadingCategories || isLoadingAssets,
    createAsset: createMutation.mutateAsync,
    updateAsset: updateMutation.mutateAsync,
    deleteAsset: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  }
}
