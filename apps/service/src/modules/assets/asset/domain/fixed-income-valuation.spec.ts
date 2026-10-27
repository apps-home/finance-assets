import { describe, expect, it } from 'vitest'

import type { IndicatorRate } from '@/core/http/external/indicators/indicator-data.gateway'
import { addDaysUtc } from '@/core/utils/utc-date'

import {
  calcFixedIncomeFactor,
  FixedIncomeIndexer
} from './fixed-income-valuation'

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

/** Uma taxa por dia de semana entre `from` e `to` (inclusive) */
function cdiBetween(from: string, to: string, ratePct = 0.05): IndicatorRate[] {
  const rates: IndicatorRate[] = []

  for (let date = day(from); date <= day(to); date = addDaysUtc(date, 1)) {
    const weekday = date.getUTCDay()

    if (weekday !== 0 && weekday !== 6) rates.push({ date, ratePct })
  }

  return rates
}

describe('calcFixedIncomeFactor', () => {
  // Segunda 05/10/2026 a segunda 12/10/2026: 5 dias úteis (05 a 09)
  const cdi = cdiBetween('2026-10-01', '2026-10-09')
  const now = new Date('2026-10-12T15:00:00Z')

  it('should compound the daily CDI times the percentage of the CDI', () => {
    const factor = calcFixedIncomeFactor(
      {
        indexer: FixedIncomeIndexer.CDI,
        indexerRate: 110,
        investedAt: day('2026-10-05'),
        maturityAt: null
      },
      cdi,
      [],
      now
    )

    expect(factor).toBeCloseTo((1 + 0.0005 * 1.1) ** 5, 12)
  })

  it('should not count the day of the valuation (its CDI is not out yet)', () => {
    const factor = calcFixedIncomeFactor(
      {
        indexer: FixedIncomeIndexer.CDI,
        indexerRate: 100,
        investedAt: day('2026-10-09'),
        maturityAt: null
      },
      cdi,
      [],
      new Date('2026-10-09T20:00:00Z')
    )

    expect(factor).toBe(1)
  })

  it('should use the business days of the CDI series for a fixed rate', () => {
    const yearOfCdi = cdiBetween('2025-01-01', '2025-12-31')
    const factor = calcFixedIncomeFactor(
      {
        indexer: FixedIncomeIndexer.PRE,
        indexerRate: 12,
        investedAt: day('2025-01-01'),
        maturityAt: null
      },
      yearOfCdi,
      [],
      day('2026-01-01')
    )

    // 261 dias de semana em 2025 (a série de teste não tem feriados)
    expect(factor).toBeCloseTo(1.12 ** (261 / 252), 10)
  })

  it('should add the IPCA pro rata to the real rate', () => {
    const factor = calcFixedIncomeFactor(
      {
        indexer: FixedIncomeIndexer.IPCA,
        indexerRate: 0,
        investedAt: day('2026-09-01'),
        maturityAt: null
      },
      cdiBetween('2026-09-01', '2026-10-15'),
      [
        { date: day('2026-09-01'), ratePct: 1 }
        // Outubro ainda não saiu: usa setembro como projeção
      ],
      day('2026-10-16')
    )

    // Setembro inteiro (1%) + 15 de 31 dias de outubro a 1%
    expect(factor).toBeCloseTo(1.01 * 1.01 ** (15 / 31), 10)
  })

  it('should stop at the maturity date', () => {
    const atMaturity = calcFixedIncomeFactor(
      {
        indexer: FixedIncomeIndexer.CDI,
        indexerRate: 100,
        investedAt: day('2026-10-05'),
        maturityAt: day('2026-10-07')
      },
      cdi,
      [],
      now
    )

    expect(atMaturity).toBeCloseTo(1.0005 ** 2, 12)
  })

  it('should refuse to value a period the CDI series does not cover', () => {
    expect(
      calcFixedIncomeFactor(
        {
          indexer: FixedIncomeIndexer.CDI,
          indexerRate: 100,
          investedAt: day('2026-09-01'),
          maturityAt: null
        },
        cdi,
        [],
        now
      )
    ).toBeNull()
  })

  it('should refuse IPCA+ without any IPCA before the investment', () => {
    expect(
      calcFixedIncomeFactor(
        {
          indexer: FixedIncomeIndexer.IPCA,
          indexerRate: 6,
          investedAt: day('2026-10-05'),
          maturityAt: null
        },
        cdi,
        [{ date: day('2026-11-01'), ratePct: 0.5 }],
        now
      )
    ).toBeNull()
  })
})
