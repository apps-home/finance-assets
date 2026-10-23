import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '@/shared/providers/query-client'

import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory
} from '../api'
import {
  CreateCategoryDTO,
  ListCategoriesParams,
  UpdateCategoryDTO
} from '../api/types'

export const CATEGORY_QUERY_KEY = 'categories'

export function useCategories(params?: ListCategoriesParams) {
  return useQuery({
    queryKey: [CATEGORY_QUERY_KEY, params],
    queryFn: () => listCategories(params),
    placeholderData: (prev) => prev
  })
}

export function useCategory(categoryId: string) {
  return useQuery({
    queryKey: [CATEGORY_QUERY_KEY, categoryId],
    queryFn: () => getCategoryById(categoryId)
  })
}

export function useCreateCategory() {
  return useMutation({
    mutationFn: (dto: CreateCategoryDTO) => createCategory(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORY_QUERY_KEY] })
      toast.success('Categoria criada com sucesso!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao criar categoria'
      toast.error(message)
    }
  })
}

export function useUpdateCategory() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCategoryDTO }) =>
      updateCategory(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORY_QUERY_KEY] })
      toast.success('Categoria atualizada com sucesso!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao atualizar categoria'
      toast.error(message)
    }
  })
}

export function useDeleteCategory() {
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CATEGORY_QUERY_KEY] })
      toast.success('Categoria excluída com sucesso!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao excluir categoria'
      toast.error(message)
    }
  })
}
