import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

export const PRICE_HISTORY_RANGES = [
  '5d',
  '1m',
  'ytd',
  '1y',
  '3y',
  '5y'
] as const

export type PriceHistoryRange = (typeof PRICE_HISTORY_RANGES)[number]

export interface PricePoint {
  date: Date
  close: number
}

export abstract class PriceHistoryGateway {
  /** `null` quando o tipo não tem cotação de mercado ou a consulta falhou */
  abstract fetchHistory(
    ticker: string,
    categoryType: CategoryType,
    range: PriceHistoryRange
  ): Promise<PricePoint[] | null>
}
