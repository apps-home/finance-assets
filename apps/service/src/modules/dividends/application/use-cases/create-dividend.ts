import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { AssetNotFoundError } from '@/modules/assets/asset/application/errors/asset-not-found.error'
import { AssetRepository } from '@/modules/assets/asset/domain/asset.repository'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'
import { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'

import { Dividend } from '../../domain/dividend.entity'
import { DividendRepository } from '../../domain/dividend.repository'
import { defaultTaxAmount } from '../../domain/dividend-tax'
import { CreateDividendPayload } from '../../domain/dto/create-dividend.dto'

type CreateDividendResponse = Either<
  AssetNotFoundError | CategoryNotFoundError | PayloadError,
  void
>

@Injectable()
export class CreateDividendUseCase {
  constructor(
    private readonly dividendRepository: DividendRepository,
    private readonly assetRepository: AssetRepository,
    private readonly categoryRepository: CategoryRepository
  ) {}

  async execute(data: CreateDividendPayload): Promise<CreateDividendResponse> {
    try {
      const asset = await this.assetRepository.findById(
        data.assetId,
        data.userId
      )

      if (!asset) {
        return left(new AssetNotFoundError())
      }

      const category = await this.categoryRepository.findById(
        asset.categoryId,
        data.userId
      )

      if (!category) {
        return left(new CategoryNotFoundError())
      }

      const quantity = data.quantity ?? asset.quantity
      const amount =
        data.amount ??
        (data.rateAmount && quantity
          ? Math.round(data.rateAmount * quantity * 100) / 100
          : undefined)

      if (amount === undefined) {
        return left(
          new PayloadError(
            'Amount is required (or a rate amount with the asset quantity)'
          )
        )
      }

      if (category.currency !== 'BRL' && !data.exchangeRate) {
        return left(
          new PayloadError(
            `Exchange rate is required for ${category.currency} assets`
          )
        )
      }

      const dividend = Dividend.create({
        userId: data.userId,
        assetId: asset.id,
        type: data.type,
        amount,
        // Sem imposto informado vale o padrão da categoria; 0 explícito desliga
        taxAmount: data.taxAmount ?? defaultTaxAmount(category.type, amount),
        rateAmount: data.rateAmount,
        quantity,
        exchangeRate: category.currency === 'BRL' ? null : data.exchangeRate,
        comDate: data.comDate,
        paymentDate: data.paymentDate
      })

      const duplicated = await this.dividendRepository.findByNaturalKey(
        asset.id,
        dividend.type,
        dividend.paymentDate
      )

      if (duplicated) {
        return left(
          new PayloadError(
            'A dividend of this type is already registered for this asset on this date'
          )
        )
      }

      await this.dividendRepository.save(dividend)

      return right(void 0)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }
  }
}
