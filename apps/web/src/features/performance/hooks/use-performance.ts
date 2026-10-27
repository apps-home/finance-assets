import { useQuery } from '@tanstack/react-query'

import { ASSET_QUERY_KEY } from '@/features/assets/hooks/use-assets'

import { getAssetTotalReturns, getPortfolioPerformance } from '../api'
import type { GetPerformanceParams } from '../api/types'

export const PERFORMANCE_QUERY_KEY = 'performance'

export function usePortfolioPerformance(params?: GetPerformanceParams) {
  return useQuery({
    queryKey: [PERFORMANCE_QUERY_KEY, params],
    queryFn: () => getPortfolioPerformance(params),
    placeholderData: (prev) => prev
  })
}

export function useAssetTotalReturns() {
  return useQuery({
    // Sob a chave de ativos: mutations de ativos e operações já a invalidam
    queryKey: [ASSET_QUERY_KEY, 'total-returns'],
    queryFn: getAssetTotalReturns,
    placeholderData: (prev) => prev
  })
}
