import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/utils/Either'
import { CompetenceRepository } from '../../domain/competence.repository'

type FindAvailableYearsResponse = Either<Error, number[]>

@Injectable()
export class FindAvailableYearsUseCase {
  constructor(private competenceRepository: CompetenceRepository) {}

  async execute(userId: string): Promise<FindAvailableYearsResponse> {
    const years = await this.competenceRepository.findAvailableYears(userId)

    return right(years)
  }
}
