import { Inject, Injectable, Logger } from '@nestjs/common'
import type { Novu } from '@novu/api'

import {
  DomainNotifier,
  type NotificationRequest,
  type NotificationResult
} from '@/core/domain/notifications/domain-notifier.interface'

import { NOVU_CLIENT } from './novu.client'

/**
 * Dispara workflows do Novu. Sem `NOVU_SECRET_KEY` vira no-op (`skipped`);
 * falha do Novu vira `failed` com log, sem lançar.
 */
@Injectable()
export class NovuNotifier implements DomainNotifier {
  private readonly logger = new Logger(NovuNotifier.name)

  constructor(@Inject(NOVU_CLIENT) private readonly novu: Novu | null) {}

  async send<TPayload extends Record<string, unknown>>({
    workflow,
    to,
    payload,
    transactionId
  }: NotificationRequest<TPayload>): Promise<NotificationResult> {
    if (!this.novu) {
      this.logger.log(
        `Notifications disabled (NOVU_SECRET_KEY not set). Skipping "${workflow}" to ${to.subscriberId}.`
      )
      return 'skipped'
    }

    try {
      const { result } = await this.novu.trigger({
        workflowId: workflow,
        to: {
          subscriberId: to.subscriberId,
          ...(to.email && { email: to.email }),
          ...(to.name && { firstName: to.name })
        },
        payload,
        ...(transactionId && { transactionId })
      })

      // Ex.: workflow ainda não criado ou inativo no painel do Novu
      if (!result.acknowledged || result.status !== 'processed') {
        this.logger.warn(
          `Novu did not process "${workflow}" (status: ${result.status}${result.error?.length ? `, ${result.error.join('; ')}` : ''}).`
        )
        return 'failed'
      }

      return 'sent'
    } catch (error) {
      this.logger.error(
        `Failed to send "${workflow}" to ${to.subscriberId}`,
        error instanceof Error ? error.stack : error
      )
      return 'failed'
    }
  }
}
