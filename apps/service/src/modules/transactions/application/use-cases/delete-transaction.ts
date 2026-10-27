import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { AssetNotFoundError } from '@/modules/assets/asset/application/errors/asset-not-found.error'
import { AssetRepository } from '@/modules/assets/asset/domain/asset.repository'

import { buildPosition } from '../../domain/position'
import { TransactionRepository } from '../../domain/transaction.repository'
import { TransactionNotFoundError } from '../errors/transaction-not-found.error'

type DeleteTransactionResponse = Either<
  TransactionNotFoundError | AssetNotFoundError | PayloadError,
  void
>

@Injectable()
export class DeleteTransactionUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly assetRepository: AssetRepository
  ) {}

  async execute(
    userId: string,
    id: string
  ): Promise<DeleteTransactionResponse> {
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

    const remaining = (
      await this.transactionRepository.listByAsset(asset.id, userId)
    ).filter((item) => item.id !== transaction.id)

    try {
      // Excluir uma compra que sustenta uma venda posterior é recusado
      const position = remaining.length > 0 ? buildPosition(remaining) : null

      await this.transactionRepository.delete(transaction.id)

      // Sem operações, o ativo fica com a última posição e volta a ser editável
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
