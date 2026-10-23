import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '@/shared/providers/query-client'

import {
  listUserSessions,
  revokeOtherUserSessions,
  revokeUserSession
} from '../api'

export const SESSIONS_QUERY_KEY = 'sessions'

export function useSessions() {
  return useQuery({
    queryKey: [SESSIONS_QUERY_KEY],
    queryFn: listUserSessions
  })
}

export function useRevokeSession() {
  return useMutation({
    mutationFn: (token: string) => revokeUserSession(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SESSIONS_QUERY_KEY] })
      toast.success('Sessão encerrada com sucesso')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao encerrar sessão')
    }
  })
}

export function useRevokeOtherSessions() {
  return useMutation({
    mutationFn: revokeOtherUserSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SESSIONS_QUERY_KEY] })
      toast.success('Outras sessões encerradas com sucesso')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao encerrar outras sessões')
    }
  })
}
