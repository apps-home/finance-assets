import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class DividendNotFoundError extends NotFoundError {
  constructor() {
    super('Dividend not found')
    this.name = DividendNotFoundError.name
  }
}
