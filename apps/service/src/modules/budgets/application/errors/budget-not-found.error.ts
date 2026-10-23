import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class BudgetNotFoundError extends NotFoundError {
  constructor(message?: string) {
    super(message || 'Budget not found')
    this.name = BudgetNotFoundError.name
  }
}
