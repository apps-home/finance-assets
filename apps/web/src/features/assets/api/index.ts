import { apiClient } from '@/infrastructure/services/api-client'

import type {
  Asset,
  AssetWithCategory,
  CreateAssetDTO,
  ListAssetsParams,
  PortfolioSummary,
  PriceHistory,
  PriceHistoryRange,
  UpdateAssetDTO
} from './types'

const BASE_URL = '/assets'

/**
 * Lista os ativos do usuário, com filtros e ordenação no servidor
 */
export async function listAssets(
  params?: ListAssetsParams
): Promise<AssetWithCategory[]> {
  const response = await apiClient.get<AssetWithCategory[]>(BASE_URL, {
    params
  })
  return response.data
}

/**
 * Resumo consolidado da carteira (calculado no servidor, valores em BRL)
 */
export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const response = await apiClient.get<PortfolioSummary>(
    `${BASE_URL}/portfolio`
  )
  return response.data
}

/**
 * Busca um ativo por ID
 */
export async function getAssetById(id: string): Promise<Asset> {
  const response = await apiClient.get<Asset>(`${BASE_URL}/${id}`)
  return response.data
}

/**
 * Cria um novo ativo
 */
export async function createAsset(data: CreateAssetDTO): Promise<void> {
  await apiClient.post(BASE_URL, data)
}

/**
 * Atualiza um ativo existente
 */
export async function updateAsset(
  id: string,
  data: UpdateAssetDTO
): Promise<void> {
  await apiClient.patch(`${BASE_URL}/${id}`, data)
}

/**
 * Remove um ativo
 */
export async function deleteAsset(id: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`)
}

/**
 * Histórico de cotação do ativo no período (fonte externa, com cache no servidor)
 */
export async function getAssetPriceHistory(
  id: string,
  range: PriceHistoryRange
): Promise<PriceHistory> {
  const response = await apiClient.get<PriceHistory>(
    `${BASE_URL}/${id}/history`,
    { params: { range } }
  )
  return response.data
}
