import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { DividendProps } from '../../domain/dividend.entity'
import { DividendMapper } from '../../domain/dividend.mapper'
import { DividendRepository } from '../../domain/dividend.repository'
import { DividendNotFoundError } from '../errors/dividend-not-found.error'

type FindDividendByIdResponse = Either<
  DividendNotFoundError,
  DividendProps & { amountInBRL: number }
>

@Injectable()
export class FindDividendByIdUseCase {
  constructor(private readonly dividendRepository: DividendRepository) {}

  async execute(userId: string, id: string): Promise<FindDividendByIdResponse> {
    const dividend = await this.dividendRepository.findById(id, userId)

    if (!dividend) {
      return left(new DividendNotFoundError())
    }

    return right(DividendMapper.toHTTP(dividend))
  }
}
