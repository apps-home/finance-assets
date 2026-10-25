import type { HttpService } from '@nestjs/axios'
import { of, throwError } from 'rxjs'
import { describe, expect, it, vi } from 'vitest'

import { YahooDividendDataProvider } from './yahoo-dividend-data.provider'

const unix = (value: string) => Math.floor(new Date(value).getTime() / 1000)

function makeProvider(response: unknown) {
  const get = vi.fn(() =>
    response instanceof Error
      ? throwError(() => response)
      : of({ data: response })
  )

  return {
    get,
    sut: new YahooDividendDataProvider({ get } as unknown as HttpService)
  }
}

function chartWith(
  dividends: Record<string, { amount: number; date: number }>
) {
  return { chart: { result: [{ events: { dividends } }] } }
}

describe('YahooDividendDataProvider', () => {
  it('should request daily bars so events are not grouped into larger bars', async () => {
    const { get, sut } = makeProvider(chartWith({}))

    await sut.fetchDividends('MXRF11')

    expect(get).toHaveBeenCalledWith(
      expect.stringContaining('MXRF11.SA'),
      expect.objectContaining({
        params: expect.objectContaining({ interval: '1d', events: 'div' })
      })
    )
  })

  it('should map every event, using the ex-date as COM and payment date', async () => {
    const { sut } = makeProvider(
      chartWith({
        a: { amount: 0.1, date: unix('2026-08-03T00:00:00Z') },
        b: { amount: 0.11, date: unix('2026-09-01T00:00:00Z') }
      })
    )

    const result = await sut.fetchDividends('MXRF11')

    expect(result).toEqual([
      {
        type: 'INCOME',
        rateAmount: 0.1,
        comDate: new Date('2026-08-03T00:00:00Z'),
        paymentDate: new Date('2026-08-03T00:00:00Z')
      },
      {
        type: 'INCOME',
        rateAmount: 0.11,
        comDate: new Date('2026-09-01T00:00:00Z'),
        paymentDate: new Date('2026-09-01T00:00:00Z')
      }
    ])
  })

  it('should treat tickers ending in 11 as FII income and others as dividends', async () => {
    const event = { a: { amount: 0.5, date: unix('2026-01-05T00:00:00Z') } }

    const fii = await makeProvider(chartWith(event)).sut.fetchDividends(
      'BTCI11'
    )
    const stock = await makeProvider(chartWith(event)).sut.fetchDividends(
      'CMIN3'
    )

    expect(fii?.[0]?.type).toBe('INCOME')
    expect(stock?.[0]?.type).toBe('DIVIDEND')
  })

  it('should ignore events without a date or with a non-positive amount', async () => {
    const { sut } = makeProvider(
      chartWith({
        a: { amount: 0, date: unix('2026-01-05T00:00:00Z') },
        b: { amount: -1, date: unix('2026-02-05T00:00:00Z') },
        c: { amount: 0.3, date: 0 },
        d: { amount: 0.4, date: unix('2026-03-05T00:00:00Z') }
      })
    )

    const result = await sut.fetchDividends('CMIN3')

    expect(result).toHaveLength(1)
    expect(result?.[0].rateAmount).toBe(0.4)
  })

  it('should return an empty list when the ticker has no dividends', async () => {
    const { sut } = makeProvider({ chart: { result: [{}] } })

    expect(await sut.fetchDividends('USIM5')).toEqual([])
  })

  it('should return null when the request fails', async () => {
    const { sut } = makeProvider(
      new Error('Request failed with status code 429')
    )

    expect(await sut.fetchDividends('MXRF11')).toBeNull()
  })
})
