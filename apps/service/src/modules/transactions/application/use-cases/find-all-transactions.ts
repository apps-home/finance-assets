import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'

import { buildPosition } from '../../domain/position'
import type { Transaction } from '../../domain/transaction.entity'
import {
  type TransactionListItemHTTP,
  TransactionMapper
} from '../../domain/transaction.mapper'
import {
  type ListTransactionsParams,
  TransactionRepository
} from '../../domain/transaction.repository'

type FindAllTransactionsResponse = Either<Error, TransactionListItemHTTP[]>

@Injectable()
export class FindAllTransactionsUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  /**
   * Operações do usuário, da mais recente para a mais antiga. O resultado de
   * cada venda depende de todo o histórico do ativo, então o filtro de data é
   * aplicado depois de refazer a posição.
   */
  async execute({
    from,
    to,
    ...params
  }: ListTransactionsParams): Promise<FindAllTransactionsResponse> {
    const items = await this.transactionRepository.list(params)
    const byAsset = new Map<string, Transaction[]>()
    const resultById = new Map<string, number>()

    for (const { asset, transaction } of items) {
      byAsset.set(asset.id, [...(byAsset.get(asset.id) ?? []), transaction])
    }

    for (const transactions of byAsset.values()) {
      try {
        for (const sale of buildPosition(transactions).realized) {
          resultById.set(sale.transactionId, sale.result)
        }
      } catch {
        // Sequência inconsistente (não deveria acontecer): lista sem resultado
      }
    }

    return right(
      items
        .filter(
          ({ transaction }) =>
            (!from || transaction.date >= from) &&
            (!to || transaction.date <= to)
        )
        .sort(
          (a, b) =>
            b.transaction.date.getTime() - a.transaction.date.getTime() ||
            b.transaction.createdAt.getTime() -
              a.transaction.createdAt.getTime()
        )
        .map(({ transaction, asset, category }) => ({
          transaction: TransactionMapper.toHTTP(transaction),
          asset,
          category,
          result: resultById.get(transaction.id) ?? null
        }))
    )
  }
}
