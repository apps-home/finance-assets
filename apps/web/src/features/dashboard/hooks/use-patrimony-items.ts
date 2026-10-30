import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '@/shared/providers/query-client'

import {
  createPatrimonyItem,
  deletePatrimonyItem,
  listPatrimonyItems,
  updatePatrimonyItem
} from '../api'
import type {
  CreatePatrimonyItemDTO,
  ListPatrimonyItemsParams,
  UpdatePatrimonyItemDTO
} from '../api/types'

export const PATRIMONY_ITEMS_QUERY_KEY = 'patrimony-items'

export function usePatrimonyItems(params?: ListPatrimonyItemsParams) {
  return useQuery({
    queryKey: [PATRIMONY_ITEMS_QUERY_KEY, params],
    queryFn: () => listPatrimonyItems(params),
    placeholderData: (prev) => prev
  })
}

export function useCreatePatrimonyItem() {
  return useMutation({
    mutationFn: (dto: CreatePatrimonyItemDTO) => createPatrimonyItem(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATRIMONY_ITEMS_QUERY_KEY] })
      toast.success('Item patrimonial cadastrado!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao cadastrar item patrimonial.'
      toast.error(message)
    }
  })
}

export function useUpdatePatrimonyItem() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePatrimonyItemDTO }) =>
      updatePatrimonyItem(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATRIMONY_ITEMS_QUERY_KEY] })
      toast.success('Item patrimonial atualizado!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao atualizar item patrimonial.'
      toast.error(message)
    }
  })
}

export function useDeletePatrimonyItem() {
  return useMutation({
    mutationFn: (id: string) => deletePatrimonyItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATRIMONY_ITEMS_QUERY_KEY] })
      toast.success('Item patrimonial removido!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao remover item patrimonial.'
      toast.error(message)
    }
  })
}
