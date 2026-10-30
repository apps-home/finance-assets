import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class PatrimonyItemNotFoundError extends NotFoundError {
  constructor(message?: string) {
    super(message || 'Patrimony item not found')
    this.name = PatrimonyItemNotFoundError.name
  }
}
