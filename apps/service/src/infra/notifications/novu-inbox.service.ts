import { createHmac } from 'node:crypto'
import { Injectable } from '@nestjs/common'

import { EnvService } from '../env/env.service'

export type InboxSession =
  | { enabled: false }
  | {
      enabled: true
      applicationIdentifier: string
      subscriberId: string
      /** HMAC do subscriberId: obrigatório quando o HMAC está ligado no Novu */
      subscriberHash: string
      /** Só na região EU; null usa os servidores padrão do Novu */
      apiUrl: string | null
      socketUrl: string | null
    }

/**
 * O que a web precisa para abrir o Inbox do Novu do usuário. A secret key
 * fica aqui: o front só recebe o hash.
 */
@Injectable()
export class NovuInboxService {
  constructor(private readonly env: EnvService) {}

  getSession(subscriberId: string): InboxSession {
    const secretKey = this.env.get('NOVU_SECRET_KEY')
    const applicationIdentifier = this.env.get('NOVU_APPLICATION_IDENTIFIER')

    if (!secretKey || !applicationIdentifier) {
      return { enabled: false }
    }

    return {
      enabled: true,
      applicationIdentifier,
      subscriberId,
      subscriberHash: createHmac('sha256', secretKey)
        .update(subscriberId)
        .digest('hex'),
      apiUrl: this.env.get('NOVU_API_URL') ?? null,
      socketUrl: this.env.get('NOVU_SOCKET_URL') ?? null
    }
  }
}
