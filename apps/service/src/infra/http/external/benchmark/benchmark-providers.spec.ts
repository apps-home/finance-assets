import type { HttpService } from '@nestjs/axios'
import { of, throwError } from 'rxjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BenchmarkType } from '@/core/http/external/benchmark/benchmark-data.gateway'

import { BcbCdiBenchmarkProvider } from './bcb-cdi-benchmark.provider'
import { YahooBenchmarkProvider } from './yahoo-benchmark.provider'

function httpWith(handler: (url: string) => unknown) {
  return {
    get: vi.fn((url: string) => {
      const data = handler(url)

      return data instanceof Error ? throwError(() => data) : of({ data })
    })
  } as unknown as HttpService
}

/** Barra mensal do Yahoo: início do mês (UTC) e fechamento */
function bar(year: number, month: number, close: number | null, day = 1) {
  return { ts: Date.UTC(year, month - 1, day, 12) / 1000, close }
}

function yahooChart(bars: Array<{ ts: number; close: number | null }>) {
  return {
    chart: {
      result: [
        {
          timestamp: bars.map((b) => b.ts),
          indicators: { quote: [{ close: bars.map((b) => b.close) }] }
        }
      ]
    }
  }
}

describe('benchmark providers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Último mês fechado: setembro/2026
    vi.setSystemTime(new Date('2026-10-25T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('BcbCdiBenchmarkProvider', () => {
    it('should map the monthly series and drop the open month', async () => {
      const provider = new BcbCdiBenchmarkProvider(
        httpWith(() => [
          { data: '01/08/2026', valor: '1.09' },
          { data: '01/09/2026', valor: '1.08' },
          { data: '01/10/2026', valor: '0.76' }
        ])
      )

      const result = await provider.fetchMonthlyReturns({
        year: 2026,
        month: 8
      })

      expect(result).toEqual([
        { year: 2026, month: 8, returnPct: 1.09 },
        { year: 2026, month: 9, returnPct: 1.08 }
      ])
    })

    it('should ignore malformed items', async () => {
      const provider = new BcbCdiBenchmarkProvider(
        httpWith(() => [
          { data: '01/08/2026', valor: 'abc' },
          { data: '01/09/2026', valor: '1.00' }
        ])
      )

      const result = await provider.fetchMonthlyReturns({
        year: 2026,
        month: 8
      })

      expect(result).toEqual([{ year: 2026, month: 9, returnPct: 1 }])
    })

    it('should return null when the request fails', async () => {
      const provider = new BcbCdiBenchmarkProvider(
        httpWith(() => new Error('timeout'))
      )

      expect(
        await provider.fetchMonthlyReturns({ year: 2026, month: 8 })
      ).toBeNull()
    })
  })

  describe('YahooBenchmarkProvider', () => {
    it('should compute the month over month return of the index', async () => {
      const provider = new YahooBenchmarkProvider(
        httpWith(() =>
          yahooChart([bar(2026, 7, 100), bar(2026, 8, 110), bar(2026, 9, 99)])
        )
      )

      const result = await provider.fetchMonthlyReturns(BenchmarkType.IBOV, {
        year: 2026,
        month: 8
      })

      expect(result).toHaveLength(2)
      expect(result?.[0]).toMatchObject({ year: 2026, month: 8 })
      expect(result?.[0].returnPct).toBeCloseTo(10)
      expect(result?.[1]).toMatchObject({ year: 2026, month: 9 })
      expect(result?.[1].returnPct).toBeCloseTo(-10)
    })

    it('should ignore the open month, even when Yahoo sends two bars for it', async () => {
      const provider = new YahooBenchmarkProvider(
        httpWith(() =>
          yahooChart([
            bar(2026, 9, 100),
            bar(2026, 10, 120),
            bar(2026, 10, 121, 23)
          ])
        )
      )

      const result = await provider.fetchMonthlyReturns(BenchmarkType.IBOV, {
        year: 2026,
        month: 9
      })

      expect(result).toEqual([])
    })

    it('should skip months without a close or without the previous month', async () => {
      const provider = new YahooBenchmarkProvider(
        httpWith(() =>
          yahooChart([bar(2026, 7, 100), bar(2026, 8, null), bar(2026, 9, 105)])
        )
      )

      const result = await provider.fetchMonthlyReturns(BenchmarkType.IBOV, {
        year: 2026,
        month: 8
      })

      // Agosto sem fechamento e setembro sem agosto: nada a calcular
      expect(result).toEqual([])
    })

    it('should compound the S&P 500 return with the dollar variation', async () => {
      const http = httpWith((url) =>
        url.includes('BRL')
          ? yahooChart([bar(2026, 8, 5), bar(2026, 9, 5.5)])
          : yahooChart([bar(2026, 8, 1000), bar(2026, 9, 1100)])
      )
      const provider = new YahooBenchmarkProvider(http)

      const result = await provider.fetchMonthlyReturns(
        BenchmarkType.SP500_BRL,
        { year: 2026, month: 9 }
      )

      // (1 + 10%) × (1 + 10%) − 1 = 21%
      expect(result).toHaveLength(1)
      expect(result?.[0]).toMatchObject({ year: 2026, month: 9 })
      expect(result?.[0].returnPct).toBeCloseTo(21)
    })

    it('should return null when the request fails', async () => {
      const provider = new YahooBenchmarkProvider(
        httpWith(() => new Error('blocked'))
      )

      expect(
        await provider.fetchMonthlyReturns(BenchmarkType.IBOV, {
          year: 2026,
          month: 8
        })
      ).toBeNull()
    })
  })
})
