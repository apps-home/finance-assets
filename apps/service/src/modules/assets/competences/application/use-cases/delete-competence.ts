import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { CompetenceRepository } from '../../domain/competence.repository'
import { CompetenceNotFoundError } from '../errors/competence-not-found.error'

type DeleteCompetenceResponse = Either<CompetenceNotFoundError, void>

@Injectable()
export class DeleteCompetenceUseCase {
  constructor(private competenceRepository: CompetenceRepository) {}

  async execute(id: string): Promise<DeleteCompetenceResponse> {
    try {
      await this.competenceRepository.delete(id)
      return right(void 0)
    } catch {
      return left(new CompetenceNotFoundError())
    }
  }
}
