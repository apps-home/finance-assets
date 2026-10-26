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
      quantity: position.quantity > 0 ? position.quantity : null,
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

  it('should total every year of the history, oldest first', () => {
    const history = buildDividendsSummary(
      [...items, item('itsa4', categories.br, '2023-05-10', 30)],
      2026,
      NOW
    )

    expect(history.byYear.map(({ year, total }) => ({ year, total }))).toEqual([
      { year: 2023, total: 30 },
      { year: 2025, total: 70 },
      { year: 2026, total: 240 }
    ])
    expect(history.byYear[2].byCategoryType).toEqual({
      [CategoryType.VARIABLE_BR]: 150,
      [CategoryType.FII]: 40,
      [CategoryType.VARIABLE_US]: 50
    })
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

  it('should compute yield per share when the position grew over the year', () => {
    // R$ 1,00 por cota: 12 cotas em jun e ago, 20 cotas a partir de set
    const grown = [
      item('mxrf11', categories.fii, '2026-06-10', 12, null, {
        quantity: 20,
        averagePrice: 10
      }),
      item('mxrf11', categories.fii, '2026-08-10', 12, null, {
        quantity: 20,
        averagePrice: 10
      })
    ]
    // as linhas de set e out carregam a quantidade nova
    for (const date of ['2026-09-10', '2026-10-10']) {
      grown.push(
        item('mxrf11', categories.fii, date, 20, null, {
          quantity: 20,
          averagePrice: 10
        })
      )
    }
    for (const { dividend } of grown.slice(0, 2)) {
      dividend.update({ quantity: 12 })
    }

    const result = buildDividendsSummary(grown, 2026, NOW).byAsset[0]

    // recebido: 12 + 12 + 20 + 20 = 64; por cota: 4 × R$ 1,00 sobre R$ 10
    expect(result.last12Months).toBe(64)
    expect(result.yieldOnCost).toBe(40)
  })

  it('should fall back to the rate per share when a row has no quantity', () => {
    const noQuantity = item('mxrf11', categories.fii, '2026-10-10', 20, null, {
      quantity: 20,
      averagePrice: 10
    })
    noQuantity.dividend.update({ quantity: null, rateAmount: 1, taxAmount: 5 })

    const result = buildDividendsSummary([noQuantity], 2026, NOW).byAsset[0]

    // 1,00 por cota bruto, 25% retido → 0,75 sobre R$ 10
    expect(result.yieldOnCost).toBe(7.5)
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
