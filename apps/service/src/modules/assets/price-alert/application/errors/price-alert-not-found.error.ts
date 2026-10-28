import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class PriceAlertNotFoundError extends NotFoundError {
  constructor(message?: string) {
    super(message || 'Price alert not found')
    this.name = PriceAlertNotFoundError.name
  }
}
