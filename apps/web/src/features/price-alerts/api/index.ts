import { apiClient } from '@/infrastructure/services/api-client'

import type {
  CreatePriceAlertDTO,
  ListPriceAlertsParams,
  PriceAlert
} from './types'

const BASE_URL = '/price-alerts'

/**
 * Lista os alertas de preço do usuário (de um ativo ou item da wishlist, se
 * filtrado), do alvo mais alto para o mais baixo
 */
export async function listPriceAlerts(
  params?: ListPriceAlertsParams
): Promise<PriceAlert[]> {
  const response = await apiClient.get<PriceAlert[]>(BASE_URL, { params })
  return response.data
}

/**
 * Cria um alerta: a direção (alta ou queda) vem da cotação atual
 */
export async function createPriceAlert(
  data: CreatePriceAlertDTO
): Promise<void> {
  await apiClient.post(BASE_URL, data)
}

/**
 * Remove um alerta
 */
export async function deletePriceAlert(id: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`)
}
