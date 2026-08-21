export class CategoryNotFoundError extends Error {
  constructor(message?: string) {
    super(message || 'Category not found')
    this.name = CategoryNotFoundError.name
  }
}
