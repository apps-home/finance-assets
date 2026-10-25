import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { DividendWithAsset } from './dividend.repository'

export type TotalsByCategoryType = Partial<Record<CategoryType, number>>

export interface DividendsMonthSummary {
  year: number
  /** 1-12 */
  month: number
  total: number
  byCategoryType: TotalsByCategoryType
}

export interface DividendsByCategoryTypeSummary {
  type: CategoryType
  total: number
}

export interface DividendsByCategorySummary {
  categoryId: string
  name: string
  type: CategoryType
  total: number
}

export interface DividendsByAssetSummary {
  assetId: string
  name: string
  ticker: string
  categoryType: CategoryType
  currency: string
  /** Recebido no ano consultado, em BRL */
  totalYear: number
  /** Recebido nos últimos 12 meses, na moeda do ativo */
  last12Months: number
  /** Dividendos dos últimos 12 meses ÷ (quantidade × preço médio) × 100 */
  yieldOnCost: number | null
}

export interface DividendsSummary {
  year: number
  /** Valores monetários em BRL */
  totalYear: number
  totalCurrentMonth: number
  monthlyAverage: number
  byMonth: DividendsMonthSummary[]
  last12Months: DividendsMonthSummary[]
  byCategoryType: DividendsByCategoryTypeSummary[]
  byCategory: DividendsByCategorySummary[]
  byAsset: DividendsByAssetSummary[]
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function addTo(
  totals: TotalsByCategoryType,
  type: CategoryType,
  value: number
): void {
  totals[type] = (totals[type] ?? 0) + value
}

function emptyMonth(year: number, month: number): DividendsMonthSummary {
  return { year, month, total: 0, byCategoryType: {} }
}

function roundMonth(month: DividendsMonthSummary): DividendsMonthSummary {
  return {
    ...month,
    total: round2(month.total),
    byCategoryType: Object.fromEntries(
      Object.entries(month.byCategoryType).map(([type, value]) => [
        type,
        round2(value)
      ])
    )
  }
}

/**
 * Consolida os proventos já recebidos (`paymentDate <= now`). Proventos
 * futuros não entram: aparecem apenas em "próximos pagamentos".
 */
export function buildDividendsSummary(
  items: DividendWithAsset[],
  year: number,
  now: Date = new Date()
): DividendsSummary {
  const nowYear = now.getUTCFullYear()
  const nowMonth = now.getUTCMonth() // 0-11

  const byMonth = Array.from({ length: 12 }, (_, i) => emptyMonth(year, i + 1))
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(Date.UTC(nowYear, nowMonth - 11 + i, 1))
    return emptyMonth(date.getUTCFullYear(), date.getUTCMonth() + 1)
  })
  const last12Start = Date.UTC(nowYear, nowMonth - 11, 1)

  const byCategoryType: TotalsByCategoryType = {}
  const byCategory = new Map<string, DividendsByCategorySummary>()
  const byAsset = new Map<string, DividendsByAssetSummary>()

  let totalYear = 0
  let totalCurrentMonth = 0

  for (const { dividend, asset, category } of items) {
    if (dividend.paymentDate.getTime() > now.getTime()) continue

    const paymentYear = dividend.paymentDate.getUTCFullYear()
    const paymentMonth = dividend.paymentDate.getUTCMonth() // 0-11
    const amountInBRL = dividend.amountInBRL
    const inLast12Months = dividend.paymentDate.getTime() >= last12Start

    if (paymentYear === nowYear && paymentMonth === nowMonth) {
      totalCurrentMonth += amountInBRL
    }

    if (inLast12Months) {
      const slot = last12Months.find(
        (m) => m.year === paymentYear && m.month === paymentMonth + 1
      )

      if (slot) {
        slot.total += amountInBRL
        addTo(slot.byCategoryType, category.type, amountInBRL)
      }
    }

    let assetSummary = byAsset.get(asset.id)

    if (!assetSummary) {
      assetSummary = {
        assetId: asset.id,
        name: asset.name,
        ticker: asset.ticker,
        categoryType: category.type,
        currency: category.currency,
        totalYear: 0,
        last12Months: 0,
        yieldOnCost: null
      }
      byAsset.set(asset.id, assetSummary)
    }

    if (inLast12Months) {
      assetSummary.last12Months += dividend.amount
    }

    if (paymentYear === year) {
      totalYear += amountInBRL
      assetSummary.totalYear += amountInBRL

      const monthSlot = byMonth[paymentMonth]
      monthSlot.total += amountInBRL
      addTo(monthSlot.byCategoryType, category.type, amountInBRL)

      addTo(byCategoryType, category.type, amountInBRL)

      const categorySummary = byCategory.get(category.id) ?? {
        categoryId: category.id,
        name: category.name,
        type: category.type,
        total: 0
      }
      categorySummary.total += amountInBRL
      byCategory.set(category.id, categorySummary)
    }
  }

  // Yield on Cost usa a posição atual do ativo como base de custo
  const invested = new Map(
    items.map(({ asset }) => [
      asset.id,
      (asset.quantity ?? 0) * (asset.averagePrice ?? 0)
    ])
  )

  const monthsElapsed =
    year < nowYear ? 12 : year === nowYear ? nowMonth + 1 : 1

  return {
    year,
    totalYear: round2(totalYear),
    totalCurrentMonth: round2(totalCurrentMonth),
    monthlyAverage: round2(totalYear / monthsElapsed),
    byMonth: byMonth.map(roundMonth),
    last12Months: last12Months.map(roundMonth),
    byCategoryType: Object.entries(byCategoryType)
      .map(([type, total]) => ({
        type: type as CategoryType,
        total: round2(total)
      }))
      .sort((a, b) => b.total - a.total),
    byCategory: [...byCategory.values()]
      .map((item) => ({ ...item, total: round2(item.total) }))
      .sort((a, b) => b.total - a.total),
    byAsset: [...byAsset.values()]
      .map((item) => {
        const cost = invested.get(item.assetId) ?? 0

        return {
          ...item,
          totalYear: round2(item.totalYear),
          last12Months: round2(item.last12Months),
          yieldOnCost:
            cost > 0 && item.last12Months > 0
              ? round2((item.last12Months / cost) * 100)
              : null
        }
      })
      .sort((a, b) => b.totalYear - a.totalYear)
  }
}
