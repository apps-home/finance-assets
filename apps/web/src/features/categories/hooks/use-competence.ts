import { useQuery } from '@tanstack/react-query'

import { listAvailableYears } from '../api'

export const COMPETENCE_QUERY_KEY = 'competences'

export function useAvailableYears() {
  return useQuery({
    queryKey: [COMPETENCE_QUERY_KEY],
    queryFn: () => listAvailableYears(),
    placeholderData: (prev) => prev
  })
}
