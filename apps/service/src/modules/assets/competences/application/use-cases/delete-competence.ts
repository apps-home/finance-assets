import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { CompetenceRepository } from '../../domain/competence.repository'
import { CompetenceNotFoundError } from '../errors/competence-not-found.error'

type DeleteCompetenceResponse = Either<CompetenceNotFoundError, void>

@Injectable()
export class DeleteCompetenceUseCase {
  constructor(private competenceRepository: CompetenceRepository) {}

  async execute(userId: string, id: string): Promise<DeleteCompetenceResponse> {
    const competence = await this.competenceRepository.findById(id, userId)

    if (!competence) {
      return left(new CompetenceNotFoundError())
    }

    await this.competenceRepository.delete(id)

    return right(void 0)
  }
}
