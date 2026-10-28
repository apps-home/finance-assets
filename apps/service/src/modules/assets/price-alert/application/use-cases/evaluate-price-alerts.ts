import { Injectable, Logger } from '@nestjs/common'

import { DomainNotifier } from '@/core/domain/notifications/domain-notifier.interface'
import { NOTIFICATION_WORKFLOWS } from '@/core/domain/notifications/notification.constants'
import { Either, right } from '@/core/utils/Either'

import { PriceAlertStatus } from '../../domain/price-alert.entity'
import { PriceAlertRepository } from '../../domain/price-alert.repository'
import { buildPriceAlertNotification } from '../../domain/price-alert-notification'

export interface EvaluatePriceAlertsInput {
  marketAssetId: string
  /** Cotação nova do ticker */
  price: number
  at?: Date
}

type EvaluatePriceAlertsResponse = Either<
  never,
  { triggered: number; rearmed: number }
>

/**
 * Confere os alertas de um ticker contra a cotação nova: notifica os que
 * atingiram o alvo e rearma os que saíram da faixa. Só quem faz a transição
 * no banco notifica, então duas atualizações juntas não avisam duas vezes.
 */
@Injectable()
export class EvaluatePriceAlertsUseCase {
  private readonly logger = new Logger(EvaluatePriceAlertsUseCase.name)

  constructor(
    private readonly priceAlertRepository: PriceAlertRepository,
    private readonly notifier: DomainNotifier
  ) {}

  async execute({
    marketAssetId,
    price,
    at = new Date()
  }: EvaluatePriceAlertsInput): Promise<EvaluatePriceAlertsResponse> {
    const alerts =
      await this.priceAlertRepository.findByMarketAsset(marketAssetId)

    let triggered = 0
    let rearmed = 0

    for (const item of alerts) {
      const { alert } = item
      const evaluation = alert.evaluate(price)

      if (evaluation === 'TRIGGER') {
        alert.markTriggered(price, at)

        const won = await this.priceAlertRepository.transition(
          alert,
          PriceAlertStatus.ARMED
        )
        if (!won) continue

        triggered++

        const result = await this.notifier.send({
          workflow: NOTIFICATION_WORKFLOWS.PRICE_ALERT,
          to: { subscriberId: alert.userId },
          payload: buildPriceAlertNotification(item, price),
          // Um aviso por disparo: reenviar o mesmo disparo é ignorado pelo Novu
          transactionId: `price-alert-${alert.id}-${alert.triggerCount}`
        })

        if (result === 'failed') {
          this.logger.warn(
            `Price alert ${alert.id} (${item.ticker}) reached, but the notification failed.`
          )
        }
      }

      if (evaluation === 'REARM') {
        alert.rearm(at)

        if (
          await this.priceAlertRepository.transition(
            alert,
            PriceAlertStatus.TRIGGERED
          )
        ) {
          rearmed++
        }
      }
    }

    if (triggered > 0 || rearmed > 0) {
      this.logger.log(
        `Price alerts of market asset ${marketAssetId}: ${triggered} triggered, ${rearmed} re-armed.`
      )
    }

    return right({ triggered, rearmed })
  }
}
