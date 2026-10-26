import type {
  CategorySummary,
  CategoryType
} from '@/features/categories/api/types'

export interface Asset {
  id: string
  categoryId: string
  name: string
  ticker: string
  quantity: number | null
  averagePrice: number | null
  broker: string | null
  isActive: boolean
  currentClosePrice: number | null
  lastMonthClosePrice: number | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateAssetDTO {
  categoryId: string
  name: string
  ticker?: string | null
  quantity?: number | null
  averagePrice?: number | null
  broker?: string | null
  isActive?: boolean
  currentClosePrice?: number | null
}

export type UpdateAssetDTO = Partial<Omit<CreateAssetDTO, 'categoryId'>>

export interface AssetHTTPResponse extends Asset {
  investedValue: number | null
  currentBalance: number | null
  profitLoss: number | null
  profitabilityPercentage: number | null
}

export interface AssetWithCategory extends AssetHTTPResponse {
  category: CategorySummary
}

export interface ListAssetsParams {
  search?: string
  categoryId?: string
  type?: CategoryType
  status?: 'ACTIVE' | 'INACTIVE'
  sort?: 'monthChange'
  order?: 'asc' | 'desc'
}

export interface PortfolioPosition {
  id: string
  name: string
  ticker: string
  broker: string | null
  categoryName: string
  categoryType: CategoryType
  investedValue: number
  currentBalance: number
  profitLoss: number
  profitabilityPercentage: number | null
  portfolioPercentage: number
  monthChangePercentage: number | null
}

export interface PortfolioAllocation {
  key: string
  name: string
  currentBalance: number
  percentage: number
  profitLoss: number
  assetsCount: number
}

export interface FixedIncomePosition {
  id: string
  name: string
  ticker: string
  broker: string | null
  categoryName: string
  currency: string
  originalBalance: number
  currentBalance: number
  percentage: number
}

export interface MacroAllocation {
  variableBalance: number
  variablePercentage: number
  fixedBalance: number
  fixedPercentage: number
  totalBalance: number
}

export interface FixedIncomeSummary {
  currentBalance: number
  assetsCount: number
  positions: FixedIncomePosition[]
  allocationByCurrency: PortfolioAllocation[]
  allocationByBroker: PortfolioAllocation[]
}

export interface PortfolioSummary {
  totals: {
    investedValue: number
    currentBalance: number
    profitLoss: number
    profitabilityPercentage: number | null
    assetsCount: number
  }
  fixedIncome: FixedIncomeSummary
  macroAllocation: MacroAllocation
  allocationByCategory: PortfolioAllocation[]
  allocationByBroker: PortfolioAllocation[]
  topHoldings: PortfolioPosition[]
  bestPerformers: PortfolioPosition[]
  worstPerformers: PortfolioPosition[]
  monthMovers: {
    gainers: PortfolioPosition[]
    losers: PortfolioPosition[]
  }
}

export type PriceHistoryRange = '5d' | '1m' | 'ytd' | '1y' | '3y' | '5y'

export interface PriceHistoryPoint {
  date: string
  close: number
}

export interface PriceHistory {
  ticker: string
  currency: string
  range: PriceHistoryRange
  points: PriceHistoryPoint[]
  change: number
  changePercent: number | null
}

export interface RefreshQuotesResult {
  message: string
  /** Cotações buscadas agora */
  updated: number
  /** Atualizadas há menos de 5 min: o servidor não buscou de novo */
  skipped: number
  /** Sem cotação do provider; o preço anterior foi mantido */
  failedTickers: string[]
}
