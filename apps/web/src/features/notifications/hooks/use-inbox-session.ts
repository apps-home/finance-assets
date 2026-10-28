import { useQuery } from '@tanstack/react-query'

import { getInboxSession } from '../api'

export const INBOX_SESSION_QUERY_KEY = 'inbox-session'

export function useInboxSession() {
  return useQuery({
    queryKey: [INBOX_SESSION_QUERY_KEY],
    queryFn: getInboxSession,
    // Muda só quando as variáveis do Novu mudam no servidor
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false
  })
}
