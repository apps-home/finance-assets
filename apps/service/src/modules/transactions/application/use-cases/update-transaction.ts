import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { AssetNotFoundError } from '@/modules/assets/asset/application/errors/asset-not-found.error'
import { AssetRepository } from '@/modules/assets/asset/domain/asset.repository'
import { CategoryNotFoundError } from '@/modules/assets/categories/application/errors/category-not-found.error'
import { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'

import { UpdateTransactionPayload } from '../../domain/dto/create-transaction.dto'
import { buildPosition } from '../../domain/position'
import { TransactionRepository } from '../../domain/transaction.repository'
import { checkTransactionForCategory } from '../../domain/transaction-rules'
import { TransactionNotFoundError } from '../errors/transaction-not-found.error'

type UpdateTransactionResponse = Either<
  | TransactionNotFoundError
  | AssetNotFoundError
  | CategoryNotFoundError
  | PayloadError,
  void
>

@Injectable()
export class UpdateTransactionUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly assetRepository: AssetRepository,
    private readonly categoryRepository: CategoryRepository
  ) {}

  async execute(
    userId: string,
    id: string,
    data: UpdateTransactionPayload
  ): Promise<UpdateTransactionResponse> {
    const transaction = await this.transactionRepository.findById(id, userId)

    if (!transaction) {
      return left(new TransactionNotFoundError())
    }

    const asset = await this.assetRepository.findById(
      transaction.assetId,
      userId
    )

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
      transaction.update({
        ...data,
        ...(category.currency === 'BRL' && { exchangeRate: null })
      })

      const ruleError = checkTransactionForCategory(transaction, category)

      if (ruleError) {
        return left(new PayloadError(ruleError))
      }

      const others = (
        await this.transactionRepository.listByAsset(asset.id, userId)
      ).filter((item) => item.id !== transaction.id)
      const position = buildPosition([...others, transaction])

      await this.transactionRepository.saveMany([transaction])

      asset.applyPosition(position)
      await this.assetRepository.save(asset)

      return right(void 0)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }
  }
}
