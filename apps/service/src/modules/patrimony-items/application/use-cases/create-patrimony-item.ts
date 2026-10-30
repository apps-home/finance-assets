import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'

import { CreatePatrimonyItemPayload } from '../../domain/dto/create-patrimony-item.dto'
import { PatrimonyItemMapper } from '../../domain/patrimony-item.mapper'
import { PatrimonyItemRepository } from '../../domain/patrimony-item.repository'

type CreatePatrimonyItemResponse = Either<PayloadError, void>

@Injectable()
export class CreatePatrimonyItemUseCase {
  constructor(private patrimonyItemRepository: PatrimonyItemRepository) {}

  async execute(
    data: CreatePatrimonyItemPayload
  ): Promise<CreatePatrimonyItemResponse> {
    try {
      const item = PatrimonyItemMapper.toDomain(data)

      await this.patrimonyItemRepository.save(item)

      return right(void 0)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }
  }
}
