import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

import { EnvService } from '@/infra/env/env.service'

import {
  NotifyAssetLossUseCase,
  UserLossNotificationPayload
} from '../../application/use-cases/notify-asset-loss'

@Injectable()
export class NotifyAssetLossCron {
  private readonly logger = new Logger(NotifyAssetLossCron.name)
  private isRunning = false

  constructor(
    private readonly notifyAssetLossUseCase: NotifyAssetLossUseCase,
    private readonly envService: EnvService
  ) {}

  /**
   * Executa em dias úteis (segunda a sexta-feira) às 09:00 (horário de Brasília).
   */
  @Cron('0 9 * * 1-5', {
    timeZone: 'America/Sao_Paulo'
  })
  async handleCron(): Promise<void> {
    if (this.isRunning) {
      this.logger.log('Asset loss notification cron job is already running.')
      return
    }

    this.isRunning = true
    this.logger.log('Starting weekday asset loss check cron job...')

    try {
      const result = await this.notifyAssetLossUseCase.execute()

      if (result.isLeft()) {
        this.logger.error(
          'Failed to execute asset loss evaluation',
          result.value
        )
        return
      }

      const { totalAssetsEvaluated, totalDroppedAssets, userAlerts } =
        result.value

      if (userAlerts.length === 0) {
        this.logger.log(
          `Asset loss check finished: ${totalAssetsEvaluated} evaluated, 0 dropped > 5%. Webhook not triggered.`
        )
        return
      }

      const webhookUrl = this.envService.get('N8N_URL')

      this.logger.log(
        `Asset loss check found ${totalDroppedAssets} dropped asset(s) for ${userAlerts.length} user(s). Dispatching to n8n: ${webhookUrl}`
      )

      for (const alert of userAlerts) {
        await this.dispatchToN8n(webhookUrl, alert)
      }
    } catch (error) {
      this.logger.error('Unexpected error in NotifyAssetLossCron', error)
    } finally {
      this.isRunning = false
    }
  }

  private async dispatchToN8n(
    webhookUrl: string,
    payload: UserLossNotificationPayload
  ): Promise<void> {
    try {
      this.logger.log(
        `Dispatching n8n webhook for user ${payload.user.email} (${payload.assets.length} dropped assets)...`
      )

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        this.logger.warn(
          `n8n webhook responded with status ${response.status}: ${errorText}`
        )
      } else {
        this.logger.log(
          `n8n webhook successfully notified for user ${payload.user.email} (status ${response.status})`
        )
      }
    } catch (error) {
      this.logger.error(
        `Failed to send payload to n8n webhook (${webhookUrl}) for user ${payload.user.email}:`,
        error instanceof Error ? error.message : error
      )
    }
  }
}
