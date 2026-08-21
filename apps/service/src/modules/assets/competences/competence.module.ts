import { Module } from '@nestjs/common'
import { DeleteCompetenceUseCase } from './application/use-cases/delete-competence'
import { FindAvailableYearsUseCase } from './application/use-cases/find-available-years'
import { FindCompetencesByCategoryUseCase } from './application/use-cases/find-competences-by-category'
import { CompetenceRepository } from './domain/competence.repository'
import { CompetenceController } from './infra/competence.controller'
import { PrismaCompetenceRepository } from './infra/repositories/prisma.competence.repository'

@Module({
  controllers: [CompetenceController],
  providers: [
    { provide: CompetenceRepository, useClass: PrismaCompetenceRepository },
    DeleteCompetenceUseCase,
    FindCompetencesByCategoryUseCase,
    FindAvailableYearsUseCase
  ],
  exports: [CompetenceRepository]
})
export class CompetenceModule {}
