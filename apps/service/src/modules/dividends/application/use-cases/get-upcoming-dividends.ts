import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'

import {
  DividendMapper,
  DividendWithAssetHTTPResponse
} from '../../domain/dividend.mapper'
import { DividendRepository } from '../../domain/dividend.repository'

type GetUpcomingDividendsResponse = Either<
  Error,
  DividendWithAssetHTTPResponse[]
>

@Injectable()
export class GetUpcomingDividendsUseCase {
  constructor(private readonly dividendRepository: DividendRepository) {}

  async execute(userId: string): Promise<GetUpcomingDividendsResponse> {
    const now = new Date()

    const items = await this.dividendRepository.list({ userId, from: now })

    return right(
      items
        .filter(
          ({ dividend }) => dividend.paymentDate.getTime() > now.getTime()
        )
        .sort(
          (a, b) =>
            a.dividend.paymentDate.getTime() - b.dividend.paymentDate.getTime()
        )
        .map(DividendMapper.toHTTPWithAsset)
    )
  }
}
