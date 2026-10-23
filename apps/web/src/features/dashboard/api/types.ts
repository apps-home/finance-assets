export interface Budget {
  id: string
  categoryId: string
  month: number
  year: number
  amount: number
  exchangeRate?: number | null
  dividendAmount?: number | null
  createdAt: string
  updatedAt: string
}

export interface CreateBudgetDTO {
  categoryId: string
  month: number
  year: number
  amount: number
  exchangeRate?: number | null
  dividendAmount?: number | null
}

export interface UpdateBudgetDTO {
  categoryId?: string
  month?: number
  year?: number
  amount?: number
  exchangeRate?: number | null
  dividendAmount?: number | null
}

export interface ListBudgetsParams {
  categoryId?: string
  month?: number
  year?: number
}

export interface MonthlyFinancialData {
  total: number
  totalBonds: number
  totalStocks: number
  growth: number
  referenceMonth: string
  categories: { name: string; value: number }[]
}

export type GenerateInsightsPayload =
  | ({ mode: 'month' } & MonthlyFinancialData)
  | {
      mode: 'year'
      year?: string
      monthlyBreakdown: Record<string, string | number>[]
      summary: MonthlyFinancialData
    }
