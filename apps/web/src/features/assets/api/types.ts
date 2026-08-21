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
	name: string
	ticker?: string
	quantity?: number
	averagePrice?: number
	broker?: string
	isActive?: boolean
}

export interface UpdateAssetDTO {
	name?: string
	ticker?: string
	quantity?: number
	averagePrice?: number
	broker?: string
	isActive?: boolean
}

export interface AssetHTTPResponse extends Asset {
	investedValue: number | null
	currentBalance: number | null
	profitLoss: number | null
	profitabilityPercentage: number | null
}
