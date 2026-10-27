import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class TransactionNotFoundError extends NotFoundError {
  constructor(message?: string) {
    super(message || 'Transaction not found')
    this.name = TransactionNotFoundError.name
  }
}
