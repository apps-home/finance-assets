import { Controller, Get, Query } from '@nestjs/common'

import { parseMonthRef } from '@/core/utils/month'
import { CurrentUserId } from '@/infra/auth/current-user-id.decorator'
import { toHttpException } from '@/infra/http/to-http-exception'

import { GetPortfolioPerformanceUseCase } from '../application/use-cases/get-portfolio-performance'
import { PerformanceParamsDTO } from './performance.dto'

@Controller('performance')
export class PerformanceController {
  constructor(
    private readonly getPortfolioPerformanceUseCase: GetPortfolioPerformanceUseCase
  ) {}

  @Get()
  async get(
    @Query() params: PerformanceParamsDTO,
    @CurrentUserId() userId: string
  ) {
    const result = await this.getPortfolioPerformanceUseCase.execute(userId, {
      from: params.from ? (parseMonthRef(params.from) ?? undefined) : undefined,
      to: params.to ? (parseMonthRef(params.to) ?? undefined) : undefined,
      scope: params.scope
    })

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }
}
