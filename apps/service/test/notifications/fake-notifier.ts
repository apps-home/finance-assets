import type {
  DomainNotifier,
  NotificationRequest,
  NotificationResult
} from '@/core/domain/notifications/domain-notifier.interface'

export class FakeNotifier implements DomainNotifier {
  public sent: NotificationRequest[] = []
  /** Resultado devolvido em cada envio (ex.: 'failed' para simular o Novu fora) */
  public result: NotificationResult = 'sent'

  async send<TPayload extends Record<string, unknown>>(
    request: NotificationRequest<TPayload>
  ): Promise<NotificationResult> {
    this.sent.push(request)
    return this.result
  }
}
