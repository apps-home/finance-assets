export interface CreateWishlistPayload {
	userId: string
	categoryId: string
	name: string
	ticker: string
	targetPrice?: number | null
	notes?: string | null
}
