import { apiClient } from '@/infrastructure/services/api-client'

import type {
  CreateDividendDTO,
  DividendsSummary,
  DividendWithAsset,
  ListDividendsParams,
  UpdateDividendDTO
} from './types'

const BASE_URL = '/dividends'

/**
 * Lista os proventos do usuário
 */
export async function listDividends(
  params?: ListDividendsParams
): Promise<DividendWithAsset[]> {
  const response = await apiClient.get<DividendWithAsset[]>(BASE_URL, {
    params
  })
  return response.data
}

/**
 * Resumo de proventos: totais do mês/ano, série mensal e Yield on Cost
 */
export async function getDividendsSummary(
  year?: number
): Promise<DividendsSummary> {
  const response = await apiClient.get<DividendsSummary>(
    `${BASE_URL}/summary`,
    {
      params: { year }
    }
  )
  return response.data
}

/**
 * Próximos pagamentos já anunciados
 */
export async function listUpcomingDividends(): Promise<DividendWithAsset[]> {
  const response = await apiClient.get<DividendWithAsset[]>(
    `${BASE_URL}/upcoming`
  )
  return response.data
}

/**
 * Registra um provento
 */
export async function createDividend(data: CreateDividendDTO): Promise<void> {
  await apiClient.post(BASE_URL, data)
}

/**
 * Importa o histórico recente de proventos (processado em segundo plano)
 */
export async function backfillDividends(
  months?: number
): Promise<{ enqueued: number }> {
  const response = await apiClient.post<{ message: string; enqueued: number }>(
    `${BASE_URL}/backfill`,
    { months }
  )
  return response.data
}

/**
 * Atualiza um provento existente
 */
export async function updateDividend(
  id: string,
  data: UpdateDividendDTO
): Promise<void> {
  await apiClient.patch(`${BASE_URL}/${id}`, data)
}

/**
 * Remove um provento
 */
export async function deleteDividend(id: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`)
}
