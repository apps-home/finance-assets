import {
  BadRequestException,
  type HttpException,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'

import { NotFoundError } from '@/core/domain/errors/not-found-error'
import { PayloadError } from '@/core/domain/errors/payload-error'

export function toHttpException(error: Error): HttpException {
  if (error instanceof NotFoundError) {
    return new NotFoundException(error.message)
  }

  if (error instanceof PayloadError) {
    return new BadRequestException(error.message)
  }

  return new InternalServerErrorException('Unexpected error')
}
