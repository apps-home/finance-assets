import { describe, expect, it } from 'vitest'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import type { AssetHTTPResponse } from './asset.mapper'
import { buildPortfolioSummary } from './portfolio-summary'

function makeAsset(
  overrides: Partial<AssetHTTPResponse> & {
    category: {
      id: string
      name: string
      type: CategoryType
      currency: string
    }
  }
) {
  return {
    id: crypto.randomUUID(),
    categoryId: overrides.category.id,
    name: 'Asset',
    ticker: 'AST',
    quantity: 1,
    averagePrice: 10,
    broker: 'Nubank',
    isActive: true,
    currentClosePrice: 10,
    lastMonthClosePrice: 10,
    investedValue: 10,
    currentBalance: 10,
    profitLoss: 0,
    profitabilityPercentage: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  } as AssetHTTPResponse & { category: typeof overrides.category }
}

const brl = {
  id: 'cat-brl',
  name: 'Ações (BRL)',
  type: CategoryType.VARIABLE_BR,
  currency: 'BRL'
}
const usd = {
  id: 'cat-usd',
  name: 'Ações (USD)',
  type: CategoryType.VARIABLE_US,
  currency: 'USD'
}
const fixed = {
  id: 'cat-fixed',
  name: 'Caixa',
  type: CategoryType.FIXED,
  currency: 'BRL'
}

describe('buildPortfolioSummary', () => {
  it('converts foreign currency and separates fixed income from the portfolio', () => {
    const summary = buildPortfolioSummary(
      [
        makeAsset({
          category: brl,
          investedValue: 100,
          currentBalance: 150,
          profitLoss: 50,
          profitabilityPercentage: 50
        }),
        makeAsset({
          category: usd,
          investedValue: 10,
          currentBalance: 20,
          profitLoss: 10,
          profitabilityPercentage: 100,
          broker: 'Vest'
        }),
        makeAsset({
          category: fixed,
          investedValue: 1000,
          currentBalance: 1000,
          profitLoss: 0
        })
      ],
      new Map([['cat-usd', 5]])
    )

    expect(summary.totals.currentBalance).toBe(250)
    expect(summary.totals.investedValue).toBe(150)
    expect(summary.totals.profitLoss).toBe(100)
    expect(summary.totals.assetsCount).toBe(2)
    expect(summary.fixedIncome.currentBalance).toBe(1000)
    expect(summary.fixedIncome.assetsCount).toBe(1)
    expect(summary.fixedIncome.positions[0].name).toBe('Asset')
    expect(summary.macroAllocation.totalBalance).toBe(1250)
    expect(summary.macroAllocation.variableBalance).toBe(250)
    expect(summary.macroAllocation.variablePercentage).toBe(20)
    expect(summary.macroAllocation.fixedBalance).toBe(1000)
    expect(summary.macroAllocation.fixedPercentage).toBe(80)
    expect(summary.allocationByCategory[0].name).toBe('Ações (BRL)')
    expect(summary.allocationByCategory[0].percentage).toBe(60)
    expect(summary.allocationByBroker.map((b) => b.name)).toEqual([
      'Nubank',
      'Vest'
    ])
  })

  it('ranks best and worst performers and ignores inactive assets', () => {
    const summary = buildPortfolioSummary(
      [
        makeAsset({ category: brl, ticker: 'A', profitabilityPercentage: 10 }),
        makeAsset({ category: brl, ticker: 'B', profitabilityPercentage: -20 }),
        makeAsset({
          category: brl,
          ticker: 'C',
          profitabilityPercentage: 99,
          isActive: false
        })
      ],
      new Map()
    )

    expect(summary.bestPerformers.map((p) => p.ticker)).toEqual(['A', 'B'])
    expect(summary.worstPerformers.map((p) => p.ticker)).toEqual(['B', 'A'])
  })

  it('returns an empty summary when there are no assets', () => {
    const summary = buildPortfolioSummary([], new Map())

    expect(summary.totals.currentBalance).toBe(0)
    expect(summary.totals.profitabilityPercentage).toBeNull()
    expect(summary.allocationByCategory).toEqual([])
  })
})
