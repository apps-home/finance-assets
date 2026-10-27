import { apiClient } from '@/infrastructure/services/api-client'

import type {
  AssetTotalReturn,
  GetPerformanceParams,
  PortfolioPerformance
} from './types'

const BASE_URL = '/performance'

/**
 * Rentabilidade da carteira (Modified Dietz) comparada com CDI, Ibovespa e
 * S&P 500 em reais
 */
export async function getPortfolioPerformance(
  params?: GetPerformanceParams
): Promise<PortfolioPerformance> {
  const response = await apiClient.get<PortfolioPerformance>(BASE_URL, {
    params
  })
  return response.data
}

/** Retorno total por ativo: preço + vendas realizadas + proventos recebidos */
export async function getAssetTotalReturns(): Promise<AssetTotalReturn[]> {
  const response = await apiClient.get<AssetTotalReturn[]>(`${BASE_URL}/assets`)
  return response.data
}
