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

    it('should use the total return indexes and convert the dollar ones to reais', async () => {
      const http = httpWith((url) =>
        url.includes('BRL')
          ? yahooChart([bar(2026, 8, 5), bar(2026, 9, 5.5)])
          : yahooChart([bar(2026, 8, 100), bar(2026, 9, 102)])
      )
      const provider = new YahooBenchmarkProvider(http)
      const since = { year: 2026, month: 9 }

      const ifix = await provider.fetchMonthlyReturns(BenchmarkType.IFIX, since)
      const btc = await provider.fetchMonthlyReturns(
        BenchmarkType.BTC_BRL,
        since
      )
      await provider.fetchMonthlyReturns(BenchmarkType.SP500_BRL, since)

      const urls = vi.mocked(http.get).mock.calls.map(([url]) => url)
      expect(urls).toEqual(
        expect.arrayContaining([
          expect.stringContaining('XFIX11.SA'),
          expect.stringContaining('BTC-USD'),
          expect.stringContaining(encodeURIComponent('^SP500TR'))
        ])
      )
      // IFIX em reais: só a variação do ETF
      expect(ifix?.[0].returnPct).toBeCloseTo(2)
      // Bitcoin: (1 + 2%) × (1 + 10%) − 1 = 12,2%
      expect(btc?.[0].returnPct).toBeCloseTo(12.2)
    })

    it('should attribute dollar bars stamped on the last day of the previous month', async () => {
      // Dólar (Londres): a barra de setembro vem às 23:00 UTC de 31/08, a de
      // agosto às 23:00 UTC de 31/07. Os índices vêm às 04:00 UTC do dia 1º.
      const utc = (iso: string) => Date.parse(iso) / 1000
      const http = httpWith((url) =>
        url.includes('BRL')
          ? yahooChart([
              { ts: utc('2026-06-30T23:00:00Z'), close: 5.0 },
              { ts: utc('2026-07-31T23:00:00Z'), close: 5.5 },
              { ts: utc('2026-08-31T23:00:00Z'), close: 6.05 }
            ])
          : yahooChart([
              { ts: utc('2026-07-01T04:00:00Z'), close: 100 },
              { ts: utc('2026-08-01T04:00:00Z'), close: 110 },
              { ts: utc('2026-09-01T04:00:00Z'), close: 121 }
            ])
      )
      const provider = new YahooBenchmarkProvider(http)

      const result = await provider.fetchMonthlyReturns(
        BenchmarkType.SP500_BRL,
        { year: 2026, month: 8 }
      )

      // Agosto e setembro: (1 + 10%) × (1 + 10%) − 1 = 21%, sem buracos
      expect(result?.map(({ year, month }) => [year, month])).toEqual([
        [2026, 8],
        [2026, 9]
      ])
      expect(result?.[0].returnPct).toBeCloseTo(21)
      expect(result?.[1].returnPct).toBeCloseTo(21)
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
