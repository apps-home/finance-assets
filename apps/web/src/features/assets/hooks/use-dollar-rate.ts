import { useQuery } from '@tanstack/react-query'

import { getCurrencyQuote } from '@/infrastructure/services/external/get-currency'

export function useDollarRate() {
  return useQuery({
    queryKey: ['currency-quote', 'USD'],
    queryFn: () => getCurrencyQuote('USD'),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false
  })
}
