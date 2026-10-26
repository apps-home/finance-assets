import { makeDividend } from '@test/factories/make-dividend'
import { describe, expect, it } from 'vitest'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import type { DividendWithAsset } from './dividend.repository'
import { buildDividendsSummary } from './dividends-summary'

const NOW = new Date('2026-10-24T12:00:00.000Z')

const categories = {
  br: {
    id: 'cat-br',
    name: 'Ações BR',
    type: CategoryType.VARIABLE_BR,
    currency: 'BRL'
  },
  fii: {
    id: 'cat-fii',
    name: 'FIIs',
    type: CategoryType.FII,
    currency: 'BRL'
  },
  us: {
    id: 'cat-us',
    name: 'Stocks',
    type: CategoryType.VARIABLE_US,
    currency: 'USD'
  }
}

function item(
  assetId: string,
  category: (typeof categories)[keyof typeof categories],
  paymentDate: string,
  amount: number,
  exchangeRate: number | null = null,
  position = { quantity: 100, averagePrice: 10 }
): DividendWithAsset {
  return {
    dividend: makeDividend({
      userId: 'user-1',
      assetId,
      amount,
      exchangeRate,
      paymentDate: new Date(`${paymentDate}T00:00:00.000Z`)
    }),
    asset: {
      id: assetId,
      name: assetId,
      ticker: assetId.toUpperCase(),
      ...position
    },
    category
  }
}

describe('buildDividendsSummary', () => {
  it('should count the net amount (gross minus tax) in totals and yield', () => {
    const withTax = item('aapl', categories.us, '2026-10-01', 10, 5)
    withTax.dividend.update({ taxAmount: 3 })

    const summary = buildDividendsSummary([withTax], 2026, NOW)

    // (10 - 3) × 5
    expect(summary.totalYear).toBe(35)
    expect(summary.byAsset[0].last12Months).toBe(7)
  })

  const items = [
    item('itsa4', categories.br, '2026-10-15', 100),
    item('itsa4', categories.br, '2026-03-15', 50),
    item('mxrf11', categories.fii, '2026-10-10', 20),
    item('mxrf11', categories.fii, '2026-09-10', 20),
    item('aapl', categories.us, '2026-10-01', 10, 5),
    // ano anterior
    item('itsa4', categories.br, '2025-12-15', 70),
    // futuro: não pode entrar nos totais
    item('mxrf11', categories.fii, '2026-11-10', 999)
  ]

  const summary = buildDividendsSummary(items, 2026, NOW)

  it('should total the year and the current month in BRL', () => {
    // 100 + 50 + 20 + 20 + (10 × 5)
    expect(summary.totalYear).toBe(240)
    // 100 + 20 + 50
    expect(summary.totalCurrentMonth).toBe(170)
  })

  it('should average over the months elapsed in the current year', () => {
    // outubro = 10 meses decorridos
    expect(summary.monthlyAverage).toBe(24)
  })

  it('should average over 12 months for a past year', () => {
    const past = buildDividendsSummary(items, 2025, NOW)

    expect(past.totalYear).toBe(70)
    expect(past.monthlyAverage).toBeCloseTo(5.83, 2)
  })

  it('should break the year down by month and category type', () => {
    expect(summary.byMonth).toHaveLength(12)
    expect(summary.byMonth[9].total).toBe(170)
    expect(summary.byMonth[9].byCategoryType).toEqual({
      [CategoryType.VARIABLE_BR]: 100,
      [CategoryType.FII]: 20,
      [CategoryType.VARIABLE_US]: 50
    })
  })

  it('should total by category type, highest first', () => {
    expect(summary.byCategoryType).toEqual([
      { type: CategoryType.VARIABLE_BR, total: 150 },
      { type: CategoryType.VARIABLE_US, total: 50 },
      { type: CategoryType.FII, total: 40 }
    ])
  })

  it('should build the last 12 months ending in the current month', () => {
    expect(summary.last12Months).toHaveLength(12)
    expect(summary.last12Months[0]).toMatchObject({ year: 2025, month: 11 })
    expect(summary.last12Months[11]).toMatchObject({ year: 2026, month: 10 })
    // dezembro/2025 entra na janela de 12 meses
    expect(summary.last12Months[1].total).toBe(70)
  })

  it('should exclude future payments from every total', () => {
    const november = summary.last12Months.find((m) => m.month === 11)

    expect(november?.year).toBe(2025)
    expect(
      summary.byCategory.find((c) => c.categoryId === 'cat-fii')?.total
    ).toBe(40)
  })

  it('should compute yield on cost in the asset currency', () => {
    // itsa4: 100 + 50 + 70 = 220 em 12 meses sobre 100 × 10 = 1000
    const itsa = summary.byAsset.find((a) => a.assetId === 'itsa4')
    // aapl: 10 USD sobre 1000 USD (sem converter para BRL)
    const aapl = summary.byAsset.find((a) => a.assetId === 'aapl')

    expect(itsa?.yieldOnCost).toBe(22)
    expect(aapl?.last12Months).toBe(10)
    expect(aapl?.yieldOnCost).toBe(1)
  })

  it('should return a null yield when the position has no cost basis', () => {
    const withoutCost = buildDividendsSummary(
      [
        item('xpto3', categories.br, '2026-10-15', 100, null, {
          quantity: 0,
          averagePrice: 0
        })
      ],
      2026,
      NOW
    )

    expect(withoutCost.byAsset[0].yieldOnCost).toBeNull()
  })

  it('should return zeros when there are no dividends', () => {
    const empty = buildDividendsSummary([], 2026, NOW)

    expect(empty.totalYear).toBe(0)
    expect(empty.monthlyAverage).toBe(0)
    expect(empty.byAsset).toEqual([])
  })
})
