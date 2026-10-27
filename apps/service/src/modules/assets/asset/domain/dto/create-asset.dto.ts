import type { FixedIncomeIndexer } from '../fixed-income-valuation'

export class CreateAssetPayload {
  name: string
  ticker?: string
  quantity?: number | null
  averagePrice?: number | null
  broker?: string | null
  isActive?: boolean
  currentClosePrice?: number | null
  indexer?: FixedIncomeIndexer | null
  indexerRate?: number | null
  investedAt?: Date | null
  maturityAt?: Date | null
  categoryId: string
}
