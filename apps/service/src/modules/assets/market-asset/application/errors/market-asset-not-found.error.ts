import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class MarketAssetNotFoundError extends NotFoundError {
  constructor() {
    super('Market asset not found')
    this.name = MarketAssetNotFoundError.name
  }
}
