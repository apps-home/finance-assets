import { makePriceAlert } from '@test/factories/make-price-alert'
import { InMemoryPriceAlertRepository } from '@test/repositories/in-memory-price-alert.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PriceAlertNotFoundError } from '../errors/price-alert-not-found.error'
import { DeletePriceAlertUseCase } from './delete-price-alert'
import { ListPriceAlertsUseCase } from './list-price-alerts'

describe('Price alerts of the user', () => {
  let repository: InMemoryPriceAlertRepository

  beforeEach(() => {
    repository = new InMemoryPriceAlertRepository()
  })

  it('should list only the alerts of the user, filtered by source', async () => {
    const mine = makePriceAlert({ userId: 'user-1' })
    repository.items.push(
      mine,
      makePriceAlert({ userId: 'user-1' }),
      makePriceAlert({ userId: 'user-2', assetId: mine.assetId })
    )

    const all = await new ListPriceAlertsUseCase(repository).execute('user-1')
    const ofAsset = await new ListPriceAlertsUseCase(repository).execute(
      'user-1',
      { assetId: mine.assetId as string }
    )

    expect(all.value).toHaveLength(2)
    expect(ofAsset.value.map(({ alert }) => alert.id)).toEqual([mine.id])
  })

  it('should delete an alert of the user', async () => {
    const alert = makePriceAlert({ userId: 'user-1' })
    repository.items.push(alert)

    const result = await new DeletePriceAlertUseCase(repository).execute(
      'user-1',
      alert.id
    )

    expect(result.isRight()).toBe(true)
    expect(repository.items).toHaveLength(0)
  })

  it('should not delete an alert of another user', async () => {
    const alert = makePriceAlert({ userId: 'user-2' })
    repository.items.push(alert)

    const result = await new DeletePriceAlertUseCase(repository).execute(
      'user-1',
      alert.id
    )

    expect(result.value).toBeInstanceOf(PriceAlertNotFoundError)
    expect(repository.items).toHaveLength(1)
  })
})
