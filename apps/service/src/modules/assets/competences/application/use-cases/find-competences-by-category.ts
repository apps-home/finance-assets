import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/utils/Either'
import { CompetenceProps } from '../../domain/competence.entity'
import { CompetenceMapper } from '../../domain/competence.mapper'
import { CompetenceRepository } from '../../domain/competence.repository'

type FindCompetencesByCategoryResponse = Either<Error, CompetenceProps[]>

@Injectable()
export class FindCompetencesByCategoryUseCase {
  constructor(private competenceRepository: CompetenceRepository) {}

  async execute(
    categoryId: string,
    userId: string
  ): Promise<FindCompetencesByCategoryResponse> {
    const competences = await this.competenceRepository.findByCategory(
      categoryId,
      userId
    )

    return right(competences.map(CompetenceMapper.toHTTP))
  }
}
