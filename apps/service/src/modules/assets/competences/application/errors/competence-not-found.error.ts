import { NotFoundError } from '@/core/domain/errors/not-found-error'

export class CompetenceNotFoundError extends NotFoundError {
  constructor() {
    super('Competence not found')
    this.name = CompetenceNotFoundError.name
  }
}
