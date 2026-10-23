import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class UserNotFoundError extends NotFoundError {
  constructor(message?: string) {
    super(message || 'User not found.')
    this.name = UserNotFoundError.name
  }
}
