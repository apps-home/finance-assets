import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

import { N8nProvider } from '@/infra/http/n8n/n8n.provider'

import { NotifyAssetVariationsUseCase } from '../../application/use-cases/notify-asset-variations'

@Injectable()
export class NotifyAssetVariationsCron {
  private readonly logger = new Logger(NotifyAssetVariationsCron.name)
  private isRunning = false

  constructor(
    private readonly notifyAssetVariationsUseCase: NotifyAssetVariationsUseCase,
    private readonly n8nProvider: N8nProvider
  ) {}

  /**
   * Executa em dias úteis (terça a sábado) às 09:00 (horário de Brasília).
   */
  @Cron('0 9 * * 2-6', {
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

      const {
        totalAssetsEvaluated,
        totalGainers,
        totalLosers,
        totalWishlistItemsEvaluated,
        totalWishlistTargetReached,
        totalWishlistGainers,
        totalWishlistLosers,
        userAlerts
      } = result.value

      if (userAlerts.length === 0) {
        this.logger.log(
          `Asset variation check finished: ${totalAssetsEvaluated} portfolio assets and ${totalWishlistItemsEvaluated} wishlist items evaluated. 0 alerts triggered.`
        )
        return
      }

      this.logger.log(
        `Asset variation check found ${totalGainers} portfolio gain(s), ${totalLosers} drop(s), ` +
          `${totalWishlistTargetReached} wishlist target(s) reached, ${totalWishlistGainers} wishlist gain(s), and ` +
          `${totalWishlistLosers} wishlist drop(s) across ${userAlerts.length} user(s). Dispatching to n8n...`
      )

      for (const alert of userAlerts) {
        this.logger.log(
          `Dispatching n8n webhook for user ${alert.user.email} (` +
            `${alert.gainers.length} portfolio gainers, ${alert.losers.length} portfolio losers, ` +
            `${alert.wishlist.targetReached.length} wishlist targets, ${alert.wishlist.gainers.length} wishlist gainers, ` +
            `${alert.wishlist.losers.length} wishlist losers)...`
        )

        const response = await this.n8nProvider.triggerWebhook(
          'assets/notify',
          alert
        )

        if (!response.ok) {
          this.logger.warn(
            `n8n webhook responded with status ${response.status}: ${response.errorText ?? 'Unknown error'}`
          )
        } else {
          this.logger.log(
            `n8n webhook successfully notified for user ${alert.user.email} (status ${response.status})`
          )
        }
      }
    } catch (error) {
      this.logger.error('Unexpected error in NotifyAssetVariationsCron', error)
    } finally {
      this.isRunning = false
    }
  }
}
