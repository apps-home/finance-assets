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
