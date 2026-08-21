export type CategoryType = 'VARIABLE_BR' | 'VARIABLE_US' | 'CRYPTO' | 'FIXED'

export interface Category {
	id: string
	name: string
	type: CategoryType
	targetPercentage?: number | null
	currency: string
	years: number[]
	userId: string
	createdAt: string
	updatedAt: string
}

export interface CreateCategoryDTO {
	name: string
	currency: string
	type: CategoryType
	years: number[]
	targetPercentage?: number | null
}

export interface UpdateCategoryDTO {
	name?: string
	currency?: string
	type?: CategoryType
	years?: number[]
	targetPercentage?: number | null
}

export interface ListCategoriesParams {
	userId?: string
	year?: number
}
