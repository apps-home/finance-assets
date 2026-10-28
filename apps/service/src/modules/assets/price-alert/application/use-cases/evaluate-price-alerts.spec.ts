import { makePriceAlert } from '@test/factories/make-price-alert'
import { FakeNotifier } from '@test/notifications/fake-notifier'
import { InMemoryPriceAlertRepository } from '@test/repositories/in-memory-price-alert.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { NOTIFICATION_WORKFLOWS } from '@/core/domain/notifications/notification.constants'

import {
  PriceAlertDirection,
  PriceAlertStatus
} from '../../domain/price-alert.entity'
import { EvaluatePriceAlertsUseCase } from './evaluate-price-alerts'

const MARKET_ASSET = 'market-asset-1'

describe('EvaluatePriceAlertsUseCase', () => {
  let repository: InMemoryPriceAlertRepository
  let notifier: FakeNotifier
  let sut: EvaluatePriceAlertsUseCase

  beforeEach(() => {
    repository = new InMemoryPriceAlertRepository()
    notifier = new FakeNotifier()
    sut = new EvaluatePriceAlertsUseCase(repository, notifier)
  })

  function seed(override: Parameters<typeof makePriceAlert>[0]) {
    const alert = makePriceAlert({ marketAssetId: MARKET_ASSET, ...override })
    repository.items.push(alert)
    return alert
  }

  const evaluate = (price: number) =>
    sut.execute({ marketAssetId: MARKET_ASSET, price })

  it('should notify the owner once when the quote reaches the target', async () => {
    const alert = seed({ userId: 'user-1', targetPrice: 40 })

    const result = await evaluate(39.5)

    expect(result.value).toEqual({ triggered: 1, rearmed: 0 })
    expect(notifier.sent).toEqual([
      expect.objectContaining({
        workflow: NOTIFICATION_WORKFLOWS.PRICE_ALERT,
        to: { subscriberId: 'user-1' },
        transactionId: `price-alert-${alert.id}-1`,
        payload: expect.objectContaining({
          alertId: alert.id,
          ticker: 'WEGE3',
          directionLabel: 'caiu para',
          currentPrice: 39.5,
          targetPrice: 40
        })
      })
    ])
    expect(repository.items[0]).toMatchObject({
      status: PriceAlertStatus.TRIGGERED,
      lastTriggeredPrice: 39.5,
      triggerCount: 1
    })
  })

  it('should not notify again while the quote stays in the range', async () => {
    seed({ userId: 'user-1', targetPrice: 40 })

    await evaluate(39.5)
    await evaluate(38)

    expect(notifier.sent).toHaveLength(1)
  })

  it('should re-arm without notifying and notify again on the next crossing', async () => {
    const alert = seed({
      userId: 'user-1',
      targetPrice: 50,
      direction: PriceAlertDirection.ABOVE
    })

    await evaluate(51)
    const rearm = await evaluate(49)

    expect(rearm.value).toEqual({ triggered: 0, rearmed: 1 })
    expect(repository.items[0].status).toBe(PriceAlertStatus.ARMED)
    expect(notifier.sent).toHaveLength(1)

    await evaluate(50)

    expect(notifier.sent).toHaveLength(2)
    expect(notifier.sent[1].transactionId).toBe(`price-alert-${alert.id}-2`)
  })

  it('should leave alerts out of range and of other tickers untouched', async () => {
    seed({ userId: 'user-1', targetPrice: 30 })
    repository.items.push(
      makePriceAlert({
        userId: 'user-1',
        marketAssetId: 'other-ticker',
        targetPrice: 40
      })
    )

    const result = await evaluate(35)

    expect(result.value).toEqual({ triggered: 0, rearmed: 0 })
    expect(notifier.sent).toHaveLength(0)
  })

  it('should notify only once when two updates of the ticker run together', async () => {
    seed({ userId: 'user-1', targetPrice: 40 })

    await Promise.all([evaluate(39), evaluate(39)])

    expect(notifier.sent).toHaveLength(1)
    expect(repository.items[0].triggerCount).toBe(1)
  })

  it('should keep evaluating the other alerts when a notification fails', async () => {
    seed({ userId: 'user-1', targetPrice: 40 })
    seed({ userId: 'user-2', targetPrice: 41 })
    notifier.result = 'failed'

    const result = await evaluate(39)

    expect(result.value).toEqual({ triggered: 2, rearmed: 0 })
    expect(notifier.sent).toHaveLength(2)
  })
})
