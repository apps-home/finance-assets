import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common'
import { describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { AssetNotFoundError } from '@/modules/assets/asset/application/errors/asset-not-found.error'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'
import { BudgetNotFoundError } from '@/modules/budgets/application/errors/budget-not-found.error'

import { toHttpException } from './to-http-exception'

describe('toHttpException', () => {
  it('should map every not found error to 404', () => {
    expect(toHttpException(new AssetNotFoundError())).toBeInstanceOf(
      NotFoundException
    )
    expect(toHttpException(new CategoryNotFoundError())).toBeInstanceOf(
      NotFoundException
    )
    expect(toHttpException(new BudgetNotFoundError())).toBeInstanceOf(
      NotFoundException
    )
  })

  it('should map payload errors to 400 keeping the message', () => {
    const exception = toHttpException(new PayloadError('Invalid payload'))

    expect(exception).toBeInstanceOf(BadRequestException)
    expect(exception.message).toBe('Invalid payload')
  })

  it('should map unknown errors to 500 without leaking the message', () => {
    const exception = toHttpException(new Error('database exploded'))

    expect(exception).toBeInstanceOf(InternalServerErrorException)
    expect(exception.message).toBe('Unexpected error')
  })
})
