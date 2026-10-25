import { useQuery } from '@tanstack/react-query'

import { getPortfolioPerformance } from '../api'
import type { GetPerformanceParams } from '../api/types'

export const PERFORMANCE_QUERY_KEY = 'performance'

export function usePortfolioPerformance(params?: GetPerformanceParams) {
  return useQuery({
    queryKey: [PERFORMANCE_QUERY_KEY, params],
    queryFn: () => getPortfolioPerformance(params),
    placeholderData: (prev) => prev
  })
}
