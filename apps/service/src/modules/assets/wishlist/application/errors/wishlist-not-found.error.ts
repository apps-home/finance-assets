export class WishlistNotFoundError extends Error {
	constructor() {
		super('Wishlist item not found')
		this.name = WishlistNotFoundError.name
	}
}
