import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

import { EnvService } from '@/infra/env/env.service'

import {
  NotifyAssetVariationsUseCase,
  UserVariationsNotificationPayload
} from '../../application/use-cases/notify-asset-variations'

@Injectable()
export class NotifyAssetVariationsCron {
  private readonly logger = new Logger(NotifyAssetVariationsCron.name)
  private isRunning = false

  constructor(
    private readonly notifyAssetVariationsUseCase: NotifyAssetVariationsUseCase,
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
      this.logger.log(
        'Asset variation notification cron job is already running.'
      )
      return
    }

    this.isRunning = true
    this.logger.log('Starting weekday asset variation check cron job...')

    try {
      const result = await this.notifyAssetVariationsUseCase.execute()

      if (result.isLeft()) {
        this.logger.error(
          'Failed to execute asset variation evaluation',
          result.value
        )
        return
      }

      const { totalAssetsEvaluated, totalGainers, totalLosers, userAlerts } =
        result.value

      if (userAlerts.length === 0) {
        this.logger.log(
          `Asset variation check finished: ${totalAssetsEvaluated} evaluated, 0 passed the 5% margin threshold. Webhook not triggered.`
        )
        return
      }

      const webhookUrl = this.envService.get('N8N_URL')

      this.logger.log(
        `Asset variation check found ${totalGainers} gain(s) and ${totalLosers} drop(s) for ${userAlerts.length} user(s). Dispatching to n8n: ${webhookUrl}`
      )

      for (const alert of userAlerts) {
        await this.dispatchToN8n(`${webhookUrl}/assets/notify`, alert)
      }
    } catch (error) {
      this.logger.error('Unexpected error in NotifyAssetVariationsCron', error)
    } finally {
      this.isRunning = false
    }
  }

  private async dispatchToN8n(
    webhookUrl: string,
    payload: UserVariationsNotificationPayload
  ): Promise<void> {
    try {
      this.logger.log(
        `Dispatching n8n webhook for user ${payload.user.email} (${payload.gainers.length} gainers, ${payload.losers.length} losers)...`
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
