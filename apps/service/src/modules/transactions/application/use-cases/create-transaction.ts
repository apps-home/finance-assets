import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { addDaysUtc } from '@/core/utils/utc-date'
import { AssetNotFoundError } from '@/modules/assets/asset/application/errors/asset-not-found.error'
import { AssetRepository } from '@/modules/assets/asset/domain/asset.repository'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'
import { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'

import { CreateTransactionPayload } from '../../domain/dto/create-transaction.dto'
import { buildPosition } from '../../domain/position'
import { Transaction, TransactionType } from '../../domain/transaction.entity'
import { TransactionRepository } from '../../domain/transaction.repository'
import { checkTransactionForCategory } from '../../domain/transaction-rules'

export interface CreateTransactionResult {
  id: string
  /** A posição que o ativo já tinha virou o saldo inicial (primeira operação) */
  openingCreated: boolean
}

type CreateTransactionResponse = Either<
  AssetNotFoundError | CategoryNotFoundError | PayloadError,
  CreateTransactionResult
>

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly assetRepository: AssetRepository,
    private readonly categoryRepository: CategoryRepository
  ) {}

  async execute(
    userId: string,
    data: CreateTransactionPayload
  ): Promise<CreateTransactionResponse> {
    const asset = await this.assetRepository.findById(data.assetId, userId)

    if (!asset) {
      return left(new AssetNotFoundError())
    }

    const category = await this.categoryRepository.findById(
      asset.categoryId,
      userId
    )

    if (!category) {
      return left(new CategoryNotFoundError())
    }

    try {
      const transaction = Transaction.create({
        ...data,
        userId,
        assetId: asset.id,
        exchangeRate: category.currency === 'BRL' ? null : data.exchangeRate
      })

      const ruleError = checkTransactionForCategory(transaction, category)

      if (ruleError) {
        return left(new PayloadError(ruleError))
      }

      const existing = await this.transactionRepository.listByAsset(
        asset.id,
        userId
      )
      const toSave = [transaction]

      // Primeira operação de um ativo que já tem posição: a posição vira o
      // saldo inicial, na véspera, e as operações seguintes partem dela
      if (
        existing.length === 0 &&
        transaction.type !== TransactionType.OPENING &&
        (asset.quantity ?? 0) > 0
      ) {
        const openingPrice = asset.averagePrice ?? asset.currentClosePrice

        if (!openingPrice) {
          return left(
            new PayloadError(
              'Set the average price of the asset before registering operations'
            )
          )
        }

        toSave.unshift(
          Transaction.create({
            userId,
            assetId: asset.id,
            type: TransactionType.OPENING,
            date: addDaysUtc(transaction.date, -1),
            quantity: asset.quantity,
            price: openingPrice,
            notes: 'Posição antes do registro de operações'
          })
        )
      }

      const position = buildPosition([...existing, ...toSave])

      await this.transactionRepository.saveMany(toSave)

      asset.applyPosition(position)
      await this.assetRepository.save(asset)

      return right({ id: transaction.id, openingCreated: toSave.length > 1 })
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }
  }
}
