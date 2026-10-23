import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Query
} from '@nestjs/common'

import { CurrentUserId } from '@/infra/auth/current-user-id.decorator'
import { toHttpException } from '@/infra/http/to-http-exception'

import { DeleteCompetenceUseCase } from '../application/use-cases/delete-competence'
import { FindAvailableYearsUseCase } from '../application/use-cases/find-available-years'
import { FindCompetencesByCategoryUseCase } from '../application/use-cases/find-competences-by-category'

@Controller('competences')
export class CompetenceController {
  constructor(
    private readonly deleteCompetenceUseCase: DeleteCompetenceUseCase,
    private readonly findCompetencesByCategoryUseCase: FindCompetencesByCategoryUseCase,
    private readonly findAvailableYearsUseCase: FindAvailableYearsUseCase
  ) {}

  @Get('years')
  async findAvailableYears(@CurrentUserId() userId: string) {
    const result = await this.findAvailableYearsUseCase.execute(userId)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Get()
  async findByCategory(
    @Query('categoryId', new ParseUUIDPipe({ version: '4' }))
    categoryId: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.findCompetencesByCategoryUseCase.execute(
      categoryId,
      userId
    )

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUserId() userId: string
  ) {
    const result = await this.deleteCompetenceUseCase.execute(userId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return { message: 'Competence deleted successfully' }
  }
}
