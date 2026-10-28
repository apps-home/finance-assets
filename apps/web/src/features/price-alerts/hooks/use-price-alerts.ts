import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '@/shared/providers/query-client'

import { createPriceAlert, deletePriceAlert, listPriceAlerts } from '../api'
import type { CreatePriceAlertDTO, ListPriceAlertsParams } from '../api/types'

export const PRICE_ALERT_QUERY_KEY = 'price-alerts'

function errorMessage(error: any, fallback: string) {
  return error.response?.data?.message || error.message || fallback
}

// 1. Queries
export function usePriceAlerts(params?: ListPriceAlertsParams) {
  // Sem placeholderData: ao abrir outro ativo, não mostra os alertas do anterior
  return useQuery({
    queryKey: [PRICE_ALERT_QUERY_KEY, params],
    queryFn: () => listPriceAlerts(params)
  })
}

// 2. Mutations
export function useCreatePriceAlert() {
  return useMutation({
    mutationFn: (dto: CreatePriceAlertDTO) => createPriceAlert(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRICE_ALERT_QUERY_KEY] })
      toast.success('Alerta de preço criado!')
    },
    onError: (error: any) => {
      toast.error(errorMessage(error, 'Erro ao criar alerta'))
    }
  })
}

export function useDeletePriceAlert() {
  return useMutation({
    mutationFn: (id: string) => deletePriceAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRICE_ALERT_QUERY_KEY] })
      toast.success('Alerta removido!')
    },
    onError: (error: any) => {
      toast.error(errorMessage(error, 'Erro ao remover alerta'))
    }
  })
}
