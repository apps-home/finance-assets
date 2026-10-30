export interface Budget {
  id: string
  categoryId: string
  month: number
  year: number
  amount: number
  exchangeRate?: number | null
  dividendAmount?: number | null
  contributionAmount?: number | null
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
  contributionAmount?: number | null
}

export interface UpdateBudgetDTO {
  categoryId?: string
  month?: number
  year?: number
  amount?: number
  exchangeRate?: number | null
  dividendAmount?: number | null
  contributionAmount?: number | null
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

export enum PatrimonyItemType {
  REAL_ESTATE = 'REAL_ESTATE',
  VEHICLE = 'VEHICLE',
  EQUIPMENT = 'EQUIPMENT',
  OTHER_ASSET = 'OTHER_ASSET',
  LIABILITY = 'LIABILITY'
}

export type PatrimonyScope = 'financial' | 'net-worth'

export interface PatrimonyItem {
  id: string
  userId: string
  name: string
  type: PatrimonyItemType
  currentValue: number
  purchaseValue: number | null
  acquiredAt: string | null
  notes: string | null
  isActive: boolean
  isAsset: boolean
  isLiability: boolean
  createdAt: string
  updatedAt: string
}

export interface PatrimonySummary {
  totalPhysicalAssets: number
  totalLiabilities: number
  netPhysicalBalance: number
}

export interface ListPatrimonyItemsResponse {
  items: PatrimonyItem[]
  summary: PatrimonySummary
}

export interface CreatePatrimonyItemDTO {
  name: string
  type: PatrimonyItemType
  currentValue: number
  purchaseValue?: number | null
  acquiredAt?: string | null
  notes?: string | null
  isActive?: boolean
}

export type UpdatePatrimonyItemDTO = Partial<CreatePatrimonyItemDTO>

export interface ListPatrimonyItemsParams {
  type?: PatrimonyItemType
  isActive?: boolean
}

export enum PatrimonyItemType {
	REAL_ESTATE = 'REAL_ESTATE',
	VEHICLE = 'VEHICLE',
	EQUIPMENT = 'EQUIPMENT',
	OTHER_ASSET = 'OTHER_ASSET',
	LIABILITY = 'LIABILITY'
}

export type PatrimonyScope = 'financial' | 'net-worth'

export interface PatrimonyItem {
	id: string
	userId: string
	name: string
	type: PatrimonyItemType
	currentValue: number
	purchaseValue: number | null
	acquiredAt: string | null
	notes: string | null
	isActive: boolean
	isAsset: boolean
	isLiability: boolean
	createdAt: string
	updatedAt: string
}

export interface PatrimonySummary {
	totalPhysicalAssets: number
	totalLiabilities: number
	netPhysicalBalance: number
}

export interface ListPatrimonyItemsResponse {
	items: PatrimonyItem[]
	summary: PatrimonySummary
}

export interface CreatePatrimonyItemDTO {
	name: string
	type: PatrimonyItemType
	currentValue: number
	purchaseValue?: number | null
	acquiredAt?: string | null
	notes?: string | null
	isActive?: boolean
}

export type UpdatePatrimonyItemDTO = Partial<CreatePatrimonyItemDTO>

export interface ListPatrimonyItemsParams {
	type?: PatrimonyItemType
	isActive?: boolean
}
