import { apiClient } from '@/infrastructure/services/api-client'

import type { InboxSession } from './types'

/**
 * O que o Inbox do Novu precisa para o usuário da sessão. A secret key fica no
 * backend: aqui só chega o hash do subscriber.
 */
export async function getInboxSession(): Promise<InboxSession> {
  const response = await apiClient.get<InboxSession>(
    '/notifications/inbox-session'
  )
  return response.data
}
