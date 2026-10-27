import type { AssetWithCategory } from '@/features/assets/api/types'
import { type Category, CategoryType } from '@/features/categories/api/types'
import type { DividendWithAsset } from '@/features/dividends/api/types'
import type { CategoryContribution } from '@/features/transactions/api/types'

import type { MonthData } from '../types/month-data'

/** Categorias que registram proventos no fechamento */
export const VARIABLE_TYPES: CategoryType[] = [
  CategoryType.VARIABLE_BR,
  CategoryType.FII,
  CategoryType.VARIABLE_US,
  CategoryType.CRYPTO
]

/** De onde veio o valor que abre preenchido no campo */
export type ClosingAmountSource = 'saved' | 'quote' | 'previous' | null

export interface ClosingRowDefaults {
  category: Category
  /** Já existe registro no mês */
  isSaved: boolean
  /** Valor na moeda da categoria */
  amount: number | null
  amountSource: ClosingAmountSource
  /** Soma das posições pela cotação atual, na moeda da categoria */
  quoteSuggestion: number | null
  /** Proventos em R$ */
  dividend: number | null
  /** Proventos líquidos lançados no mês, em R$ */
  dividendSuggestion: number | null
  /** Aporte em R$ (negativo = resgate) */
  contribution: number | null
  /** Compras menos vendas registradas no mês, em R$ */
  contributionSuggestion: number | null
}

interface BuildClosingDefaultsInput {
  categories: Category[]
  /** Linhas do ano (`buildDashboardData`), com os registros já salvos */
  data: MonthData[]
  year: number
  /** 1-12 */
  month: number
  assets: AssetWithCategory[]
  dividends: DividendWithAsset[]
  /** Aporte de cada categoria pelas operações do mês */
  contributions?: CategoryContribution[]
  now?: Date
}

const round = (value: number) => Math.round(value * 100) / 100

/**
 * A cotação só descreve o patrimônio de agora: vale para o mês atual e para o
 * anterior (fechamento feito nos primeiros dias do mês seguinte).
 */
export function canSuggestFromQuote(year: number, month: number, now: Date) {
  const monthsAgo =
    now.getFullYear() * 12 + now.getMonth() - (year * 12 + month - 1)

  return monthsAgo === 0 || monthsAgo === 1
}

function readNumber(row: MonthData | undefined, key: string) {
  const value = row?.[key]
  return typeof value === 'number' && value > 0 ? value : null
}

/** Aporte pode ser negativo (resgate) */
function readSignedNumber(row: MonthData | undefined, key: string) {
  const value = row?.[key]
  return typeof value === 'number' && value !== 0 ? value : null
}

/** Valor registrado na moeda da categoria (o `amount` salvo já está em R$) */
function originalAmount(row: MonthData | undefined, categoryName: string) {
  const amount = readNumber(row, categoryName)
  if (amount == null) return null

  const rate = readNumber(row, `${categoryName}_exchangeRate`) ?? 1
  return round(amount / rate)
}

export function buildClosingDefaults({
  categories,
  data,
  year,
  month,
  assets,
  dividends,
  contributions = [],
  now = new Date()
}: BuildClosingDefaultsInput): ClosingRowDefaults[] {
  const row = data[month - 1]
  const previousRow = month > 1 ? data[month - 2] : undefined
  const useQuote = canSuggestFromQuote(year, month, now)

  return categories.map((category) => {
    const savedAmount = originalAmount(row, category.name)
    const isSaved = savedAmount != null
    const isVariable = VARIABLE_TYPES.includes(category.type)

    const balances = assets
      .filter((asset) => asset.categoryId === category.id)
      .map((asset) => asset.currentBalance)
      .filter((balance): balance is number => balance != null)

    const quoteSuggestion =
      useQuote && balances.length > 0
        ? round(balances.reduce((sum, value) => sum + value, 0))
        : null

    const monthDividends = isVariable
      ? dividends.filter(({ dividend, category: dividendCategory }) => {
          const paymentDate = new Date(dividend.paymentDate)

          return (
            dividendCategory.id === category.id &&
            paymentDate.getUTCFullYear() === year &&
            paymentDate.getUTCMonth() === month - 1 &&
            paymentDate.getTime() <= now.getTime()
          )
        })
      : []

    const dividendSuggestion =
      monthDividends.length > 0
        ? round(
            monthDividends.reduce(
              (sum, { dividend }) => sum + dividend.amountInBRL,
              0
            )
          )
        : null

    const contributionSuggestion =
      contributions.find((item) => item.categoryId === category.id)?.amount ??
      null

    const previousAmount = originalAmount(previousRow, category.name)

    const [amount, amountSource]: [number | null, ClosingAmountSource] = isSaved
      ? [savedAmount, 'saved']
      : quoteSuggestion != null
        ? [quoteSuggestion, 'quote']
        : previousAmount != null
          ? [previousAmount, 'previous']
          : [null, null]

    return {
      category,
      isSaved,
      amount,
      amountSource,
      quoteSuggestion,
      dividend: isSaved
        ? readNumber(row, `${category.name}_dividend`)
        : dividendSuggestion,
      dividendSuggestion,
      contribution: isSaved
        ? readSignedNumber(row, `${category.name}_contribution`)
        : contributionSuggestion,
      contributionSuggestion
    }
  })
}
