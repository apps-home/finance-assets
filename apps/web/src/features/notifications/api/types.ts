/** Credenciais do Inbox do Novu; `enabled: false` enquanto o Novu não está configurado */
export type InboxSession =
  | { enabled: false }
  | {
      enabled: true
      applicationIdentifier: string
      subscriberId: string
      /** HMAC do subscriberId, exigido quando o HMAC está ligado no Novu */
      subscriberHash: string
      /** Só na região EU; null usa os servidores padrão do Novu */
      apiUrl: string | null
      socketUrl: string | null
    }
