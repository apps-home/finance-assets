import type {
  CategorySummary,
  CategoryType
} from '@/features/categories/api/types'

export enum DividendType {
  DIVIDEND = 'DIVIDEND',
  JCP = 'JCP',
  INCOME = 'INCOME',
  OTHER = 'OTHER'
}

export enum DividendSource {
  MANUAL = 'MANUAL',
  SYNC = 'SYNC'
}

export interface Dividend {
  id: string
  userId: string
  assetId: string
  type: DividendType
  source: DividendSource
  /** Total recebido, na moeda da categoria do ativo */
  amount: number
  rateAmount: number | null
  quantity: number | null
  exchangeRate: number | null
  comDate: string | null
  paymentDate: string
  amountInBRL: number
  createdAt: string
  updatedAt: string
}

export interface DividendAssetSummary {
  id: string
  name: string
  ticker: string
  quantity: number | null
  averagePrice: number | null
}

export interface DividendWithAsset {
  dividend: Dividend
  asset: DividendAssetSummary
  category: CategorySummary
}

export interface CreateDividendDTO {
  assetId: string
  type?: DividendType
  amount?: number
  rateAmount?: number
  quantity?: number
  exchangeRate?: number
  comDate?: string
  paymentDate: string
}

export type UpdateDividendDTO = Partial<Omit<CreateDividendDTO, 'assetId'>>

export interface ListDividendsParams {
  assetId?: string
  categoryId?: string
  categoryType?: CategoryType
  type?: DividendType
  year?: number
}

export type TotalsByCategoryType = Partial<Record<CategoryType, number>>

export interface DividendsMonthSummary {
  year: number
  /** 1-12 */
  month: number
  total: number
  byCategoryType: TotalsByCategoryType
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
  byCategoryType: Array<{ type: CategoryType; total: number }>
  byCategory: Array<{
    categoryId: string
    name: string
    type: CategoryType
    total: number
  }>
  byAsset: DividendsByAssetSummary[]
}
