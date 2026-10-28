import type { NotificationWorkflow } from './notification.constants'

export interface NotificationRecipient {
  /** No Novu, o subscriber é o id do usuário do Better Auth */
  subscriberId: string
  /** Para canais futuros (e-mail); o in-app só precisa do `subscriberId` */
  email?: string
  name?: string
}

export interface NotificationRequest<
  TPayload extends Record<string, unknown> = Record<string, unknown>
> {
  workflow: NotificationWorkflow
  to: NotificationRecipient
  payload: TPayload
  /** Mesmo id enviado de novo é ignorado pelo provider (deduplicação) */
  transactionId?: string
}

/**
 * - `sent`: entregue ao provider
 * - `skipped`: notificações desligadas (provider não configurado)
 * - `failed`: o provider recusou ou ficou fora do ar; o erro vai para o log
 */
export type NotificationResult = 'sent' | 'skipped' | 'failed'

/**
 * Envio de notificações para o usuário. Nunca lança: quem chama decide o que
 * fazer pelo resultado, sem interromper o próprio fluxo.
 */
export abstract class DomainNotifier {
  abstract send<TPayload extends Record<string, unknown>>(
    request: NotificationRequest<TPayload>
  ): Promise<NotificationResult>
}
