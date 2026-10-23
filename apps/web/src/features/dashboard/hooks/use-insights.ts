import { useMutation } from '@tanstack/react-query'

import { generateInsights } from '../api'

export function useGenerateInsights() {
  return useMutation({
    mutationFn: generateInsights
  })
}
