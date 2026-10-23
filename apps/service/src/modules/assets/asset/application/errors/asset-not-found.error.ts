import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class AssetNotFoundError extends NotFoundError {
  constructor(message?: string) {
    super(message || 'Asset not found')
    this.name = AssetNotFoundError.name
  }
}
