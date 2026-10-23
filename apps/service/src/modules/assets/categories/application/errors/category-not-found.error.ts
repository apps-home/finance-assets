import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class CategoryNotFoundError extends NotFoundError {
  constructor(message?: string) {
    super(message || 'Category not found')
    this.name = CategoryNotFoundError.name
  }
}
