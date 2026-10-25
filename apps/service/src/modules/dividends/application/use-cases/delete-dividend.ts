import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { DividendRepository } from '../../domain/dividend.repository'
import { DividendNotFoundError } from '../errors/dividend-not-found.error'

type DeleteDividendResponse = Either<DividendNotFoundError, void>

@Injectable()
export class DeleteDividendUseCase {
  constructor(private readonly dividendRepository: DividendRepository) {}

  async execute(userId: string, id: string): Promise<DeleteDividendResponse> {
    const dividend = await this.dividendRepository.findById(id, userId)

    if (!dividend) {
      return left(new DividendNotFoundError())
    }

    await this.dividendRepository.delete(id)

    return right(void 0)
  }
}
