import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { PatrimonyItemRepository } from '../../domain/patrimony-item.repository'
import { PatrimonyItemNotFoundError } from '../errors/patrimony-item-not-found.error'

type DeletePatrimonyItemResponse = Either<PatrimonyItemNotFoundError, void>

@Injectable()
export class DeletePatrimonyItemUseCase {
  constructor(private patrimonyItemRepository: PatrimonyItemRepository) {}

  async execute(
    userId: string,
    id: string
  ): Promise<DeletePatrimonyItemResponse> {
    const item = await this.patrimonyItemRepository.findById(id, userId)

    if (!item) {
      return left(new PatrimonyItemNotFoundError())
    }

    await this.patrimonyItemRepository.delete(id)

    return right(void 0)
  }
}
