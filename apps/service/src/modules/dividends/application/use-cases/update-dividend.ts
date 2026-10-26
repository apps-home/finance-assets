import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'

import { DividendSource } from '../../domain/dividend.entity'
import { DividendRepository } from '../../domain/dividend.repository'
import { UpdateDividendPayload } from '../../domain/dto/update-dividend.dto'
import { DividendNotFoundError } from '../errors/dividend-not-found.error'

type UpdateDividendResponse = Either<DividendNotFoundError | PayloadError, void>

@Injectable()
export class UpdateDividendUseCase {
  constructor(private readonly dividendRepository: DividendRepository) {}

  async execute(
    userId: string,
    id: string,
    data: UpdateDividendPayload
  ): Promise<UpdateDividendResponse> {
    try {
      const dividend = await this.dividendRepository.findById(id, userId)

      if (!dividend) {
        return left(new DividendNotFoundError())
      }

      // Ao mudar taxa/quantidade sem informar o total, recalcula o total
      let amount = data.amount
      if (
        amount === undefined &&
        (data.rateAmount !== undefined || data.quantity !== undefined)
      ) {
        const rate = data.rateAmount ?? dividend.rateAmount
        const quantity = data.quantity ?? dividend.quantity

        if (rate && quantity) {
          amount = Math.round(rate * quantity * 100) / 100
        }
      }

      // O imposto é proporcional ao bruto: se o total mudou e a taxa não foi
      // informada, mantém a mesma proporção
      let taxAmount = data.taxAmount
      if (
        taxAmount === undefined &&
        amount !== undefined &&
        dividend.taxAmount &&
        amount !== dividend.amount
      ) {
        taxAmount =
          Math.round((dividend.taxAmount / dividend.amount) * amount * 100) /
          100
      }

      dividend.update({
        type: data.type,
        amount,
        taxAmount,
        rateAmount: data.rateAmount,
        quantity: data.quantity,
        exchangeRate: data.exchangeRate,
        comDate: data.comDate,
        paymentDate: data.paymentDate,
        // Edição manual protege o lançamento de ser sobrescrito pelo sync
        source: DividendSource.MANUAL
      })

      const duplicated = await this.dividendRepository.findByNaturalKey(
        dividend.assetId,
        dividend.type,
        dividend.paymentDate
      )

      if (duplicated && duplicated.id !== dividend.id) {
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
