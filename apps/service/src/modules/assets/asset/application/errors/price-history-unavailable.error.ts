import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class PriceHistoryUnavailableError extends NotFoundError {
  constructor(message?: string) {
    super(message || 'Price history is not available for this asset')
    this.name = PriceHistoryUnavailableError.name
  }
}
