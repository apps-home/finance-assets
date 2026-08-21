import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Query,
  Req
} from '@nestjs/common'
import { CompetenceNotFoundError } from '../application/errors/competence-not-found.error'
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
  async findAvailableYears(@Req() request: any) {
    const result = await this.findAvailableYearsUseCase.execute(
      request.headers['user-id']
    )

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case Error:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return result.value
  }

  @Get()
  async findByCategory(
    @Query('categoryId') categoryId: string,
    @Req() request: any
  ) {
    const result = await this.findCompetencesByCategoryUseCase.execute(
      categoryId,
      request.headers['user-id']
    )

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case Error:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return result.value
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.deleteCompetenceUseCase.execute(id)

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case CompetenceNotFoundError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException('Unexpected error')
      }
    }

    return { message: 'Competence deleted successfully' }
  }
}
