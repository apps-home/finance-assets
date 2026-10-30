import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'

import { UpdatePatrimonyItemPayload } from '../../domain/dto/update-patrimony-item.dto'
import { PatrimonyItemRepository } from '../../domain/patrimony-item.repository'
import { PatrimonyItemNotFoundError } from '../errors/patrimony-item-not-found.error'

type UpdatePatrimonyItemResponse = Either<
  PatrimonyItemNotFoundError | PayloadError,
  void
>

@Injectable()
export class UpdatePatrimonyItemUseCase {
  constructor(private patrimonyItemRepository: PatrimonyItemRepository) {}

  async execute(
    userId: string,
    id: string,
    data: UpdatePatrimonyItemPayload
  ): Promise<UpdatePatrimonyItemResponse> {
    const existing = await this.patrimonyItemRepository.findById(id, userId)

    if (!existing) {
      return left(new PatrimonyItemNotFoundError())
    }

    try {
      existing.update(data)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }

    await this.patrimonyItemRepository.save(existing)

    return right(void 0)
  }
}
